import type { ReactNode } from "react"
import type { StoreProduct } from "../../lib/medusajs/products"
import AddToCartButton from "./cart/AddToCartButton"
import type { MeiliProductHit } from "../../lib/meilisearch/types"
import { buildProductCardViewModel } from "../../lib/view-models/product-card"

interface Props {
    product?: StoreProduct | MeiliProductHit | null
    children?: ReactNode
}

export function CardSkeleton() {
    return (
        <div
            className="flex w-full min-w-60 flex-col overflow-hidden rounded-3xl border border-border-muted/40 bg-white shadow-[0_15px_40px_rgba(15,23,42,0.06)]"
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

export default function Card({ product, children }: Props) {
    const viewModel = buildProductCardViewModel(product)
    if (!viewModel) {
        return <CardSkeleton />
    }

    const action =
        children ??
        (viewModel.source === "store" ? (
            <AddToCartButton product={viewModel.product} variant={viewModel.defaultVariant} />
        ) : (
            <FallbackBuyButton />
        ))

    return (
        <article
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border-muted/60 bg-white shadow-[0_25px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_35px_60px_rgba(34,197,94,0.25)]"
            data-product-card
            data-product-id={viewModel.id}
        >
            <div className="relative h-[230px] w-full overflow-hidden transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.03]">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-white/30 mix-blend-multiply opacity-70 transition-all duration-500 ease-out group-hover:opacity-90" />
                    <div className="absolute inset-y-[-40%] left-[-35%] w-[70%] rotate-18 bg-linear-to-br from-white/0 via-white/60 to-white/0 opacity-0 blur-3xl transition-all duration-700 ease-out group-hover:left-[60%] group-hover:opacity-80" />
                </div>
                {viewModel.pricing.discountLabel && (
                    <div className="absolute right-4 top-4 inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-full bg-primary text-xs font-semibold text-white shadow-lg">
                        {viewModel.pricing.discountLabel}
                    </div>
                )}
                {viewModel.defaultVariant?.weight && (
                    <div className="absolute left-4 top-4 inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-text-primary shadow-md border border-border-muted/30">
                        {viewModel.defaultVariant?.weight}g
                    </div>
                )}
                <img
                    src={viewModel.image}
                    alt={viewModel.name}
                    className="h-full w-full object-cover bg-surface-secondary/35"
                    loading="lazy"
                    data-product-image
                />
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-primary/80">
                    <span className="rounded-full bg-surface-primary/70 px-3 py-1 text-primary">
                        {viewModel.highlightLabel}
                    </span>
                    {viewModel.pricing.includesTax && (
                        <span className="text-text-secondary">IVA incl.</span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-text-primary line-clamp-2">{viewModel.name}</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-text-primary">{viewModel.pricing.priceText}</p>
                        {viewModel.pricing.originalPriceText && (
                            <span className="text-sm text-text-secondary line-through">{viewModel.pricing.originalPriceText}</span>
                        )}
                    </div>
                </div>

                <div className="mt-auto w-full">{action}</div>
            </div>
        </article>
    )
}

const FallbackBuyButton = () => (
    <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
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
)
