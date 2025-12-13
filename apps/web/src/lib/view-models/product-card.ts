/**
 * View Models para tarjetas de producto
 * Orquesta la transformación de datos del dominio a modelos de presentación
 */
import type { StoreProduct } from "../medusajs/products"
import { getProductThumbnail, getProductTitle } from "../medusajs/products"
import type { MeiliProductHit } from "../meilisearch/types"
import { buildStorePricing, buildHitPricing, type PricingViewModel } from "./pricing"
import { FALLBACK_PRODUCT_IMAGE } from "../utils/constants"
import {
    extractCheapestWeight,
    extractCheapestVariant,
    extractProductId,
    extractHighlightLabel,
    extractHitId,
    extractHitName,
    extractHitHighlightLabel,
    formatWeight,
} from "./extractors"

const FALLBACK_IMAGE = FALLBACK_PRODUCT_IMAGE
const FALLBACK_NAME = "Producto"
const FALLBACK_COLLECTION = "Selección Mariquita"

/**
 * Modelo base para tarjetas de producto
 */
export interface BaseCardViewModel {
    id: string
    name: string
    image: string
    highlightLabel: string
    weightText: string | null
    pricing: PricingViewModel
    defaultVariant?: NonNullable<StoreProduct["variants"]>[number]
}

/**
 * View Model para productos del store (Medusa)
 */
export interface StoreCardViewModel extends BaseCardViewModel {
    source: "store"
    product: StoreProduct
}

/**
 * View Model para hits de búsqueda (Meilisearch)
 */
export interface SearchHitCardViewModel extends BaseCardViewModel {
    source: "search"
    hit: MeiliProductHit
}

export type CardViewModel = StoreCardViewModel | SearchHitCardViewModel

/**
 * Type guard para verificar si es un StoreProduct
 */
const isStoreProduct = (candidate: unknown): candidate is StoreProduct =>
    Boolean(candidate && typeof candidate === "object" && "variants" in candidate)

/**
 * Construye el view model desde un StoreProduct
 */
const buildStoreViewModel = (product: StoreProduct): StoreCardViewModel => {
    const weight = extractCheapestWeight(product)
    const cheapestVariant = extractCheapestVariant(product)

    return {
        source: "store",
        id: extractProductId(product),
        name: getProductTitle(product) ?? FALLBACK_NAME,
        image: getProductThumbnail(product) ?? FALLBACK_IMAGE,
        highlightLabel: extractHighlightLabel(product, FALLBACK_COLLECTION),
        weightText: formatWeight(weight),
        pricing: buildStorePricing(product),
        defaultVariant: cheapestVariant ?? undefined,
        product,
    }
}

/**
 * Construye el view model desde un MeiliProductHit
 */
const buildSearchViewModel = (hit: MeiliProductHit): SearchHitCardViewModel => {
    return {
        source: "search",
        id: extractHitId(hit),
        name: extractHitName(hit, FALLBACK_NAME),
        image: hit.thumbnail ?? FALLBACK_IMAGE,
        highlightLabel: extractHitHighlightLabel(hit, FALLBACK_COLLECTION),
        weightText: formatWeight(hit.weight_for_min_price ?? null),
        pricing: buildHitPricing(hit),
        hit,
    }
}

/**
 * Construye el view model apropiado según el tipo de producto
 * @param product - Producto del store o hit de búsqueda
 * @returns View model o null si no hay producto
 */
export const buildProductCardViewModel = (
    product?: StoreProduct | MeiliProductHit | null,
): CardViewModel | null => {
    if (!product) return null
    return isStoreProduct(product) ? buildStoreViewModel(product) : buildSearchViewModel(product)
}
