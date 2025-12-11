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
 * Tipo para el mapeo de variantes (título a peso numérico)
 */
export interface VariantMapping {
    title: string
    weight: number
}

/**
 * Obtiene las variantes disponibles para una colección con mapeo título → peso
 * @param collectionId - ID de la colección
 * @param meiliClient - Cliente de Meilisearch
 * @returns Array de mapeos {title, weight}
 */
export const getAvailableWeightsForCollection = async (
    collectionId: string,
    meiliClient: any
): Promise<VariantMapping[]> => {
    try {
        const searchResults = await meiliClient
            .index(MEILISEARCH_PRODUCTS_INDEX)
            .search('', {
                filter: `collection_id = "${collectionId}"`,
                limit: 1000,
                attributesToRetrieve: ['variant_weights', 'available_weights_text']
            })

        const variantsMap = new Map<number, string>()

        for (const hit of searchResults.hits) {
            const weights = (hit as any).variant_weights
            const titles = (hit as any).available_weights_text

            if (Array.isArray(weights) && Array.isArray(titles)) {
                weights.forEach((weight: number, index: number) => {
                    if (index < titles.length && !variantsMap.has(weight)) {
                        variantsMap.set(weight, titles[index])
                    }
                })
            }
        }

        return Array.from(variantsMap.entries())
            .map(([weight, title]) => ({ title, weight }))
            .sort((a, b) => a.weight - b.weight)
    } catch (error) {
        console.error('Error fetching available variants:', error)
        return []
    }
}
