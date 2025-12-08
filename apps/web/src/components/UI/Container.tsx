import { useEffect, useMemo, useState } from "react"
import type {
    StoreCollection,
    StoreProduct,
    StoreProductCategory,
} from "../../lib/medusajs/products"
import { formatPrice } from "../../lib/medusajs/products"
import { resolveProductPricing } from "../../lib/medusajs/pricing"
import Card from "./Card"
import FilterIcon from "../../assets/Container/filter.svg"
import DownIcon from "../../assets/Container/down.svg"

const getAssetSrc = (asset: string | { src: string }) =>
    typeof asset === "string" ? asset : asset.src

const filterIconSrc = getAssetSrc(FilterIcon)
const downIconSrc = getAssetSrc(DownIcon)

interface Props {
    categories: StoreProductCategory[]
    collections: StoreCollection[]
    initialProducts: StoreProduct[]
    initialCategoryIds?: string[]
    initialCollectionId?: string | null
    initialMaxPrice?: number | null
}

const sanitizeIds = (ids?: (string | null)[]) =>
    Array.from(
        new Set((ids ?? []).filter((value): value is string => Boolean(value))),
    )

const deriveTopLevelCategories = (categories: StoreProductCategory[]) =>
    categories.filter((cat) => !cat.parent_category_id)

const derivePriceBoundaries = (products: StoreProduct[]) => {
    let max = 0
    const prices = products.map((product) => resolveProductPricing(product).price)
    if (prices.length) {
        max = Math.ceil(Math.max(...prices))
    }
    return {
        max: max || 100,
    }
}

const getProductPriceInUnits = (product: StoreProduct) =>
    resolveProductPricing(product).price

const clampPrice = (value: number | null | undefined, max: number) =>
    typeof value === "number" && value > 0 ? Math.min(value, max) : max

