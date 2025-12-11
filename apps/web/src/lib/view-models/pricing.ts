/**
 * Construcción de pricing para view models
 * Separa la lógica de pricing del dominio de la presentación
 */
import { formatPrice } from "../medusajs/products"
import { resolveProductPricing } from "../medusajs/pricing"
import type { StoreProduct } from "../medusajs/products"
import type { MeiliProductHit } from "../meilisearch/types"
import { parseMeiliPrice } from "../meilisearch/types"

export interface PricingViewModel {
    priceText: string
    originalPriceText: string | null
    includesTax: boolean
    discountLabel: string | null
}

/**
 * Construye el pricing de un StoreProduct
 */
export const buildStorePricing = (product: StoreProduct): PricingViewModel => {
    const pricing = resolveProductPricing(product)

    return {
        priceText: formatPrice(pricing.price),
        originalPriceText: pricing.originalPrice !== null ? formatPrice(pricing.originalPrice) : null,
        includesTax: pricing.includesTax,
        discountLabel: pricing.discountLabel,
    }
}

/**
 * Construye el pricing de un MeiliProductHit
 */
export const buildHitPricing = (hit: MeiliProductHit): PricingViewModel => {
    const minPrice = parseMeiliPrice(hit.min_price ?? null)
    const maxPrice = parseMeiliPrice(hit.max_price ?? null)
    const price = minPrice ?? maxPrice ?? 0
    const originalPrice = maxPrice !== null && maxPrice > price ? maxPrice : null

    return {
        priceText: formatPrice(price),
        originalPriceText: originalPrice !== null ? formatPrice(originalPrice) : null,
        includesTax: false,
        discountLabel: null,
    }
}
