import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { meiliClient, isSearchConfigured, MEILISEARCH_PRODUCTS_INDEX } from "@lib/meilisearch/searchClient"
import type { MeiliProductHit } from "@lib/meilisearch/types"
import type { StoreProduct } from "@lib/medusajs/products"
import { convertMeiliHitToProduct, computePriceRangeFromProducts } from "@lib/meilisearch/converters"
import { buildMeilisearchFilters, type CatalogFilters } from "@lib/meilisearch/filters"
import { MEILISEARCH_PRODUCT_ATTRIBUTES } from "@lib/meilisearch/queries"

export interface CatalogResultPayload {
    products: StoreProduct[]
    count: number
    limit: number
    offset: number
    priceRange?: CatalogPriceRange | null
}

interface UseMeilisearchCatalogOptions {
    initialResult: CatalogResultPayload
    filters: CatalogFilters & { limit: number }
}

export interface CatalogPriceRange {
    min: number
    max: number
}

export function useMeilisearchCatalog({ initialResult, filters }: UseMeilisearchCatalogOptions) {
    const [result, setResult] = useState<CatalogResultPayload>(initialResult)
    const [nextOffset, setNextOffset] = useState<number>(initialResult.products.length)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)
    const firstRunRef = useRef(true)
    const cacheRef = useRef<Map<string, CatalogResultPayload>>(new Map())
    const debounceRef = useRef<number | null>(null)

    const filtersSignature = useMemo(
        () =>
            JSON.stringify({
                categories: [...filters.categoryIds].sort(),
                collection: filters.collectionId ?? null,
                tags: [...filters.tagIds].sort(),
                types: [...filters.typeIds].sort(),
                weight: filters.weight ?? null,
                limit: filters.limit,
                status: filters.status ?? "published",
            }),
        [filters.categoryIds, filters.collectionId, filters.limit, filters.status, filters.tagIds, filters.typeIds, filters.weight],
    )

    const performSearch = useCallback(
        async ({ offset, append, signature }: { offset: number; append: boolean; signature: string }) => {
            if (!isSearchConfigured || !meiliClient) {
                console.error("Meilisearch no está configurado correctamente")
                return
            }

            abortRef.current?.abort()
            const controller = new AbortController()
            abortRef.current = controller

            setError(null)
            setLoading(!append)
            setLoadingMore(append)

            try {
                // Construir filtros de Meilisearch
                const filterString = buildMeilisearchFilters({
                    categoryIds: filters.categoryIds,
                    collectionId: filters.collectionId,
                    tagIds: filters.tagIds,
                    typeIds: filters.typeIds,
                    weight: filters.weight,
                    status: filters.status,
                })

                // Realizar búsqueda con Meilisearch
                const searchResults = await meiliClient
                    .index(MEILISEARCH_PRODUCTS_INDEX)
                    .search('', {
                        filter: filterString,
                        offset,
                        limit: filters.limit,
                        attributesToRetrieve: MEILISEARCH_PRODUCT_ATTRIBUTES as any,
                    })

                if (controller.signal.aborted) return

                const hits = (searchResults.hits || []) as MeiliProductHit[]
                const totalHits = searchResults.estimatedTotalHits || 0

                // Convertir hits a productos, pasando el peso seleccionado
                const products = hits.map(hit => convertMeiliHitToProduct(hit, filters.weight))

                const priceRange = computePriceRangeFromProducts(products)

                const baseResult: CatalogResultPayload = {
                    products,
                    count: totalHits,
                    limit: filters.limit,
                    offset,
                    priceRange,
                }

                setResult((previous) => {
                    if (!append) {
                        cacheRef.current.set(signature, baseResult)
                        return baseResult
                    }

                    const combined = {
                        products: [...previous.products, ...products],
                        count: baseResult.count,
                        limit: baseResult.limit,
                        offset: previous.offset,
                        priceRange: {
                            min: Math.min(previous.priceRange?.min || 0, priceRange.min),
                            max: Math.max(previous.priceRange?.max || 0, priceRange.max),
                        },
                    }

                    cacheRef.current.set(signature, combined)
                    return combined
                })

                setNextOffset(offset + products.length)
            } catch (err) {
                if (controller.signal.aborted) return
                console.error("Error en búsqueda con Meilisearch", err)
                setError("No pudimos cargar el catálogo. Intenta nuevamente.")
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                    setLoadingMore(false)
                }
            }
        },
        [filters],
    )

    useEffect(() => {
        if (firstRunRef.current) {
            firstRunRef.current = false
            return
        }

        // Verificar cache
        const cached = cacheRef.current.get(filtersSignature)
        if (cached) {
            setResult(cached)
            setNextOffset(cached.products.length)
            setLoading(false)
            setLoadingMore(false)
            setError(null)
            return
        }

        // Debounce para evitar búsquedas excesivas
        const DEBOUNCE_MS = 300
        if (typeof window !== "undefined") {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current)
            }
            debounceRef.current = window.setTimeout(() => {
                performSearch({ offset: 0, append: false, signature: filtersSignature })
            }, DEBOUNCE_MS)

            return () => {
                if (debounceRef.current) {
                    window.clearTimeout(debounceRef.current)
                }
                abortRef.current?.abort()
            }
        }

        performSearch({ offset: 0, append: false, signature: filtersSignature })

        return () => abortRef.current?.abort()
    }, [filtersSignature, performSearch])

    const hasMore = result.products.length < (result.count ?? result.products.length)

    const loadMore = useCallback(() => {
        if (loadingMore || loading || !hasMore) {
            return
        }
        performSearch({ offset: nextOffset, append: true, signature: filtersSignature })
    }, [filtersSignature, hasMore, loading, loadingMore, nextOffset, performSearch])

    return {
        result,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        error,
        isSearchConfigured,
    }
}
