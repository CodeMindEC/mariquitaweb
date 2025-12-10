import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { InstantSearch, Configure, useInstantSearch, useSearchBox } from "react-instantsearch"
import SearchHitCard, { SuggestionSkeleton } from "./search/SuggestionCard"
import type { MeiliProductHit } from "./search/types"
import { CloseIcon, SearchIcon } from "./search/icons"
import { MEILISEARCH_PRODUCTS_INDEX, isSearchConfigured, searchClient } from "../../lib/meilisearch/searchClient"

const SUGGESTION_LIMIT = 6

export default function SearchBar() {
    if (!isSearchConfigured || !searchClient) {
        return (
            <div className="flex w-full items-center gap-3 rounded-2xl border border-border-muted bg-white/80 px-3 py-2 text-left text-sm text-text-secondary shadow-sm">
                <SearchIcon className="h-5 w-5 text-text-secondary" />
                <input
                    disabled
                    placeholder="Búsqueda no disponible"
                    className="flex-1 border-none bg-transparent text-sm text-text-secondary outline-none"
                />
            </div>
        )
    }

    return (
        <InstantSearch
            searchClient={searchClient}
            indexName={MEILISEARCH_PRODUCTS_INDEX}
            future={{ preserveSharedStateOnUnmount: true }}
        >
            <Configure
                hitsPerPage={SUGGESTION_LIMIT}
                attributesToRetrieve={[
                    'id',
                    'objectID',
                    'title',
                    'description',
                    'handle',
                    'thumbnail',
                    'min_price',
                    'max_price',
                    'currency_code',
                    'category_names',
                    'tag_values',
                ]}
                attributesToHighlight={[]}
            />
            <SearchOverlay />
        </InstantSearch>
    )
}

function SearchOverlay() {
    const [isClient, setIsClient] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const { query, refine } = useSearchBox({})
    const { status, error, results } = useInstantSearch()
    const hits = (results?.hits ?? []) as MeiliProductHit[]

    useEffect(() => {
        setIsClient(true)
    }, [])

    const closeSearch = useCallback(() => {
        setIsActive(false)
        refine("")
    }, [refine])

    const openSearch = useCallback(() => {
        setIsActive(true)
    }, [])

    useEffect(() => {
        if (!isActive) {
            document.body.style.removeProperty("overflow")
            return
        }

        const focusTimer = window.setTimeout(() => {
            inputRef.current?.focus()
        }, 80)

        document.body.style.setProperty("overflow", "hidden")

        return () => {
            window.clearTimeout(focusTimer)
            document.body.style.removeProperty("overflow")
        }
    }, [isActive])

    useEffect(() => {
        if (!isActive) {
            return
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeSearch()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [closeSearch, isActive])

    useEffect(() => {
        if (!isClient) {
            return
        }

        const handleShortcut = (event: KeyboardEvent) => {
            const key = event.key?.toLowerCase()
            if ((event.metaKey || event.ctrlKey) && key === "k") {
                event.preventDefault()
                openSearch()
            }
        }

        window.addEventListener("keydown", handleShortcut)
        return () => window.removeEventListener("keydown", handleShortcut)
    }, [isClient, openSearch])

    const loading = status === "loading" || status === "stalled"
    const errorMessage = error?.message ?? null
    const queryHasValue = query.trim().length > 0
    const hasSearched = Boolean(results?.query?.trim()?.length)
    const showSkeleton = loading && hits.length === 0
    const showEmptyState = !loading && !errorMessage && queryHasValue && hits.length === 0 && hasSearched

    const collapsedField = (
        <motion.div
            layoutId="search-surface"
            className="flex w-full items-center gap-3 rounded-2xl border border-border-muted bg-white/95 px-3 py-2 text-left text-sm text-text-secondary shadow-sm transition-shadow duration-200 focus-within:ring-2 focus-within:ring-primary"
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={() => {
                if (!isActive) {
                    inputRef.current?.focus()
                }
            }}
        >
            <SearchIcon className="pointer-events-none h-5 w-5 text-text-secondary" />
            <input
                ref={inputRef}
                value={query}
                onChange={(event) => refine(event.target.value)}
                onFocus={openSearch}
                placeholder="Busca, elige y disfruta"
                className="flex-1 border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                aria-label="Buscar productos"
            />
            <kbd className="hidden rounded-md bg-surface-secondary/30 px-2 py-1 text-[11px] uppercase text-text-secondary sm:block">
                Ctrl + K
            </kbd>
        </motion.div>
    )

    const overlayContent = (
        <AnimatePresence>
            {isActive && (
                <>
                    <motion.div
                        role="presentation"
                        className="fixed inset-0 z-1100 bg-black/70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSearch}
                    />

                    <div className="pointer-events-none fixed inset-0 z-1200 flex min-h-dvh w-full items-center justify-center px-4 py-10 sm:py-14">
                        <motion.div
                            layoutId="search-surface"
                            className="pointer-events-auto w-full max-w-3xl rounded-3xl bg-white/95 shadow-2xl backdrop-blur supports-backdrop-filter:backdrop-blur"
                            transition={{ type: "spring", damping: 24, stiffness: 320 }}
                        >
                            <div className="flex items-center gap-3 border-b border-border-muted px-5 py-4">
                                <SearchIcon className="h-5 w-5 text-text-secondary" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(event) => refine(event.target.value)}
                                    placeholder="¿Qué snack buscamos hoy?"
                                    className="flex-1 border-none bg-transparent text-base text-text-primary outline-none placeholder:text-text-secondary"
                                    aria-label="Buscar productos"
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={closeSearch}
                                    className="rounded-full p-2 text-text-secondary transition hover:bg-surface-secondary"
                                    aria-label="Cerrar"
                                >
                                    <CloseIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
                                {showSkeleton && (
                                    <div className="flex flex-col gap-3" aria-live="polite">
                                        {Array.from({ length: Math.min(4, SUGGESTION_LIMIT) }).map((_, index) => (
                                            <SuggestionSkeleton key={`suggestion-skeleton-${index}`} />
                                        ))}
                                    </div>
                                )}

                                {!loading && errorMessage && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                        {errorMessage}
                                    </div>
                                )}

                                {!loading && !errorMessage && !queryHasValue && (
                                    <div className="rounded-2xl border border-dashed border-border-muted px-4 py-6 text-center text-sm text-text-secondary">
                                        Empieza a escribir para descubrir productos, categorías y servicios.
                                    </div>
                                )}

                                {showEmptyState && (
                                    <div className="rounded-2xl border border-dashed border-border-muted px-4 py-6 text-center text-sm text-text-secondary">
                                        No encontramos coincidencias. Intenta con otro término o explora el catálogo completo.
                                    </div>
                                )}

                                {hits.length > 0 && (
                                    <div className="flex flex-col gap-3">
                                        {hits.map((hit: MeiliProductHit) => (
                                            <SearchHitCard
                                                key={String(hit.id ?? hit.objectID)}
                                                hit={hit}
                                                onNavigate={closeSearch}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )

    return (
        <>
            <LayoutGroup>
                <div className="relative w-full sm:max-w-[507px]">
                    {!isActive ? collapsedField : <div className="h-12 w-full" aria-hidden="true" />}
                </div>
            </LayoutGroup>
            {isClient && typeof document !== "undefined"
                ? createPortal(overlayContent, document.body)
                : null}
        </>
    )
}
