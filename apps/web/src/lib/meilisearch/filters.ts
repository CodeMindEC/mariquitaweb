/**
 * Construcción de filtros para consultas de Meilisearch
 */

export interface CatalogFilters {
    categoryIds: string[]
    collectionId: string | null
    tagIds: string[]
    typeIds: string[]
    weight?: number | null
    status?: string
}

/**
 * Construye el string de filtro para status
 */
const buildStatusFilter = (status?: string): string | null => {
    return status ? `status = "${status}"` : null
}

/**
 * Construye el string de filtro para categorías
 */
const buildCategoryFilter = (categoryIds: string[]): string | null => {
    if (!categoryIds.length) return null

    const filters = categoryIds.map(id => `category_ids = "${id}"`)
    return `(${filters.join(' OR ')})`
}

/**
 * Construye el string de filtro para colección
 */
const buildCollectionFilter = (collectionId: string | null): string | null => {
    return collectionId ? `collection_id = "${collectionId}"` : null
}

/**
 * Construye el string de filtro para tags
 */
const buildTagFilter = (tagIds: string[]): string | null => {
    if (!tagIds.length) return null

    const filters = tagIds.map(id => `tag_values = "${id}"`)
    return `(${filters.join(' OR ')})`
}

/**
 * Construye el string de filtro para tipos
 */
const buildTypeFilter = (typeIds: string[]): string | null => {
    if (!typeIds.length) return null

    const filters = typeIds.map(id => `type_id = "${id}"`)
    return `(${filters.join(' OR ')})`
}

/**
 * Construye el string de filtro para peso/variante (usa peso numérico filterable)
 */
const buildWeightFilter = (weight?: number | null): string | null => {
    return (weight !== undefined && weight !== null) ? `variant_weights = ${weight}` : null
}

/**
 * Construye el string completo de filtros para Meilisearch
 * @param filters - Objeto con los filtros del catálogo
 * @returns String de filtro Meilisearch o undefined si no hay filtros
 */
export const buildMeilisearchFilters = (filters: CatalogFilters): string | undefined => {
    const filterParts = [
        buildStatusFilter(filters.status),
        buildCategoryFilter(filters.categoryIds),
        buildCollectionFilter(filters.collectionId),
        buildTagFilter(filters.tagIds),
        buildTypeFilter(filters.typeIds),
        buildWeightFilter(filters.weight),
    ].filter((part): part is string => part !== null)

    return filterParts.length > 0 ? filterParts.join(' AND ') : undefined
}
