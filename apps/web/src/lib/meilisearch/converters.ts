/**
 * Convierte hits de Meilisearch a productos StoreProduct
 */
import type { MeiliProductHit } from "./types"
import type { StoreProduct } from "../medusajs/products"
import { parseMeiliPrice } from "./types"

/**
 * Encuentra el peso numérico correspondiente a un título de variante
 */
const findWeightFromTitle = (hit: MeiliProductHit, variantTitle: string): number | null => {
    const titles = hit.available_weights_text
    const weights = hit.variant_weights

    if (!Array.isArray(titles) || !Array.isArray(weights)) {
        return null
    }

    const index = titles.findIndex(t => t === variantTitle)
    return index >= 0 && index < weights.length ? weights[index] : null
}

/**
 * Selecciona el precio y peso a mostrar según el contexto
 */
const selectDisplayData = (hit: MeiliProductHit, selectedWeight?: number | null, selectedTitle?: string | null) => {
    // Si hay un peso seleccionado y existe en el mapa, usar ese precio y thumbnail
    if (selectedWeight && hit.weight_price_map?.[selectedWeight] !== undefined) {
        return {
            price: hit.weight_price_map[selectedWeight],
            weight: selectedWeight,
            weightText: selectedTitle || `${selectedWeight}g`,
            thumbnail: hit.weight_thumbnail_map?.[selectedWeight] || hit.thumbnail || null,
        }
    }

    // Caso por defecto: usar precio mínimo
    const minPrice = parseMeiliPrice(hit.min_price)
    const weight = hit.weight_for_min_price ?? null

    // Buscar el título correspondiente al peso mínimo
    let minWeightTitle: string | null = null
    if (weight && hit.available_weights_text && hit.variant_weights) {
        const index = hit.variant_weights.indexOf(weight)
        if (index >= 0 && index < hit.available_weights_text.length) {
            minWeightTitle = hit.available_weights_text[index]
        }
    }

    const thumbnail = (weight && hit.weight_thumbnail_map?.[weight]) || hit.thumbnail || null

    return {
        price: minPrice,
        weight,
        weightText: minWeightTitle || (weight ? `${weight}g` : null),
        thumbnail,
    }
}

/**
 * Crea una variante fake compatible con resolveProductPricing
 */
const createFakeVariant = (displayData: ReturnType<typeof selectDisplayData>, hit: MeiliProductHit) => {
    if (displayData.price === null) return undefined

    const maxPrice = parseMeiliPrice(hit.max_price)

    return {
        id: `${hit.id || hit.objectID}-variant-1`,
        title: displayData.weightText || 'Default',
        calculated_price: {
            calculated_amount: displayData.price,
            original_amount: maxPrice && maxPrice > displayData.price ? maxPrice : displayData.price,
        },
        prices: [{
            amount: displayData.price,
            currency_code: hit.currency_code || 'USD',
        }],
        weight: displayData.weight,
    }
}

/**
 * Convierte un hit de Meilisearch a un StoreProduct
 * @param hit - Hit de Meilisearch
 * @param selectedWeight - Peso numérico seleccionado para filtrar (opcional)
 */
export const convertMeiliHitToProduct = (hit: MeiliProductHit, selectedWeight?: number | null): StoreProduct => {
    // Si hay un peso seleccionado, encontrar su título
    let selectedTitle: string | null = null
    if (selectedWeight && hit.variant_weights && hit.available_weights_text) {
        const index = hit.variant_weights.indexOf(selectedWeight)
        if (index >= 0 && index < hit.available_weights_text.length) {
            selectedTitle = hit.available_weights_text[index]
        }
    }

    const displayData = selectDisplayData(hit, selectedWeight, selectedTitle)
    const fakeVariant = createFakeVariant(displayData, hit)

    const maxPrice = parseMeiliPrice(hit.max_price)

    return {
        id: hit.id || hit.objectID || '',
        title: hit.title || '',
        description: hit.description || '',
        handle: hit.handle || '',
        thumbnail: displayData.thumbnail,
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
        // Metadata de Meilisearch para uso interno
        _meili_min_price: displayData.price,
        _meili_max_price: maxPrice,
        _meili_currency: hit.currency_code || 'USD',
        _meili_weight: displayData.weight,
        _meili_weight_text: displayData.weightText,
        _meili_available_weights: hit.variant_weights || [],
    } as any
}

/**
 * Calcula el rango de precios de productos con metadata de Meilisearch
 */
export const computePriceRangeFromProducts = (products: StoreProduct[]) => {
    const prices = products
        .map(p => (p as any)._meili_min_price)
        .filter((price): price is number => typeof price === "number" && price >= 0)

    if (!prices.length) {
        return { min: 0, max: 100 }
    }

    return {
        min: Math.max(0, Math.floor(Math.min(...prices))),
        max: Math.max(1, Math.ceil(Math.max(...prices))),
    }
}
