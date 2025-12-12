/**
 * Extracción de datos de productos
 * Funciones puras para obtener información de productos sin lógica de presentación
 */
import type { StoreProduct } from "../medusajs/products"
import type { MeiliProductHit } from "../meilisearch/types"

/**
 * Extrae el peso de la variante más barata de un producto
 */
export const extractCheapestWeight = (product: StoreProduct): number | null => {
    if (!product.variants?.length) return null

    let minPrice = Infinity
    let minPriceWeight: number | null = null

    for (const variant of product.variants) {
        const calculatedAmount = variant.calculated_price?.calculated_amount
        const weight = variant.weight

        if (typeof calculatedAmount === 'number' && calculatedAmount < minPrice && weight) {
            minPrice = calculatedAmount
            minPriceWeight = weight
        }
    }

    return minPriceWeight
}

export const extractCheapestVariant = (product: StoreProduct) => {
    if (!product.variants?.length) return null

    let minPrice = Infinity
    let cheapestVariant: NonNullable<StoreProduct["variants"]>[number] | null = null

    for (const variant of product.variants) {
        const calculatedAmount = variant.calculated_price?.calculated_amount
        const weight = variant.weight

        if (typeof calculatedAmount === "number" && calculatedAmount < minPrice && weight) {
            minPrice = calculatedAmount
            cheapestVariant = variant
        }
    }

    return cheapestVariant
}

/**
 * Extrae el ID del producto con fallback
 */
export const extractProductId = (product: StoreProduct): string => {
    return product.id ?? product.handle ?? product.title ?? "unknown"
}

/**
 * Extrae el label destacado (colección o tipo)
 */
export const extractHighlightLabel = (product: StoreProduct, fallback: string): string => {
    return product.collection?.title ?? product.type?.value ?? fallback
}

/**
 * Extrae el ID de un hit de Meilisearch
 */
export const extractHitId = (hit: MeiliProductHit): string => {
    return (hit.objectID as string | undefined) ?? hit.id ?? hit.title ?? "unknown"
}

/**
 * Extrae el nombre de un hit de Meilisearch
 */
export const extractHitName = (hit: MeiliProductHit, fallback: string): string => {
    return hit.title ?? hit.description ?? fallback
}

/**
 * Extrae el label destacado de un hit
 */
export const extractHitHighlightLabel = (hit: MeiliProductHit, fallback: string): string => {
    return hit.collection_title ?? hit.type_value ?? fallback
}

/**
 * Formatea un peso en gramos
 */
export const formatWeight = (weight: number | null): string | null => {
    return weight !== null ? `${weight}g` : null
}
