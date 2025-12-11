import type { MeiliProductHit } from "./types"
import type { StoreProduct } from "../medusajs/products"
import { MEILISEARCH_PRODUCTS_INDEX } from "./searchClient"

/**
 * Convierte un hit de Meilisearch a un producto compatible con StoreProduct
 */
export const convertMeiliHitToProduct = (hit: MeiliProductHit, selectedWeight?: number | null): StoreProduct => {
    let displayPrice: number | null
    let displayWeight: number | null
    let displayWeightText: string | null
    let displayThumbnail: string | null

    // Si hay un peso seleccionado y existe en el mapa, usar ese precio y thumbnail
    if (selectedWeight && hit.weight_price_map && hit.weight_price_map[selectedWeight] !== undefined) {
        displayPrice = hit.weight_price_map[selectedWeight]
        displayWeight = selectedWeight
        displayWeightText = `${selectedWeight}g`
        displayThumbnail = hit.weight_thumbnail_map?.[selectedWeight] || hit.thumbnail || null
    } else {
        // Caso por defecto: usar precio mínimo
        displayPrice = typeof hit.min_price === 'number' ? hit.min_price :
            typeof hit.min_price === 'string' ? parseFloat(hit.min_price) : null
        displayWeight = hit.weight_for_min_price ?? null
        displayWeightText = displayWeight ? `${displayWeight}g` : null
        // Usar thumbnail de la variante de menor precio si está disponible
        displayThumbnail = (displayWeight && hit.weight_thumbnail_map?.[displayWeight]) || hit.thumbnail || null
    }

    const maxPrice = typeof hit.max_price === 'number' ? hit.max_price :
        typeof hit.max_price === 'string' ? parseFloat(hit.max_price) : null

    // Crear una variante fake para que resolveProductPricing funcione correctamente
    const fakeVariant = displayPrice !== null ? {
        id: `${hit.id || hit.objectID}-variant-1`,
        title: displayWeightText || 'Default',
        calculated_price: {
            calculated_amount: displayPrice,
            original_amount: maxPrice && maxPrice > displayPrice ? maxPrice : displayPrice,
        },
        prices: [{
            amount: displayPrice,
            currency_code: hit.currency_code || 'USD',
        }],
        weight: displayWeight,
    } : undefined

    return {
        id: hit.id || hit.objectID || '',
        title: hit.title || '',
        description: hit.description || '',
        handle: hit.handle || '',
        thumbnail: displayThumbnail,
        status: hit.status as any || 'published',
        variants: fakeVariant ? [fakeVariant] : [],
        categories: hit.category_ids?.map((id, idx) => ({
            id,
            name: hit.category_names?.[idx]
        })) || [],
        collection: hit.collection_id ? {
            id: hit.collection_id,
            title: hit.collection_title || ''
        } : null,
        type: hit.type_id ? {
            id: hit.type_id,
            value: hit.type_value || ''
        } : null,
        tags: hit.tag_values?.map(value => ({ value })) || [],
        // Guardar también en campos especiales por compatibilidad
        _meili_min_price: displayPrice,
        _meili_max_price: maxPrice,
        _meili_currency: hit.currency_code || 'USD',
        _meili_weight: displayWeight,
        _meili_weight_text: displayWeightText,
        _meili_available_weights: hit.variant_weights || [],
    } as any
}

/**
 * Construye filtros de Meilisearch basados en los filtros del catálogo
 */
export const buildMeilisearchFilters = (filters: {
    categoryIds: string[]
    collectionId: string | null
    tagIds: string[]
    typeIds: string[]
    weight?: number | null
    status?: string
}): string | undefined => {
    const filterParts: string[] = []

    // Status filter
    if (filters.status) {
        filterParts.push(`status = "${filters.status}"`)
    }

    // Category filters
    if (filters.categoryIds.length > 0) {
        const categoryFilter = filters.categoryIds
            .map(id => `category_ids = "${id}"`)
            .join(' OR ')
        filterParts.push(`(${categoryFilter})`)
    }

    // Collection filter
    if (filters.collectionId) {
        filterParts.push(`collection_id = "${filters.collectionId}"`)
    }

    // Tag filters
    if (filters.tagIds.length > 0) {
        const tagFilter = filters.tagIds
            .map(id => `tag_values = "${id}"`)
            .join(' OR ')
        filterParts.push(`(${tagFilter})`)
    }

    // Type filters
    if (filters.typeIds.length > 0) {
        const typeFilter = filters.typeIds
            .map(id => `type_id = "${id}"`)
            .join(' OR ')
        filterParts.push(`(${typeFilter})`)
    }

    // Weight filter (solo si se especifica un peso)
    if (filters.weight !== undefined && filters.weight !== null) {
        filterParts.push(`variant_weights = ${filters.weight}`)
    }

    return filterParts.length > 0 ? filterParts.join(' AND ') : undefined
}

/**
 * Obtiene los pesos disponibles para una colección específica desde Meilisearch
 */
export const getAvailableWeightsForCollection = async (
    collectionId: string,
    meiliClient: any
): Promise<number[]> => {
    try {
        const searchResults = await meiliClient
            .index(MEILISEARCH_PRODUCTS_INDEX)
            .search('', {
                filter: `collection_id = "${collectionId}"`,
                limit: 1000,
                attributesToRetrieve: ['variant_weights']
            })

        const weightsSet = new Set<number>()

        for (const hit of searchResults.hits) {
            const weights = (hit as any).variant_weights
            if (Array.isArray(weights)) {
                weights.forEach((w: number) => weightsSet.add(w))
            }
        }

        return Array.from(weightsSet).sort((a, b) => a - b)
    } catch (error) {
        console.error('Error fetching weights from Meilisearch:', error)
        return []
    }
}

/**
 * Atributos a recuperar de Meilisearch
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
 * Calcula el rango de precios de una lista de productos
 */
export const computePriceRangeFromProducts = (products: StoreProduct[]) => {
    const prices = products
        .map(p => (p as any)._meili_min_price)
        .filter(price => typeof price === "number" && price >= 0)

    if (!prices.length) {
        return { min: 0, max: 100 }
    }

    return {
        min: Math.max(0, Math.floor(Math.min(...prices))),
        max: Math.max(1, Math.ceil(Math.max(...prices))),
    }
}
