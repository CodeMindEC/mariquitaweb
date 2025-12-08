import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { StoreProduct } from "../../../lib/medusajs/products"

export interface CatalogFilters {
    categoryIds: string[]
    collectionId: string | null
    tagIds: string[]
    typeIds: string[]
    limit: number
    status?: string
}

export interface CatalogResultPayload {
    products: StoreProduct[]
    count: number
    limit: number
    offset: number
    priceRange?: CatalogPriceRange | null
}

interface UseCatalogResultsOptions {
    initialResult: CatalogResultPayload
    filters: CatalogFilters
}

export interface CatalogPriceRange {
    min: number
    max: number
}

const mergePriceRanges = (
    previous?: CatalogPriceRange | null,
    next?: CatalogPriceRange | null,
): CatalogPriceRange | undefined => {
    if (!previous && !next) return undefined
    if (!previous) return next ?? undefined
    if (!next) return previous ?? undefined
    return {
        min: Math.min(previous.min, next.min),
        max: Math.max(previous.max, next.max),
    }
}

const buildQueryString = (filters: CatalogFilters, offset: number) => {
    const params = new URLSearchParams()
    params.set("limit", String(filters.limit))
    params.set("offset", String(Math.max(offset, 0)))

    filters.categoryIds.forEach((id) => params.append("category_id", id))
    filters.tagIds.forEach((id) => params.append("tag_id", id))
    filters.typeIds.forEach((id) => params.append("type_id", id))

    if (filters.collectionId) {
        params.set("collection_id", filters.collectionId)
    }

    params.set("status", filters.status ?? "published")

    return params.toString()
}

export function useCatalogResults({ initialResult, filters }: UseCatalogResultsOptions) {
    const [result, setResult] = useState<CatalogResultPayload>(initialResult)
    const [nextOffset, setNextOffset] = useState<number>(initialResult.products.length)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)
    const firstRunRef = useRef(true)
    const cacheRef = useRef<Map<string, CatalogResultPayload>>(new Map())
    const debounceRef = useRef<number | null>(null)
    const cachedInitialRef = useRef(false)

    useEffect(() => {
        setResult(initialResult)
        setNextOffset(initialResult.products.length)
    }, [initialResult])

    const filtersSignature = useMemo(
        () =>
            JSON.stringify({
                categories: [...filters.categoryIds].sort(),
                collection: filters.collectionId ?? null,
                tags: [...filters.tagIds].sort(),
                types: [...filters.typeIds].sort(),
                limit: filters.limit,
                status: filters.status ?? "published",
            }),
        [filters.categoryIds, filters.collectionId, filters.limit, filters.status, filters.tagIds, filters.typeIds],
    )

    const normalizedFilters = useMemo(
        () => ({
            categoryIds: filters.categoryIds,
            collectionId: filters.collectionId,
            tagIds: filters.tagIds,
            typeIds: filters.typeIds,
            limit: filters.limit,
            status: filters.status ?? "published",
        }),
        [filtersSignature],
    )

    const performFetch = useCallback(
        ({ offset, append, signature }: { offset: number; append: boolean; signature: string }) => {
            abortRef.current?.abort()
            const controller = new AbortController()
            abortRef.current = controller

            setError(null)
            setLoading(!append)
            setLoadingMore(append)

            const queryString = buildQueryString(normalizedFilters, offset)

            fetch(`/api/catalog.json?${queryString}`, {
                signal: controller.signal,
                headers: { Accept: "application/json" },
            })
                .then((response) =>
                    response
                        .json()
                        .then((payload) => ({ ok: response.ok, payload })),
                )
                .then(({ ok, payload }) => {
                    if (controller.signal.aborted) return
                    if (!ok) {
                        throw new Error(payload?.error ?? "No pudimos cargar el catálogo.")
                    }

                    const payloadProducts: StoreProduct[] = payload.products ?? []
                    const baseResult: CatalogResultPayload = {
                        products: payloadProducts,
                        count: typeof payload.count === "number" ? payload.count : payloadProducts.length,
                        limit: payload.limit ?? normalizedFilters.limit,
                        offset: payload.offset ?? offset,
                        priceRange: payload.priceRange ?? undefined,
                    }

                    setResult((previous) => {
                        if (!append) {
                            cacheRef.current.set(signature, baseResult)
                            return baseResult
                        }

                        const combined = {
                            products: [...previous.products, ...payloadProducts],
                            count: baseResult.count,
                            limit: baseResult.limit,
                            offset: previous.offset,
                            priceRange: mergePriceRanges(previous.priceRange ?? undefined, baseResult.priceRange ?? undefined),
                        }

                        cacheRef.current.set(signature, combined)
                        return combined
                    })

                    setNextOffset(offset + payloadProducts.length)
                })
                .catch((err) => {
                    if (controller.signal.aborted) return
                    console.error("Error cargando catálogo", err)
                    setError("No pudimos cargar el catálogo. Intenta nuevamente.")
                })
                .finally(() => {
                    if (!controller.signal.aborted) {
                        setLoading(false)
                        setLoadingMore(false)
                    }
                })
        },
        [normalizedFilters],
    )

    useEffect(() => {
        if (cachedInitialRef.current) return
        cacheRef.current.set(filtersSignature, initialResult)
        cachedInitialRef.current = true
    }, [filtersSignature, initialResult])

    useEffect(() => {
        if (firstRunRef.current) {
            firstRunRef.current = false
            return
        }

        const cached = cacheRef.current.get(filtersSignature)
        if (cached) {
            setResult(cached)
            setNextOffset(cached.products.length)
            setLoading(false)
            setLoadingMore(false)
            setError(null)
            return
        }

        const DEBOUNCE_MS = 300
        if (typeof window !== "undefined") {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current)
            }
            debounceRef.current = window.setTimeout(() => {
                performFetch({ offset: 0, append: false, signature: filtersSignature })
            }, DEBOUNCE_MS)

            return () => {
                if (debounceRef.current) {
                    window.clearTimeout(debounceRef.current)
                }
                abortRef.current?.abort()
            }
        }

        performFetch({ offset: 0, append: false, signature: filtersSignature })

        return () => abortRef.current?.abort()
    }, [filtersSignature, performFetch])

    const hasMore = result.products.length < (result.count ?? result.products.length)

    const loadMore = useCallback(() => {
        if (loadingMore || loading || !hasMore) {
            return
        }
        performFetch({ offset: nextOffset, append: true, signature: filtersSignature })
    }, [filtersSignature, hasMore, loading, loadingMore, nextOffset, performFetch])

    return {
        result,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        error,
    }
}
