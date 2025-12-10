import type { ReactNode } from "react";
import type { StoreProduct } from "../../lib/medusajs/products";
import {
    formatPrice,
    getProductThumbnail,
    getProductTitle,
} from "../../lib/medusajs/products";
import { resolveProductPricing } from "../../lib/medusajs/pricing";
import AddToCartButton from "./cart/AddToCartButton";
import type { MeiliProductHit } from "./search/types";
import { parseMeiliPrice } from "./search/types";

interface Props {
    product?: StoreProduct | MeiliProductHit | null;
    children?: ReactNode;
}

export function CardSkeleton() {
    return (
        <div
            className="flex flex-col overflow-hidden rounded-3xl border border-border-muted/40 bg-white shadow-[0_15px_40px_rgba(15,23,42,0.06)]"
            aria-hidden="true"
        >
            <div className="relative h-[230px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-surface-secondary/60 to-surface-secondary/20" />
                <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            <div className="flex flex-col gap-3 p-5">
                <div className="h-4 w-3/4 rounded-full bg-surface-secondary/80 skeleton-shimmer" />
                <div className="h-4 w-1/3 rounded-full bg-surface-secondary/70 skeleton-shimmer" />
                <div className="h-10 w-full rounded-2xl bg-surface-secondary/60 skeleton-shimmer" />
            </div>
        </div>
    )
}

const isStoreProduct = (candidate: unknown): candidate is StoreProduct =>
    Boolean(candidate && typeof candidate === "object" && "variants" in candidate)

const buildHitPricing = (hit: MeiliProductHit) => {
    const minPrice = parseMeiliPrice(hit.min_price ?? null)
    const maxPrice = parseMeiliPrice(hit.max_price ?? null)
    const resolvedPrice = minPrice ?? maxPrice ?? 0
    const resolvedOriginal = maxPrice !== null && maxPrice > resolvedPrice ? maxPrice : null

    return {
        price: resolvedPrice,
        originalPrice: resolvedOriginal,
        includesTax: false,
        discountLabel: null,
    }
}

export default function Card({ product, children }: Props) {
    if (!product) {
        return <CardSkeleton />
    }

    const isHydratedProduct = isStoreProduct(product)
    const pricing = isHydratedProduct ? resolveProductPricing(product) : buildHitPricing(product)
    const image = isHydratedProduct
        ? getProductThumbnail(product)
        : product.thumbnail ?? "/images/product-placeholder.jpg"
    const name = isHydratedProduct
        ? getProductTitle(product)
        : product.title ?? product.description ?? "Producto"
    const formattedPrice = formatPrice(pricing.price)
    const formattedOriginalPrice =
        pricing.originalPrice !== null ? formatPrice(pricing.originalPrice) : null
    const highlightLabel = isHydratedProduct
        ? product.collection?.title ?? product.type?.value ?? "Selección Mariquita"
        : product.collection_title ?? product.type_value ?? "Selección Mariquita"
    const productIdentifier = isHydratedProduct
        ? product.id
        : product.objectID ?? product.id ?? product.title ?? "meili-hit"

    return (
        <article
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border-muted/60 bg-white shadow-[0_25px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_35px_60px_rgba(34,197,94,0.25)]"
            data-product-card
            data-product-id={productIdentifier}
        >
            <div className="relative h-[230px] w-full overflow-hidden transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.03]">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-white/30 mix-blend-multiply opacity-70 transition-all duration-500 ease-out group-hover:opacity-90" />
                    <div className="absolute inset-y-[-40%] left-[-35%] w-[70%] rotate-18 bg-linear-to-br from-white/0 via-white/60 to-white/0 opacity-0 blur-3xl transition-all duration-700 ease-out group-hover:left-[60%] group-hover:opacity-80" />
                </div>
                {pricing.discountLabel && (
                    <div className="absolute right-4 top-4 inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-full bg-primary text-xs font-semibold text-white shadow-lg">
                        {pricing.discountLabel}
                    </div>
                )}
                <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    data-product-image
                />
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-primary/80">
                    <span className="rounded-full bg-surface-primary/70 px-3 py-1 text-primary">
                        {highlightLabel}
                    </span>
                    {pricing.includesTax && (
                        <span className="text-text-secondary">IVA incl.</span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-text-primary line-clamp-2">{name}</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-text-primary">{formattedPrice}</p>
                        {formattedOriginalPrice && (
                            <span className="text-sm text-text-secondary line-through">{formattedOriginalPrice}</span>
                        )}
                    </div>
                </div>

                {children ? (
                    <div className="mt-auto w-full">{children}</div>
                ) : isHydratedProduct ? (
                    <div className="mt-auto w-full">
                        <AddToCartButton product={product} />
                    </div>
                ) : (
                    <button className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Comprar ahora
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="transition-transform duration-300 group-hover:translate-x-0.5"
                        >
                            <path
                                d="M3 8h10M9 4l4 4-4 4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </article>
    )
}
