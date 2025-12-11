/**
 * View Models - Índice de exportaciones
 * Punto de entrada centralizado para todos los view models
 */

// Product Card View Models
export {
    buildProductCardViewModel,
    type CardViewModel,
    type StoreCardViewModel,
    type SearchHitCardViewModel,
    type BaseCardViewModel,
} from "./product-card"

// Pricing View Models
export {
    buildStorePricing,
    buildHitPricing,
    type PricingViewModel,
} from "./pricing"

// Data Extractors
export {
    extractCheapestWeight,
    extractProductId,
    extractHighlightLabel,
    extractHitId,
    extractHitName,
    extractHitHighlightLabel,
    formatWeight,
} from "./extractors"
