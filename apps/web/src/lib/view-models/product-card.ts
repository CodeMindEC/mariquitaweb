import type { StoreProduct } from "../medusajs/products"
import {
    formatPrice,
    getProductThumbnail,
    getProductTitle,
} from "../medusajs/products"
import { resolveProductPricing } from "../medusajs/pricing"
import type { MeiliProductHit } from "../meilisearch/types"
import { parseMeiliPrice } from "../meilisearch/types"

const FALLBACK_IMAGE = "/images/product-placeholder.jpg"
const FALLBACK_NAME = "Producto"
const FALLBACK_COLLECTION = "Selección Mariquita"

export interface BaseCardViewModel {
    id: string
    name: string
    image: string
    highlightLabel: string
    weightText: string | null
    pricing: CardPricingInfo
}

export interface CardPricingInfo {
    priceText: string
    originalPriceText: string | null
    includesTax: boolean
    discountLabel: string | null
}

export interface StoreCardViewModel extends BaseCardViewModel {
    source: "store"
    product: StoreProduct
}

export interface SearchHitCardViewModel extends BaseCardViewModel {
    source: "search"
    hit: MeiliProductHit
}

export type CardViewModel = StoreCardViewModel | SearchHitCardViewModel

const isStoreProduct = (candidate: unknown): candidate is StoreProduct =>
    Boolean(candidate && typeof candidate === "object" && "variants" in candidate)

const buildHitPricing = (hit: MeiliProductHit) => {
    const minPrice = parseMeiliPrice(hit.min_price ?? null)
    const maxPrice = parseMeiliPrice(hit.max_price ?? null)
    const resolvedPrice = minPrice ?? maxPrice ?? 0
    const resolvedOriginal = maxPrice !== null && maxPrice > resolvedPrice ? maxPrice : null

    return {
        price: resolvedPrice,
        originalPrice: resolvedOriginal,
        includesTax: false,
        discountLabel: null,
    }
}

const toViewModelPricing = (
    pricing: ReturnType<typeof resolveProductPricing> | ReturnType<typeof buildHitPricing>,
): CardPricingInfo => ({
    priceText: formatPrice(pricing.price),
    originalPriceText: pricing.originalPrice !== null ? formatPrice(pricing.originalPrice) : null,
    includesTax: pricing.includesTax,
    discountLabel: pricing.discountLabel,
})

const normalizeStoreProduct = (product: StoreProduct): StoreCardViewModel => {
    const pricing = resolveProductPricing(product)

    // Extraer peso de las variantes
    let weightText: string | null = null
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        // Encontrar la variante con el precio más bajo
        let minPrice = Infinity
        let minPriceWeight: number | null = null

        for (const variant of product.variants) {
            if (variant.calculated_price && typeof variant.calculated_price.calculated_amount === 'number') {
                const variantPrice = variant.calculated_price.calculated_amount
                const variantWeight = variant.weight

                if (variantPrice < minPrice && variantWeight) {
                    minPrice = variantPrice
                    minPriceWeight = variantWeight
                }
            }
        }

        if (minPriceWeight !== null) {
            weightText = `${minPriceWeight}g`
        }
    }

    return {
        source: "store",
        id: product.id ?? product.handle ?? product.title ?? FALLBACK_NAME,
        name: getProductTitle(product) ?? FALLBACK_NAME,
        image: getProductThumbnail(product) ?? FALLBACK_IMAGE,
        highlightLabel:
            product.collection?.title ?? product.type?.value ?? FALLBACK_COLLECTION,
        weightText,
        pricing: toViewModelPricing(pricing),
        product,
    }
}

const normalizeHit = (hit: MeiliProductHit): SearchHitCardViewModel => {
    const pricing = buildHitPricing(hit)
    const weightText = hit.weight_for_min_price ? `${hit.weight_for_min_price}g` : null
    return {
        source: "search",
        id: (hit.objectID as string | undefined) ?? hit.id ?? hit.title ?? FALLBACK_NAME,
        name: hit.title ?? hit.description ?? FALLBACK_NAME,
        image: hit.thumbnail ?? FALLBACK_IMAGE,
        highlightLabel: hit.collection_title ?? hit.type_value ?? FALLBACK_COLLECTION,
        weightText,
        pricing: toViewModelPricing(pricing),
        hit,
    }
}

export const buildProductCardViewModel = (
    product?: StoreProduct | MeiliProductHit | null,
): CardViewModel | null => {
    if (!product) return null
    return isStoreProduct(product) ? normalizeStoreProduct(product) : normalizeHit(product)
}
