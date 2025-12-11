/**
 * Re-exports de utilidades de Meilisearch para compatibilidad
 * @deprecated Importa directamente desde converters, filters o queries
 */

// Converters
export { convertMeiliHitToProduct, computePriceRangeFromProducts } from "./converters"

// Filters
export { buildMeilisearchFilters } from "./filters"
export type { CatalogFilters } from "./filters"

// Queries
export { getAvailableWeightsForCollection, MEILISEARCH_PRODUCT_ATTRIBUTES } from "./queries"

