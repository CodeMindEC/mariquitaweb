import { formatPrice } from "../../../lib/medusajs/products"
import type { MeiliProductHit } from "../../../lib/meilisearch/types"
import { parseMeiliPrice } from "../../../lib/meilisearch/types"

interface Props {
    hit: MeiliProductHit
    onNavigate: () => void
}

export function SuggestionSkeleton() {
    return (
        <div className="group flex gap-3 rounded-xl border border-gray-200/50 bg-white/80 p-3 backdrop-blur-sm">
            <div className="relative aspect-square w-20 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-surface-secondary/70 skeleton-shimmer" />
            <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-3/4 rounded bg-surface-secondary/70 skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded bg-surface-secondary/60 skeleton-shimmer" />
                <div className="h-3 w-full rounded bg-surface-secondary/50 skeleton-shimmer" />
                <div className="mt-auto flex items-center gap-2">
                    <div className="h-6 w-20 rounded bg-surface-secondary/80 skeleton-shimmer" />
                    <div className="h-4 w-16 rounded-full bg-surface-secondary/60 skeleton-shimmer" />
                </div>
            </div>
        </div>
    )
}

const FALLBACK_IMAGE = "/images/product-placeholder.jpg"

export default function SuggestionCard({ hit, onNavigate }: Props) {
    const title = hit.title ?? "Producto"
    const description = hit.description ?? ""
    const collection = hit.collection_title ?? hit.type_value ?? null

    // Extraer variantes con sus precios y pesos
    const weightPriceMap = hit.weight_price_map ?? {}
    const variantWeights = hit.variant_weights ?? []

    // Crear lista de variantes ordenadas por peso
    const variants = variantWeights
        .sort((a, b) => a - b)
        .map(weight => ({
            weight,
            weightText: `${weight}g`,
            price: weightPriceMap[weight],
            priceText: weightPriceMap[weight] !== undefined ? formatPrice(parseMeiliPrice(weightPriceMap[weight]) ?? 0) : null
        }))
        .filter(v => v.priceText !== null)

    // Mostrar badge del peso mínimo o el primero disponible
    const minPriceWeight = hit.weight_for_min_price
    const badgeWeight = minPriceWeight ? `${minPriceWeight}g` : (variants[0]?.weightText ?? null)

    // Precio destacado (el menor)
    const minPrice = parseMeiliPrice(hit.min_price)
    const mainPriceLabel = minPrice !== null ? formatPrice(minPrice) : null

    const destination = `/products/${hit.handle ?? hit.id ?? hit.objectID ?? ""}`
    const thumbnail = hit.thumbnail || FALLBACK_IMAGE

    return (
        <a
            href={destination}
            onClick={onNavigate}
            className="group flex gap-3 sm:gap-4 rounded-xl border border-gray-200/60 bg-white/90 p-3 sm:p-4 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-surface-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
        >
            {/* Image Container */}
            <div className="relative aspect-square w-20 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-surface-secondary shadow-sm ring-1 ring-gray-200/50 transition-transform duration-200 group-hover:scale-105 group-hover:ring-primary/30">
                <img
                    src={thumbnail}
                    alt={title}
                    className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-95"
                    loading="lazy"
                />
            </div>

            {/* Content Container - Left Side */}
            <div className="flex flex-1 flex-col justify-between gap-1 min-w-0">
                {/* Title */}
                <h3 className="text-sm font-semibold text-text-primary line-clamp-2 transition-colors duration-150 group-hover:text-primary">
                    {title}
                </h3>

                {/* Collection Tag */}
                {collection && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            {collection}
                        </span>
                    </div>
                )}

                {/* Variantes disponibles */}
                {variants.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        {variants.length === 1 ? (
                            // Solo una variante: mostrar precio grande
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-primary">
                                    {variants[0].priceText}
                                </span>
                                <span className="text-[10px] font-medium text-text-secondary">
                                    / {variants[0].weightText}
                                </span>
                            </div>
                        ) : (
                            // Múltiples variantes: mostrar en chips compactos
                            <>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-bold text-primary">
                                        {mainPriceLabel}
                                    </span>
                                    <span className="text-[9px] font-medium text-text-secondary uppercase tracking-wide">
                                        desde
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {variants.slice(0, 3).map((variant) => (
                                        <div
                                            key={variant.weight}
                                            className="inline-flex items-center gap-1 rounded-md bg-surface-secondary/60 px-1.5 py-0.5 text-[9px] font-medium text-text-primary"
                                        >
                                            <span className="font-bold">{variant.weightText}</span>
                                            <span className="text-text-secondary">→</span>
                                            <span className="font-semibold text-primary">{variant.priceText}</span>
                                        </div>
                                    ))}
                                    {variants.length > 3 && (
                                        <div className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                                            +{variants.length - 3}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Description - Only visible on larger screens */}
            {description && (
                <div className="hidden lg:flex flex-col justify-center min-w-0 max-w-[200px] xl:max-w-[280px] border-l border-border-muted/40 pl-4">
                    <p className="text-[11px] leading-relaxed text-text-secondary/90 line-clamp-3">
                        {description}
                    </p>
                </div>
            )}
        </a>
    )
}
