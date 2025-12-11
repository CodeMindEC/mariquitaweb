/**
 * Queries y operaciones específicas con Meilisearch
 */
import { MEILISEARCH_PRODUCTS_INDEX } from "./searchClient"

/**
 * Atributos a recuperar de Meilisearch en búsquedas de productos
 */
export const MEILISEARCH_PRODUCT_ATTRIBUTES = [
    'id',
    'objectID',
    'title',
    'description',
    'handle',
    'thumbnail',
    'min_price',
    'max_price',
    'currency_code',
    'category_ids',
    'category_names',
    'tag_values',
    'collection_id',
    'collection_title',
    'type_id',
    'type_value',
    'variant_weights',
    'weight_price_map',
    'weight_thumbnail_map',
    'weight_for_min_price',
    'weight_for_max_price',
    'available_weights_text',
    'status',
    'variant_skus'
] as const

/**
 * Obtiene las variantes disponibles (títulos) para una colección específica
 * @param collectionId - ID de la colección
 * @param meiliClient - Cliente de Meilisearch
 * @returns Array de títulos de variantes únicos
 */
export const getAvailableWeightsForCollection = async (
    collectionId: string,
    meiliClient: any
): Promise<string[]> => {
    try {
        const searchResults = await meiliClient
            .index(MEILISEARCH_PRODUCTS_INDEX)
            .search('', {
                filter: `collection_id = "${collectionId}"`,
                limit: 1000,
                attributesToRetrieve: ['available_weights_text']
            })

        const variantsSet = new Set<string>()

        for (const hit of searchResults.hits) {
            const variants = (hit as any).available_weights_text
            if (Array.isArray(variants)) {
                variants.forEach((v: string) => {
                    if (v && v.trim()) {
                        variantsSet.add(v.trim())
                    }
                })
            }
        }

        return Array.from(variantsSet).sort()
    } catch (error) {
        console.error('Error fetching available variants:', error)
        return []
    }
}