export default function Container({
    categories,
    collections,
    initialProducts,
    initialCategoryIds,
    initialCollectionId,
    initialMaxPrice,
}: Props) {
    const topLevel = useMemo(() => deriveTopLevelCategories(categories), [categories])
    const priceBounds = useMemo(
        () => derivePriceBoundaries(initialProducts),
        [initialProducts],
    )

    const sanitizedInitialCategories = useMemo(
        () => sanitizeIds(initialCategoryIds),
        [initialCategoryIds],
    )

    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        sanitizedInitialCategories,
    )
    const [selectedCollection, setSelectedCollection] = useState<string | null>(
        initialCollectionId ?? null,
    )
    const [maxPrice, setMaxPrice] = useState<number>(() =>
        clampPrice(initialMaxPrice, priceBounds.max),
    )
    const [showFilters, setShowFilters] = useState(false)

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

    useEffect(() => {
        setMaxPrice((prev) => (prev > priceBounds.max ? priceBounds.max : prev))
    }, [priceBounds.max])

    useEffect(() => {
        if (typeof window === "undefined") return

        const params = new URLSearchParams(window.location.search)
        params.delete("category_id")
        selectedCategories.forEach((categoryId) => params.append("category_id", categoryId))

        if (selectedCollection) {
            params.set("collection_id", selectedCollection)
        } else {
            params.delete("collection_id")
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
    }, [selectedCategories, selectedCollection, maxPrice, priceBounds.max])

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

    const clearFilters = () => {
        if (!hasActiveFilters) return
        setSelectedCategories([])
        setSelectedCollection(null)
        setMaxPrice(priceBounds.max)
    }

    const filteredProducts = useMemo(() => {
        const selectedCategorySet = new Set(selectedCategories)
        return initialProducts.filter((product) => {
            const priceMatches = getProductPriceInUnits(product) <= maxPrice
            const categoryMatches =
                selectedCategorySet.size === 0 ||
                product.categories?.some(
                    (cat) => cat.id && selectedCategorySet.has(cat.id),
                )
            const collectionMatches =
                !selectedCollection ||
                product.collection_id === selectedCollection ||
                product.collection?.id === selectedCollection
            return priceMatches && categoryMatches && collectionMatches
        })
    }, [initialProducts, maxPrice, selectedCategories, selectedCollection])

    const activeFilterCount =
        selectedCategories.length +
        (selectedCollection ? 1 : 0) +
        (maxPrice < priceBounds.max ? 1 : 0)
    const hasActiveFilters = activeFilterCount > 0

    return (
        <div className="site-container w-full overflow-x-hidden">
            <div className="w-full relative flex flex-col lg:flex-row gap-4 lg:gap-6 py-4 lg:py-5">
                <button
                    className="lg:hidden fixed top-20 left-4 w-12 h-12 bg-[#d5d5d5] text-white rounded-full flex items-center justify-center shadow-lg"
                    onClick={() => setShowFilters((prev) => !prev)}
                    aria-label="Mostrar filtros"
                >
                    <img src={filterIconSrc} alt="Filtros" className="w-6 h-6" />
                </button>

                {showFilters && (
                    <button
                        className="fixed inset-0 bg-black/50 lg:hidden"
                        onClick={() => setShowFilters(false)}
                        aria-label="Cerrar filtros"
                    />
                )}

                <aside
                    className={`fixed top-0 left-0 h-screen w-[300px] bg-white shadow-lg p-5 flex flex-col gap-6 transform transition-transform duration-300 overflow-y-auto ${showFilters ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative lg:h-auto lg:w-[300px] lg:shadow-none lg:p-0 lg:overflow-visible lg:bg-transparent`}
                    aria-label="Filtros de catálogo"
                >
                    <button
                        className="lg:hidden absolute top-4 right-4 text-2xl text-[#333] z-10"
                        onClick={() => setShowFilters(false)}
                        aria-label="Ocultar filtros"
                    >
                        ✕
                    </button>

                    <div className="flex items-center gap-3 pb-3 border-b border-[#d4f3f7] relative mt-8 lg:mt-0">
                        <img src={filterIconSrc} alt="Filtros" width={20} height={20} />
                        <span className="text-lg lg:text-xl font-bold text-[#333] flex items-center gap-2">
                            Filtros
                            {hasActiveFilters && (
                                <span className="text-xs font-semibold bg-[#299037] text-white px-2 py-0.5 rounded-full min-w-[22px] text-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </span>
                    </div>

                    <details className="group" open>
                        <summary className="flex items-center justify-between w-full cursor-pointer py-2 text-[#333] font-medium list-none hover:bg-[#d4f3f7] rounded-2xl p-4 -mx-4 px-4">
                            <span className="text-base">Categorías</span>
                            <img
                                src={downIconSrc}
                                alt="Expandir"
                                width={20}
                                height={20}
                                className="transition-transform duration-300 group-open:rotate-180 opacity-70"
                            />
                        </summary>
                        <ul className="mt-2 flex flex-col gap-3 px-4 pb-2">
                            {categoriesToShow.map((category) => (
                                <li key={category.id!} className="flex items-center gap-3 text-[#333] pl-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(category.id!)}
                                        className="w-4 h-4 rounded border-[#bcdfe4] text-[#299037] focus:ring-[#299037]"
                                        aria-label={`Filtrar por ${category.name ?? "categoría"}`}
                                        onChange={() => toggleCategory(category.id!)}
                                    />
                                    <label className="cursor-pointer text-sm">
                                        {category.name ?? "Sin nombre"}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </details>

                    {collectionsToShow.length > 0 && (
                        <details className="group" open>
                            <summary className="flex items-center justify-between w-full cursor-pointer py-2 text-[#333] font-medium list-none hover:bg-[#d4f3f7] rounded-2xl p-4 -mx-4 px-4">
                                <span className="text-base">Colecciones</span>
                                <img
                                    src={downIconSrc}
                                    alt="Expandir"
                                    width={20}
                                    height={20}
                                    className="transition-transform duration-300 group-open:rotate-180 opacity-70"
                                />
                            </summary>
                            <div className="mt-3 px-4 flex flex-col gap-2 pb-2">
                                <button
                                    type="button"
                                    className={`rounded-2xl px-4 py-2 text-left text-sm transition ${selectedCollection === null
                                        ? "bg-[#d4f3f7] text-[#299037]"
                                        : "text-[#333] hover:bg-[#e8fbfd]"
                                        }`}
                                    onClick={() => handleCollectionSelect(null)}
                                >
                                    Todas las colecciones
                                </button>
                                {collectionsToShow.map((collection) => {
                                    const id = collection.id!
                                    const isActive = selectedCollection === id
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-2 text-sm transition ${isActive
                                                ? "bg-[#d4f3f7] text-[#299037]"
                                                : "text-[#333] hover:bg-[#e8fbfd]"
                                                }`}
                                            aria-pressed={isActive ? "true" : "false"}
                                            onClick={() => handleCollectionSelect(isActive ? null : id)}
                                        >
                                            <span>
                                                {collection.title ?? collection.handle ?? "Colección"}
                                            </span>
                                            {isActive && <span className="text-xs font-semibold">Activo</span>}
                                        </button>
                                    )
                                })}
                            </div>
                        </details>
                    )}

                    <details className="group" open>
                        <summary className="flex items-center justify-between w-full cursor-pointer py-2 text-[#333] font-medium list-none hover:bg-[#d4f3f7] rounded-2xl p-4 -mx-4 px-4">
                            <span className="text-base">Rango de precios</span>
                            <img
                                src={downIconSrc}
                                alt="Expandir"
                                width={20}
                                height={20}
                                className="transition-transform duration-300 group-open:rotate-180 opacity-70"
                            />
                        </summary>
                        <div className="mt-3 px-4 flex flex-col gap-3 pb-2">
                            <div className="flex justify-between text-sm text-[#333] opacity-80">
                                <span>{formatPrice(0)}</span>
                                <span>{formatPrice(maxPrice)}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={priceBounds.max}
                                value={maxPrice}
                                className="w-full accent-[#299037]"
                                aria-label="Rango máximo de precio"
                                onChange={(event) => setMaxPrice(Number(event.target.value))}
                            />
                        </div>
                    </details>
                </aside>

                <section className="flex-1 flex flex-col gap-4 w-full overflow-x-hidden">
                    <div className="flex items-center justify-between px-4 sm:px-6">
                        <p className="text-base lg:text-lg font-semibold text-[#333]">
                            Productos ({filteredProducts.length})
                        </p>
                        {hasActiveFilters && (
                            <button
                                className="text-sm text-[#299037] underline"
                                onClick={clearFilters}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="px-4 sm:px-6 py-10 text-center text-[#666] border border-dashed border-[#d5d5d5] rounded-2xl">
                            No encontramos productos para esta combinación de filtros.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-6 justify-items-center">
                            {filteredProducts.map((product) => (
                                <Card key={product.id ?? product.handle} product={product} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
