import { useCallback, useEffect, useRef, useState } from "react"
import type { StoreProduct } from "../../../lib/medusajs/products"

const SEARCH_ENDPOINT = "/api/search.json"

interface SearchResponse {
    products: StoreProduct[]
    error?: string
}

export function useSearchSuggestions(limit: number) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<StoreProduct[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    const controller = useRef<AbortController | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") {
            return
        }

        if (!query.trim()) {
            controller.current?.abort()
            setResults([])
            setError(null)
            setLoading(false)
            setHasSearched(false)
            return
        }

        setLoading(true)
        setError(null)
        controller.current?.abort()
        const nextController = new AbortController()
        controller.current = nextController

        const debounceId = window.setTimeout(async () => {
            try {
                const params = new URLSearchParams({
                    q: query.trim(),
                    limit: String(limit),
                })

                const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
                    signal: nextController.signal,
                    headers: { Accept: "application/json" },
                })

                const payload: SearchResponse = await response
                    .json()
                    .catch(() => ({ products: [] }))

                if (!response.ok) {
                    throw new Error(payload.error ?? "No pudimos buscar productos. Intenta nuevamente.")
                }

                if (!nextController.signal.aborted) {
                    setResults(payload.products ?? [])
                    setHasSearched(true)
                }
            } catch (err) {
                if (nextController.signal.aborted) {
                    return
                }
                console.error("Error buscando productos", err)
                setResults([])
                setError("No pudimos buscar productos. Intenta nuevamente.")
            } finally {
                if (!nextController.signal.aborted) {
                    setLoading(false)
                }
            }
        }, 300)

        return () => {
            nextController.abort()
            window.clearTimeout(debounceId)
        }
    }, [limit, query])

    const resetSuggestions = useCallback(() => {
        controller.current?.abort()
        setResults([])
        setError(null)
        setHasSearched(false)
        setLoading(false)
    }, [])

    return {
        query,
        setQuery,
        results,
        loading,
        error,
        hasSearched,
        resetSuggestions,
    }
}
