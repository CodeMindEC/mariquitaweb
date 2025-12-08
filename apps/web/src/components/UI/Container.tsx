import { useEffect, useMemo, useState } from "react"
import type {
    StoreCollection,
    StoreProduct,
    StoreProductCategory,
    StoreProductTag,
    StoreProductType,
} from "../../lib/medusajs/products"
import { resolveProductPricing } from "../../lib/medusajs/pricing"
import FilterSidebar from "./catalog/FilterSidebar"
import ProductResults from "./catalog/ProductResults"
import {
    useCatalogResults,
    type CatalogResultPayload,
} from "./catalog/useCatalogResults"

interface Props {
    categories: StoreProductCategory[]
    collections: StoreCollection[]
    tags: StoreProductTag[]
    types: StoreProductType[]
    initialResult: CatalogResultPayload
    initialCategoryIds?: string[]
    initialCollectionId?: string | null
    initialTagIds?: string[]
    initialTypeId?: string | null
    initialMaxPrice?: number | null
}

const sanitizeIds = (ids?: (string | null)[]) =>
    Array.from(
        new Set((ids ?? []).filter((value): value is string => Boolean(value))),
    )

const deriveTopLevelCategories = (categories: StoreProductCategory[]) =>
    categories.filter((cat) => !cat.parent_category_id)

const FALLBACK_LIMIT = 12

const derivePriceBoundaries = (products: StoreProduct[]) => {
    const prices = products
        .map((product) => resolveProductPricing(product).price)
        .filter((price) => typeof price === "number" && price >= 0)

    if (!prices.length) {
        return { min: 0, max: 100 }
    }

    const min = Math.max(0, Math.floor(Math.min(...prices)))
    const max = Math.max(min + 1, Math.ceil(Math.max(...prices)))

    return {
        min,
        max,
    }
}

const getProductPriceInUnits = (product: StoreProduct) =>
    resolveProductPricing(product).price

const clampPrice = (value: number | null | undefined, max: number) =>
    typeof value === "number" && value > 0 ? Math.min(value, max) : max

