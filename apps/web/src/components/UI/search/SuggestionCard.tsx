import { formatPrice } from "../../../lib/medusajs/products"
import type { MeiliProductHit } from "./types"

interface Props {
    hit: MeiliProductHit
    onNavigate: () => void
}

export function SuggestionSkeleton() {
    return (
        <div className="group flex gap-4 rounded-2xl border border-transparent bg-white/70 p-3">
            <div className="relative aspect-square w-20 sm:w-24 overflow-hidden rounded-xl bg-surface-secondary/70 skeleton-shimmer" />
            <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-3/4 rounded bg-surface-secondary/70 skeleton-shimmer" />
                <div className="h-3 w-1/3 rounded bg-surface-secondary/60 skeleton-shimmer" />
                <div className="flex gap-2">
                    <div className="h-5 w-1/4 rounded bg-surface-secondary/80 skeleton-shimmer" />
                    <div className="h-5 w-1/5 rounded bg-surface-secondary/50 skeleton-shimmer" />
                </div>
            </div>
        </div>
    )
}

const FALLBACK_IMAGE = "/images/product-placeholder.jpg"

export default function SuggestionCard({ hit, onNavigate }: Props) {
    const title = hit.title ?? "Producto"
    const description = hit.description ?? ""
    const category = hit.category_names?.[0] ?? hit.tag_values?.[0] ?? null
    const priceLabel = typeof hit.min_price === "number" ? formatPrice(hit.min_price) : null
    const secondaryPriceLabel =
        typeof hit.max_price === "number" && hit.max_price !== hit.min_price
            ? formatPrice(hit.max_price)
            : null
    const destination = `/products/${hit.handle ?? hit.id ?? hit.objectID ?? ""}`
    const thumbnail = hit.thumbnail || FALLBACK_IMAGE

    return (
        <a
            href={destination}
            onClick={onNavigate}
            className="group flex gap-4 rounded-2xl border border-transparent bg-white/95 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-surface-primary/30"
        >
            <div className="relative aspect-square w-20 sm:w-24 overflow-hidden rounded-xl bg-surface-secondary">
                <img src={thumbnail} alt={title} className="h-full w-full object-cover" loading="lazy" />
            </div>

            <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-semibold text-text-primary line-clamp-2">{title}</p>
                {category && (
                    <span className="text-[11px] uppercase tracking-wide text-text-secondary/80">{category}</span>
                )}
                {description && (
                    <p className="text-xs text-text-secondary/90 line-clamp-2">{description}</p>
                )}

                {priceLabel && (
                    <div className="flex flex-wrap items-baseline gap-2 text-text-primary">
                        <span className="text-base font-bold">{priceLabel}</span>
                        {secondaryPriceLabel && (
                            <span className="text-xs text-text-secondary">hasta {secondaryPriceLabel}</span>
                        )}
                    </div>
                )}
            </div>
        </a>
    )
}
