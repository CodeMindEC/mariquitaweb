import { useEffect, useMemo, useRef, useState } from "react"
import Card, { CardSkeleton } from "../Card"
import type { StoreProduct } from "../../../lib/medusajs/products"

interface Props {
    collectionId: string
    limit: number
}

const SKELETON_COUNT = 4

const buildSkeletons = (count: number) =>
    Array.from({ length: count }).map((_, index) => (
        <div
            key={`skeleton-${index}`}
            className="card-section__item min-w-[85%] shrink-0 snap-start sm:min-w-[260px] md:min-w-0 md:shrink md:snap-none"
        >
            <CardSkeleton />
        </div>
    ))

const useSliderDots = (enabled: boolean, dependencyKey: string) => {
    const sliderRef = useRef<HTMLDivElement | null>(null)
    const dotsRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!enabled) {
            return
        }

        const slider = sliderRef.current
        const dotsContainer = dotsRef.current
        if (!slider || !dotsContainer) {
            return
        }

        const items = Array.from(slider.querySelectorAll<HTMLElement>(".card-section__item"))
        if (!items.length) {
            return
        }

        const isMobile = () => window.innerWidth <= 768

        const scrollToItem = (index: number) => {
            const target = items[index]
            if (!target) return
            slider.scrollTo({ left: target.offsetLeft - slider.offsetLeft, behavior: "smooth" })
        }

        const updateActiveDot = () => {
            if (!isMobile()) {
                return
            }

            const dots = dotsContainer.querySelectorAll<HTMLButtonElement>(".slider-dot")
            const itemWidth = items[0]?.offsetWidth ?? slider.clientWidth
            const gap = 16
            const denominator = itemWidth + gap || 1
            const currentIndex = Math.round(slider.scrollLeft / denominator)

            dots.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add("active")
                } else {
                    dot.classList.remove("active")
                }
            })
        }

        const buildDots = () => {
            if (!isMobile()) {
                dotsContainer.innerHTML = ""
                return
            }

            dotsContainer.innerHTML = ""
            items.forEach((_, index) => {
                const dot = document.createElement("button")
                dot.type = "button"
                dot.className = "slider-dot"
                dot.setAttribute("aria-label", `Ir al producto ${index + 1}`)
                dot.addEventListener("click", () => scrollToItem(index))
                dotsContainer.appendChild(dot)
            })

            updateActiveDot()
        }

        const handleResize = () => {
            buildDots()
            updateActiveDot()
        }

        slider.addEventListener("scroll", updateActiveDot, { passive: true })
        window.addEventListener("resize", handleResize)

        buildDots()

        return () => {
            slider.removeEventListener("scroll", updateActiveDot)
            window.removeEventListener("resize", handleResize)
            dotsContainer.innerHTML = ""
        }
    }, [enabled, dependencyKey])

    return { sliderRef, dotsRef }
}

const fetchCollectionProducts = async (
    collectionId: string,
    limit: number,
    signal: AbortSignal,
): Promise<StoreProduct[]> => {
    const params = new URLSearchParams({ limit: String(limit) })
    params.set("collection_id", collectionId)

    const response = await fetch(`/api/catalog.json?${params.toString()}`, { signal })
    if (!response.ok) {
        throw new Error(`No se pudo cargar la colección ${collectionId}`)
    }

    const payload = (await response.json()) as { products?: StoreProduct[] }
    return payload.products ?? []
}

export default function CollectionSectionClient({ collectionId, limit }: Props) {
    const [products, setProducts] = useState<StoreProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const skeletonCount = Math.max(1, Math.min(limit, SKELETON_COUNT))
    const skeletons = useMemo(() => buildSkeletons(skeletonCount), [skeletonCount])
    const shouldShowDots = !loading && !error && products.length > 0
    const dependencyKey = `${collectionId || "unknown"}-${products.length}`
    const { sliderRef, dotsRef } = useSliderDots(shouldShowDots, dependencyKey)

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setError(null)

        if (!collectionId) {
            setProducts([])
            setError("No pudimos cargar esta colección.")
            setLoading(false)
            return () => controller.abort()
        }

        fetchCollectionProducts(collectionId, limit, controller.signal)
            .then((fetched) => {
                setProducts(fetched)
            })
            .catch((err) => {
                if ((err as Error).name === "AbortError") {
                    return
                }
                console.error("CollectionSectionClient", err)
                setProducts([])
                setError("No pudimos cargar esta colección.")
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            })

        return () => controller.abort()
    }, [collectionId, limit])

    const content = (() => {
        if (loading) {
            return skeletons
        }

        if (error) {
            return (
                <div className="col-span-full rounded-xl border border-border-muted bg-surface-secondary/20 p-4 text-center text-sm text-text-secondary">
                    {error}
                </div>
            )
        }

        if (!products.length) {
            return (
                <div className="col-span-full rounded-xl border border-border-muted bg-surface-secondary/20 p-4 text-center text-sm text-text-secondary">
                    No hay productos en esta colección por ahora.
                </div>
            )
        }

        return products.map((product) => (
            <div
                key={product.id}
                className="card-section__item min-w-[85%] shrink-0 snap-start sm:min-w-[260px] md:min-w-0 md:shrink md:snap-none"
            >
                <Card product={product} />
            </div>
        ))
    })()

    return (
        <>
            <div
                ref={sliderRef}
                className="card-section__slider flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth sm:pb-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] md:gap-6 md:overflow-visible md:snap-none"
            >
                {content}
            </div>

            {shouldShowDots && (
                <div ref={dotsRef} className="card-section__dots mt-4 flex items-center justify-center gap-2 md:hidden" />
            )}
        </>
    )
}
