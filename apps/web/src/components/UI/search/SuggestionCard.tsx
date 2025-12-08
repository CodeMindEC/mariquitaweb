import type { StoreProduct } from "../../../lib/medusajs/products"
import { formatPrice } from "../../../lib/medusajs/products"
import {
    getProductThumbnail,
    getProductTitle,
    resolveProductPricing,
} from "../../../lib/medusajs/pricing"

interface Props {
    product: StoreProduct
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

export default function SuggestionCard({ product, onNavigate }: Props) {
    const pricing = resolveProductPricing(product)
    const formattedPrice = formatPrice(pricing.price)
    const formattedOriginalPrice =
        pricing.originalPrice !== null ? formatPrice(pricing.originalPrice) : null
    const thumbnail = getProductThumbnail(product)
    const title = getProductTitle(product)
    const category = product.categories?.[0]?.name ?? product.collection?.title ?? null
    const destination = `/products/${product.handle ?? product.id}`

    return (
        <a
            href={destination}
            onClick={onNavigate}
            className="group flex gap-4 rounded-2xl border border-transparent bg-white/95 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-surface-primary/30"
        >
            <div className="relative aspect-square w-20 sm:w-24 overflow-hidden rounded-xl bg-surface-secondary">
                <img src={thumbnail} alt={title} className="h-full w-full object-cover" loading="lazy" />
                {pricing.discountLabel && (
                    <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {pricing.discountLabel}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-semibold text-text-primary line-clamp-2">{title}</p>
                {category && (
                    <span className="text-[11px] uppercase tracking-wide text-text-secondary/80">{category}</span>
                )}

                <div className="flex flex-wrap items-baseline gap-2 text-text-primary">
                    <span className="text-base font-bold">{formattedPrice}</span>
                    {formattedOriginalPrice && (
                        <span className="text-xs text-text-secondary line-through">{formattedOriginalPrice}</span>
                    )}
                </div>

                {pricing.includesTax && (
                    <span className="text-[10px] text-text-secondary">Precio incluye impuestos</span>
                )}
            </div>
        </a>
    )
}
