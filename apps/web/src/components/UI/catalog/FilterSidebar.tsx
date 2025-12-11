import { useEffect, useState, type ReactNode } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { StoreCollection } from "../../../lib/medusajs/products"
import { formatPrice } from "../../../lib/medusajs/products"
import { getAvailableWeightsForCollection } from "../../../lib/meilisearch/queries"
import { meiliClient, isSearchConfigured } from "../../../lib/meilisearch/searchClient"
import FilterIcon from "../../../assets/Container/filter.svg"
import DownIcon from "../../../assets/Container/down.svg"

const getAssetSrc = (asset: string | { src: string }) =>
    typeof asset === "string" ? asset : asset.src

const filterIconSrc = getAssetSrc(FilterIcon)
const downIconSrc = getAssetSrc(DownIcon)

function cleanTextTags(str: string) {
    const clean = str.replace(/-+/g, " ").toLowerCase().trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

interface FilterSidebarProps {
    isOpen: boolean
    onToggle(): void
    onClose(): void
    categories: HttpTypes.StoreProductCategory[]
    collections: StoreCollection[]
    tags: HttpTypes.StoreProductTag[]
    types: HttpTypes.StoreProductType[]
    selectedCategories: string[]
    selectedCollection: string | null
    selectedTags: string[]
    selectedType: string | null
    selectedWeight: string | null
    hasActiveFilters: boolean
    activeFilterCount: number
    maxPrice: number
    priceBounds: { min: number; max: number }
    onCategoryToggle(categoryId: string): void
    onCollectionSelect(collectionId: string | null): void
    onTagToggle(tagId: string): void
    onTypeSelect(typeId: string | null): void
    onWeightSelect(weight: string | null): void
    onPriceChange(value: number): void
}

interface FilterSectionProps {
    title: string
    children: ReactNode
}

const FilterSection = ({ title, children }: FilterSectionProps) => (
    <details className="group" open>
        <summary className="flex items-center justify-between w-full cursor-pointer py-2 text-text-primary font-medium list-none hover:bg-surface-primary rounded-2xl p-4 -mx-4 px-4">
            <span className="text-base">{title}</span>
            <img
                src={downIconSrc}
                alt="Expandir"
                width={20}
                height={20}
                className="transition-transform duration-300 group-open:rotate-180 opacity-70"
            />
        </summary>
        {children}
    </details>
)

export default function FilterSidebar({
    isOpen,
    onToggle,
    onClose,
    categories,
    collections,
    tags,
    types,
    selectedCategories,
    selectedCollection,
    selectedTags,
    selectedType,
    selectedWeight,
    hasActiveFilters,
    activeFilterCount,
    maxPrice,
    priceBounds,
    onCategoryToggle,
    onCollectionSelect,
    onTagToggle,
    onTypeSelect,
    onWeightSelect,
    onPriceChange,
}: FilterSidebarProps) {
    const [availableWeights, setAvailableWeights] = useState<string[]>([])
    const [loadingWeights, setLoadingWeights] = useState(false)

    // Cargar variantes disponibles cuando se selecciona una colección
    useEffect(() => {
        if (!selectedCollection || !isSearchConfigured || !meiliClient) {
            setAvailableWeights([])
            return
        }

        const loadWeights = async () => {
            setLoadingWeights(true)
            try {
                const weights = await getAvailableWeightsForCollection(selectedCollection, meiliClient)
                setAvailableWeights(weights)
            } catch (error) {
                console.error('Error loading variants:', error)
                setAvailableWeights([])
            } finally {
                setLoadingWeights(false)
            }
        }

        loadWeights()
    }, [selectedCollection])

    return (
        <>
            <button
                className="lg:hidden fixed bottom-10 left-4 w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center shadow-lg"
                onClick={onToggle}
                aria-label="Mostrar filtros"
            >
                <img src={filterIconSrc} alt="Filtros" className="w-8 h-8" />
                {hasActiveFilters && (
                    <span className="absolute top-0 right-0 flex h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <button
                    className="fixed inset-0 bg-black/50 lg:hidden"
                    onClick={onClose}
                    aria-label="Cerrar filtros"
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-screen w-[300px] bg-white shadow-lg p-5 flex flex-col gap-6 transform transition-transform duration-300 overflow-y-auto ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative lg:h-auto lg:w-[300px] lg:shadow-none lg:p-0 lg:overflow-visible lg:bg-transparent`}
                aria-label="Filtros de catálogo"
            >
                <button
                    className="lg:hidden absolute top-4 right-4 text-2xl text-text-primary z-10"
                    onClick={onClose}
                    aria-label="Ocultar filtros"
                >
                    ✕
                </button>

                <div className="flex items-center gap-3 pb-3 border-b border-border-muted relative mt-8 lg:mt-0">
                    <img src={filterIconSrc} alt="Filtros" width={20} height={20} />
                    <span className="text-lg lg:text-xl font-bold text-text-primary flex items-center gap-2">
                        Filtros
                        {hasActiveFilters && (
                            <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full min-w-[22px] text-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </span>
                </div>

                <FilterSection title="Categorías">
                    <ul className="mt-2 flex flex-col gap-3 px-4 pb-2">
                        {categories.map((category) => (
                            <li key={category.id!} className="flex items-center gap-3 text-text-primary pl-1">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category.id!)}
                                    className="w-4 h-4 rounded border-border-muted text-primary focus:ring-primary accent-primary"
                                    aria-label={`Filtrar por ${category.name ?? "categoría"}`}
                                    onChange={() => onCategoryToggle(category.id!)}
                                />
                                <label className="cursor-pointer text-sm">
                                    {category.name ?? "Sin nombre"}
                                </label>
                            </li>
                        ))}
                    </ul>
                </FilterSection>

                {collections.length > 0 && (
                    <FilterSection title="Productos y Servicios">
                        <div className="mt-3 px-4 flex flex-col gap-2 pb-2">
                            <button
                                type="button"
                                className={`rounded-2xl px-4 py-2 text-left text-sm transition ${selectedCollection === null ? "bg-surface-primary text-primary" : "text-text-primary hover:bg-surface-primary/80"}`}
                                onClick={() => {
                                    onCollectionSelect(null)
                                    onWeightSelect(null)
                                }}
                            >
                                Todos los productos
                            </button>
                            {collections.map((collection) => {
                                const id = collection.id!
                                const isActive = selectedCollection === id
                                return (
                                    <div key={id} className="flex flex-col gap-1">
                                        <button
                                            type="button"
                                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-2 text-sm transition ${isActive ? "bg-surface-primary text-primary" : "text-text-primary hover:bg-surface-primary/80"}`}
                                            aria-pressed={isActive ? "true" : "false"}
                                            onClick={() => {
                                                onCollectionSelect(isActive ? null : id)
                                                if (isActive) {
                                                    onWeightSelect(null)
                                                }
                                            }}
                                        >
                                            <span>
                                                {collection.title ?? collection.handle ?? "Colección"}
                                            </span>
                                            {isActive && <span className="w-2 h-2 bg-primary rounded-full"></span>}
                                        </button>

                                        {/* Dropdown de variantes cuando la colección está activa */}
                                        {isActive && availableWeights.length > 0 && (
                                            <div className="ml-4 flex flex-col gap-1 pl-2 border-l-2 border-surface-primary">
                                                {availableWeights.map((variantTitle) => (
                                                    <button
                                                        key={variantTitle}
                                                        type="button"
                                                        className={`rounded-xl px-3 py-1.5 text-left text-xs transition ${selectedWeight === variantTitle ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-surface-primary/60"}`}
                                                        onClick={() => onWeightSelect(variantTitle)}
                                                    >
                                                        {variantTitle}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {isActive && loadingWeights && (
                                            <div className="ml-4 pl-2 text-xs text-text-secondary">
                                                Cargando variantes...
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </FilterSection>
                )}

                {types.length > 0 && (
                    <FilterSection title="Tipos de producto">
                        <div className="mt-3 px-4 flex flex-col gap-2 pb-2">
                            <button
                                type="button"
                                className={`rounded-2xl px-4 py-2 text-left text-sm transition ${selectedType === null ? "bg-surface-primary text-primary" : "text-text-primary hover:bg-surface-primary/80"}`}
                                onClick={() => onTypeSelect(null)}
                            >
                                Todos los tipos
                            </button>
                            {types.map((type) => {
                                const id = type.id!
                                const isActive = selectedType === id
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        className={`flex w-full items-center text-left justify-between rounded-2xl px-4 py-2 text-sm transition ${isActive ? "bg-surface-primary text-primary" : "text-text-primary hover:bg-surface-primary/80"}`}
                                        aria-pressed={isActive ? "true" : "false"}
                                        onClick={() => onTypeSelect(isActive ? null : id)}
                                    >
                                        <span>{type.value ?? "Tipo"}</span>
                                        {isActive && <span className="w-2 h-2 bg-primary rounded-full"></span>}
                                    </button>
                                )
                            })}
                        </div>
                    </FilterSection>
                )}

                {tags.length > 0 && (
                    <FilterSection title="Etiquetas">
                        <ul className="mt-2 flex flex-col gap-3 px-4 pb-2">
                            {tags.map((tag) => (
                                <li key={tag.id!} className="flex items-center gap-3 text-text-primary pl-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedTags.includes(tag.id!)}
                                        className="w-4 h-4 rounded border-border-muted text-primary focus:ring-primary accent-primary"
                                        aria-label={`Filtrar por ${tag.value ?? "etiqueta"}`}
                                        onChange={() => onTagToggle(tag.id!)}
                                    />
                                    <label className="cursor-pointer text-sm">
                                        {cleanTextTags(tag.value) ?? "Etiqueta"}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </FilterSection>
                )}

                <FilterSection title="Rango de precios">
                    <div className="mt-3 px-4 flex flex-col gap-3 pb-2">
                        <div className="flex justify-between text-sm text-text-primary opacity-80">
                            <span>{formatPrice(priceBounds.min)}</span>
                            <span>{formatPrice(maxPrice)}</span>
                        </div>
                        <input
                            type="range"
                            min={priceBounds.min}
                            max={priceBounds.max}
                            value={maxPrice}
                            className="w-full accent-primary"
                            aria-label="Rango máximo de precio"
                            onChange={(event) => onPriceChange(Number(event.target.value))}
                        />
                    </div>
                </FilterSection>
            </aside>
        </>
    )
}
