import type { StoreProduct } from "../../lib/medusajs/products"
import { formatPrice, getProductThumbnail, getProductTitle } from "../../lib/medusajs/products"
import { resolveProductPricing } from "../../lib/medusajs/pricing"

interface Props {
    product?: StoreProduct | null
}

export function CardSkeleton() {
    return (
        <div
            className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden w-full"
            aria-hidden="true"
        >
            <div className="bg-surface-secondary/80 w-full h-[230px] skeleton-shimmer" />
            <div className="p-4 flex flex-col gap-3">
                <div className="h-4 w-3/4 rounded bg-surface-secondary/80 skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded bg-surface-secondary/70 skeleton-shimmer" />
                <div className="flex gap-2">
                    <div className="h-8 w-1/2 rounded bg-surface-secondary/90 skeleton-shimmer" />
                    <div className="h-8 w-1/4 rounded bg-surface-secondary/40 skeleton-shimmer" />
                </div>
            </div>
        </div>
    )
}

export default function Card({ product }: Props) {
    if (!product) {
        return <CardSkeleton />
    }

    const pricing = resolveProductPricing(product)
    const image = getProductThumbnail(product)
    const name = getProductTitle(product)
    const formattedPrice = formatPrice(pricing.price)
    const formattedOriginalPrice =
        pricing.originalPrice !== null ? formatPrice(pricing.originalPrice) : null

    return (
        <div className="flex flex-col bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full">
            <div className="relative w-full flex justify-center items-center">
                {pricing.discountLabel && (
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs text-center w-[45px] h-[45px] rounded-full flex items-center justify-center font-bold shadow-md">
                        {pricing.discountLabel}
                    </div>
                )}

                <img
                    src={image}
                    alt={name}
                    className="object-cover w-full h-[230px]"
                    loading="lazy"
                />
            </div>

            <div className="p-4 flex flex-col gap-2">
                <p className="text-text-primary font-semibold text-sm line-clamp-2">{name}</p>

                <div className="flex flex-col">
                    <p className="text-lg font-bold text-text-primary opacity-85">{formattedPrice}</p>
                    {formattedOriginalPrice && (
                        <p className="text-xs text-text-secondary opacity-85 line-through">{formattedOriginalPrice}</p>
                    )}
                    {pricing.includesTax && (
                        <p className="text-[11px] text-text-secondary opacity-85 mt-1">Precio incluye IVA</p>
                    )}
                </div>

                <button className="cursor-pointer mt-2 w-full bg-primary text-white py-2 rounded-lg font-semibold text-sm transition-transform duration-300 hover:bg-secondary ">
                    Comprar ahora - {formattedPrice}
                </button>
            </div>
        </div>
    )
}
