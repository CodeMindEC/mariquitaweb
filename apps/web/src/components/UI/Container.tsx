import { useEffect, useMemo, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { StoreCollection, StoreProduct } from "../../lib/medusajs/products"
import { computePriceRangeFromProducts } from "../../lib/meilisearch/converters"
import { resolveProductPricing } from "../../lib/medusajs/pricing"
import FilterSidebar from "./catalog/FilterSidebar"
import ProductResults from "./catalog/ProductResults"
import {
    useMeilisearchCatalog,
    type CatalogResultPayload,
} from "./catalog/useMeilisearchCatalog"

interface Props {
    categories: HttpTypes.StoreProductCategory[]
    collections: StoreCollection[]
    tags: HttpTypes.StoreProductTag[]
    types: HttpTypes.StoreProductType[]
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

const deriveTopLevelCategories = (categories: HttpTypes.StoreProductCategory[]) =>
    categories.filter((cat) => !cat.parent_category_id)

const FALLBACK_LIMIT = 12

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
        () => computePriceRangeFromProducts(initialResult.products),
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
    const [selectedWeight, setSelectedWeight] = useState<number | null>(null)
    const [maxPrice, setMaxPrice] = useState<number>(() =>
        clampPrice(initialMaxPrice, initialPriceBounds.max),
    )
    const [maxPriceDirty, setMaxPriceDirty] = useState<boolean>(() =>
        typeof initialMaxPrice === "number" && initialMaxPrice > 0,
    )
    const [showFilters, setShowFilters] = useState(false)
    const catalogLimit = initialResult.limit || FALLBACK_LIMIT

    // Crear mapa de tag IDs a valores para Meilisearch
    const tagIdToValue = useMemo(() => {
        const map = new Map<string, string>()
        tags.forEach(tag => {
            if (tag.id && tag.value) {
                map.set(tag.id, tag.value)
            }
        })
        return map
    }, [tags])

    // Convertir IDs de tags seleccionados a valores para Meilisearch
    const selectedTagValues = useMemo(() => {
        return selectedTags.map(id => tagIdToValue.get(id) || id).filter(Boolean)
    }, [selectedTags, tagIdToValue])

    // Usar Meilisearch para los filtros del catálogo
    const { result, loading, loadingMore, hasMore, loadMore, error } = useMeilisearchCatalog({
        initialResult,
        filters: {
            categoryIds: selectedCategories,
            collectionId: selectedCollection,
            tagIds: selectedTagValues,
            typeIds: selectedType ? [selectedType] : [],
            weight: selectedWeight,
            limit: catalogLimit,
            status: "published",
        },
    })

    const fallbackPriceBounds = useMemo(
        () => computePriceRangeFromProducts(result.products),
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
                (category): category is HttpTypes.StoreProductCategory => Boolean(category.id),
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
                (tag): tag is HttpTypes.StoreProductTag => Boolean(tag.id && (tag.value ?? "") !== ""),
            ),
        [tags],
    )

    const typesToShow = useMemo(
        () =>
            types.filter(
                (type): type is HttpTypes.StoreProductType => Boolean(type.id && (type.value ?? "") !== ""),
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
        // Resetear peso cuando se cambia de colección
        setSelectedWeight(null)
    }

    const handleWeightSelect = (weight: number | null) => {
        setSelectedWeight(weight)
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
        setSelectedWeight(null)
        setMaxPrice(priceBounds.max)
        setMaxPriceDirty(false)
    }

    const filteredProducts = useMemo(
        () => result.products.filter((product) => {
            const price = resolveProductPricing(product).price
            return typeof price === "number" && price <= maxPrice
        }),
        [result.products, maxPrice],
    )

    const activeFilterCount =
        selectedCategories.length +
        (selectedCollection ? 1 : 0) +
        selectedTags.length +
        (selectedType ? 1 : 0) +
        (selectedWeight !== null ? 1 : 0) +
        (maxPrice < priceBounds.max ? 1 : 0)
    const hasActiveFilters = activeFilterCount > 0
    const totalProductsLabel =
        result.count && result.count !== filteredProducts.length
            ? `${filteredProducts.length} / ${result.count}`
            : String(filteredProducts.length)
    const isInitialLoading = loading && result.products.length === 0
    const isRefining = loading && result.products.length > 0

    return (
        <div className="site-container w-full overflow-x-hidden ">
            <div className="w-full relative flex flex-col lg:flex-row gap-4 lg:gap-6 py-4 lg:py-5">
                <div className="z-100 md:z-auto">
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
                        selectedWeight={selectedWeight}
                        hasActiveFilters={hasActiveFilters}
                        activeFilterCount={activeFilterCount}
                        maxPrice={maxPrice}
                        priceBounds={priceBounds}
                        onCategoryToggle={toggleCategory}
                        onCollectionSelect={handleCollectionSelect}
                        onTagToggle={toggleTag}
                        onTypeSelect={handleTypeSelect}
                        onWeightSelect={handleWeightSelect}
                        onPriceChange={handlePriceChange}
                    />
                </div>

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
                    isRefining={isRefining}
                />
            </div>
        </div>
    )
}