export default function Container({
    categories,
    collections,
    tags,
    types,
    initialResult,
    initialCategoryIds,
    initialCollectionId,
    initialTagIds,
    initialTypeId,
    initialMaxPrice,
}: Props) {
    const topLevel = useMemo(() => deriveTopLevelCategories(categories), [categories])
    const initialPriceBounds = useMemo(
        () => derivePriceBoundaries(initialResult.products),
        [initialResult.products],
    )

    const sanitizedInitialCategories = useMemo(
        () => sanitizeIds(initialCategoryIds),
        [initialCategoryIds],
    )
    const sanitizedInitialTags = useMemo(
        () => sanitizeIds(initialTagIds),
        [initialTagIds],
    )

    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        sanitizedInitialCategories,
    )
    const [selectedCollection, setSelectedCollection] = useState<string | null>(
        initialCollectionId ?? null,
    )
    const [selectedTags, setSelectedTags] = useState<string[]>(sanitizedInitialTags)
    const [selectedType, setSelectedType] = useState<string | null>(initialTypeId ?? null)
    const [maxPrice, setMaxPrice] = useState<number>(() =>
        clampPrice(initialMaxPrice, initialPriceBounds.max),
    )
    const [maxPriceDirty, setMaxPriceDirty] = useState<boolean>(() =>
        typeof initialMaxPrice === "number" && initialMaxPrice > 0,
    )
    const [showFilters, setShowFilters] = useState(false)
    const catalogLimit = initialResult.limit || FALLBACK_LIMIT

    const { result, loading, loadingMore, hasMore, loadMore, error } = useCatalogResults({
        initialResult,
        filters: {
            categoryIds: selectedCategories,
            collectionId: selectedCollection,
            tagIds: selectedTags,
            typeIds: selectedType ? [selectedType] : [],
            limit: catalogLimit,
            status: "published",
        },
    })

    const fallbackPriceBounds = useMemo(
        () => derivePriceBoundaries(result.products),
        [result.products],
    )

    const skeletonCount = useMemo(() => {
        const base = catalogLimit || FALLBACK_LIMIT
        return Math.min(Math.max(base, 3), 12)
    }, [catalogLimit])

    const priceBounds = useMemo(() => {
        if (result.priceRange) {
            const min = Math.max(0, Math.floor(result.priceRange.min ?? fallbackPriceBounds.min))
            const maxCandidate = result.priceRange.max ?? fallbackPriceBounds.max
            const max = Math.max(min + 1, Math.ceil(maxCandidate ?? fallbackPriceBounds.max))
            return { min, max }
        }
        return fallbackPriceBounds
    }, [fallbackPriceBounds, result.priceRange])

    const categoriesToShow = useMemo(
        () =>
            (topLevel.length ? topLevel : categories).filter(
                (category): category is StoreProductCategory => Boolean(category.id),
            ),
        [topLevel, categories],
    )

    const collectionsToShow = useMemo(
        () =>
            collections.filter(
                (collection): collection is StoreCollection => Boolean(collection.id),
            ),
        [collections],
    )

    const tagsToShow = useMemo(
        () =>
            tags.filter(
                (tag): tag is StoreProductTag => Boolean(tag.id && (tag.value ?? "") !== ""),
            ),
        [tags],
    )

    const typesToShow = useMemo(
        () =>
            types.filter(
                (type): type is StoreProductType => Boolean(type.id && (type.value ?? "") !== ""),
            ),
        [types],
    )

    useEffect(() => {
        setMaxPrice((prev) => {
            const bounded = Math.min(Math.max(prev, priceBounds.min), priceBounds.max)
            if (!maxPriceDirty) {
                return priceBounds.max
            }
            return bounded
        })
    }, [maxPriceDirty, priceBounds.max, priceBounds.min])

    useEffect(() => {
        if (typeof window === "undefined") return

        const params = new URLSearchParams(window.location.search)
        params.delete("category_id")
        selectedCategories.forEach((categoryId) => params.append("category_id", categoryId))

        params.delete("tag")
        selectedTags.forEach((tagId) => params.append("tag", tagId))

        if (selectedCollection) {
            params.set("collection_id", selectedCollection)
        } else {
            params.delete("collection_id")
        }

        if (selectedType) {
            params.set("type_id", selectedType)
        } else {
            params.delete("type_id")
        }

        if (maxPrice < priceBounds.max) {
            params.set("max_price", String(Math.round(maxPrice)))
        } else {
            params.delete("max_price")
        }

        const queryString = params.toString()
        const newUrl = queryString
            ? `${window.location.pathname}?${queryString}`
            : window.location.pathname

        window.history.replaceState(null, "", newUrl)
    }, [selectedCategories, selectedCollection, selectedTags, selectedType, maxPrice, priceBounds.max])

    const toggleCategory = (categoryId: string) => {
        if (!categoryId) return
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId],
        )
    }

    const handleCollectionSelect = (collectionId: string | null) => {
        setSelectedCollection(collectionId)
    }

    const toggleTag = (tagId: string) => {
        if (!tagId) return
        setSelectedTags((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
        )
    }

    const handleTypeSelect = (typeId: string | null) => {
        setSelectedType(typeId)
    }

    const handlePriceChange = (value: number) => {
        setMaxPriceDirty(true)
        setMaxPrice(value)
    }

    const clearFilters = () => {
        if (!hasActiveFilters) return
        setSelectedCategories([])
        setSelectedCollection(null)
        setSelectedTags([])
        setSelectedType(null)
        setMaxPrice(priceBounds.max)
        setMaxPriceDirty(false)
    }

    const filteredProducts = useMemo(
        () => result.products.filter((product) => getProductPriceInUnits(product) <= maxPrice),
        [result.products, maxPrice],
    )

    const activeFilterCount =
        selectedCategories.length +
        (selectedCollection ? 1 : 0) +
        selectedTags.length +
        (selectedType ? 1 : 0) +
        (maxPrice < priceBounds.max ? 1 : 0)
    const hasActiveFilters = activeFilterCount > 0
    const totalProductsLabel =
        result.count && result.count !== filteredProducts.length
            ? `${filteredProducts.length} / ${result.count}`
            : String(filteredProducts.length)
    const isInitialLoading = loading && result.products.length === 0

    return (
        <div className="site-container w-full overflow-x-hidden ">
            <div className="w-full relative flex flex-col lg:flex-row gap-4 lg:gap-6 py-4 lg:py-5">
                <FilterSidebar
                    isOpen={showFilters}
                    onToggle={() => setShowFilters((prev) => !prev)}
                    onClose={() => setShowFilters(false)}
                    categories={categoriesToShow}
                    collections={collectionsToShow}
                    tags={tagsToShow}
                    types={typesToShow}
                    selectedCategories={selectedCategories}
                    selectedCollection={selectedCollection}
                    selectedTags={selectedTags}
                    selectedType={selectedType}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    maxPrice={maxPrice}
                    priceBounds={priceBounds}
                    onCategoryToggle={toggleCategory}
                    onCollectionSelect={handleCollectionSelect}
                    onTagToggle={toggleTag}
                    onTypeSelect={handleTypeSelect}
                    onPriceChange={handlePriceChange}
                />

                <ProductResults
                    totalProductsLabel={totalProductsLabel}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                    error={error}
                    isInitialLoading={isInitialLoading}
                    filteredProducts={filteredProducts}
                    skeletonCount={skeletonCount}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    loading={loading}
                />
            </div>
        </div>
    )
}
