import { AnimatePresence, motion } from "motion/react"
import type { StoreProduct } from "../../../lib/medusajs/products"
import Card, { CardSkeleton } from "../Card"

interface ProductResultsProps {
    totalProductsLabel: string
    hasActiveFilters: boolean
    onClearFilters(): void
    error?: string | null
    isInitialLoading: boolean
    filteredProducts: StoreProduct[]
    skeletonCount: number
    loadingMore: boolean
    hasMore: boolean
    onLoadMore(): void
    loading: boolean
    isRefining: boolean
}

export default function ProductResults({
    totalProductsLabel,
    hasActiveFilters,
    onClearFilters,
    error,
    isInitialLoading,
    filteredProducts,
    skeletonCount,
    loadingMore,
    hasMore,
    onLoadMore,
    loading,
    isRefining,
}: ProductResultsProps) {
    return (
        <section className="flex-1 flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between px-4 sm:px-6">
                <p className="text-base lg:text-lg font-semibold text-text-primary">
                    Productos ({totalProductsLabel})
                </p>
                {hasActiveFilters && (
                    <button
                        className="text-sm text-primary underline cursor-pointer"
                        onClick={onClearFilters}
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            <div className="relative min-h-80 w-full pb-10">
                {error ? (
                    <motion.div
                        key="error-state"
                        initial={{ opacity: 0.2 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 sm:px-6 py-10 text-center text-text-secondary border border-dashed border-border-muted rounded-2xl"
                    >
                        {error}
                    </motion.div>
                ) : isInitialLoading ? (
                    <motion.div
                        key="skeleton-grid"
                        layout
                        transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-6 justify-items-center"
                    >
                        {Array.from({ length: skeletonCount }).map((_, index) => (
                            <CardSkeleton key={`card-skeleton-${index}`} />
                        ))}
                    </motion.div>
                ) : filteredProducts.length === 0 && !loading ? (
                    <motion.div
                        key="empty-state"
                        initial={{ opacity: 0.2 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 sm:px-6 py-10 text-center text-text-secondary border border-dashed border-border-muted rounded-2xl"
                    >
                        No encontramos productos para esta combinación de filtros.
                    </motion.div>
                ) : (
                    <motion.div
                        key="product-grid"
                        layout
                        transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-6 justify-items-center"
                    >
                        {filteredProducts.map((product, index) => {
                            const key = product.id ?? product.handle ?? `product-${index}`
                            return (
                                <motion.div
                                    key={key}
                                    layout
                                    initial={false}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    style={{ width: "100%", willChange: "transform" }}
                                >
                                    <Card product={product}  />
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}

                {loadingMore && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-6 mt-6">
                        {Array.from({ length: Math.min(3, skeletonCount) }).map((_, index) => (
                            <CardSkeleton key={`card-skeleton-more-${index}`} />
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div className="flex justify-center mt-6">
                        <button
                            type="button"
                            onClick={onLoadMore}
                            disabled={loadingMore}
                            className="px-6 py-2 rounded-full border border-primary text-primary text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary hover:text-white"
                        >
                            {loadingMore ? "Cargando más productos..." : "Cargar más"}
                        </button>
                    </div>
                )}
                <AnimatePresence>
                    {isRefining && (
                        <motion.div
                            key="refining-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm"
                        >
                            <div className="pointer-events-auto flex items-center gap-4 rounded-3xl border border-border-muted bg-white px-5 py-4 shadow-xl">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">
                                        Actualizando resultados
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        Estamos aplicando tus filtros.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    )
}
