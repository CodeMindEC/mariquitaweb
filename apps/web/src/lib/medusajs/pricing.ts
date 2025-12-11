import type { StoreProduct } from "./products"
import { DEFAULT_CURRENCY } from "./products"

interface VariantCalculatedPrice {
    calculated_amount?: number
    calculated_amount_with_tax?: number
    original_amount?: number
    original_amount_with_tax?: number
    calculated_price?: {
        price_list_type?: string
    }
}

interface VariantPriceEntry {
    amount?: number
    currency_code?: string
    includes_tax?: boolean
}

type StoreProductVariants = NonNullable<StoreProduct["variants"]>
type VariantWithFallbackPrices = StoreProductVariants extends Array<infer Variant>
    ? Variant & { prices?: VariantPriceEntry[] }
    : { prices?: VariantPriceEntry[] }

export interface ProductPricingSummary {
    price: number
    originalPrice: number | null
    discountPercentage: number | null
    discountLabel: string | null
    includesTax: boolean
    priceListType: string | null
}

/**
 * Extrae el precio de una variante calculada
 */
const extractPrice = (priceSet: VariantCalculatedPrice | null | undefined): number | null => {
    if (!priceSet) return null

    return (
        priceSet.calculated_amount_with_tax ??
        priceSet.calculated_amount ??
        priceSet.original_amount_with_tax ??
        priceSet.original_amount ??
        null
    )
}

/**
 * Verifica si el precio incluye impuestos
 */
const includesTax = (priceSet: VariantCalculatedPrice | null | undefined): boolean =>
    Boolean(priceSet?.calculated_amount_with_tax ?? priceSet?.original_amount_with_tax)

/**
 * Encuentra el precio más bajo de las variantes con calculated_price
 */
const findCheapestVariant = (variants: StoreProduct["variants"]) => {
    if (!Array.isArray(variants) || !variants.length) return null

    const sortedVariants = variants
        .map((variant) => {
            const priceSet = variant.calculated_price as VariantCalculatedPrice | null
            return {
                priceSet,
                amount: extractPrice(priceSet),
            }
        })
        .filter((entry) => entry.amount !== null)
        .sort((a, b) => a.amount! - b.amount!)

    return sortedVariants[0] ?? null
}

/**
 * Busca precio en la lista de precios raw de las variantes (fallback)
 */
const findFallbackPrice = (variants: StoreProduct["variants"]) => {
    if (!Array.isArray(variants)) return null

    const normalizedCurrency = DEFAULT_CURRENCY?.toLowerCase() ?? null
    const candidates = variants
        .map((variant) => {
            if (!variant) return null
            const priceList = (variant as VariantWithFallbackPrices).prices ?? []
            if (!priceList.length) return null

            // Preferir precios en la moneda configurada
            const preferred = normalizedCurrency
                ? priceList.find(
                    (entry) =>
                        entry.currency_code?.toLowerCase() === normalizedCurrency &&
                        typeof entry.amount === "number",
                )
                : null

            const resolvedEntry = preferred ?? priceList.find((entry) => typeof entry.amount === "number")

            return resolvedEntry && typeof resolvedEntry.amount === "number"
                ? {
                    amount: resolvedEntry.amount,
                    includesTax: Boolean(resolvedEntry.includes_tax),
                }
                : null
        })
        .filter((entry): entry is { amount: number; includesTax: boolean } => Boolean(entry))

    if (!candidates.length) return null

    // Retornar el más económico
    return candidates.sort((a, b) => a.amount - b.amount)[0]
}

/**
 * Calcula el descuento si aplica
 */
const calculateDiscount = (price: number, originalAmount: number | null, priceListType: string | null) => {
    if (priceListType !== "sale" || !originalAmount || originalAmount <= price) {
        return {
            originalPrice: null,
            discountPercentage: null,
            discountLabel: null,
        }
    }

    const diff = originalAmount - price
    const discountPercentage = Math.round((diff / originalAmount) * 100)

    return {
        originalPrice: originalAmount,
        discountPercentage,
        discountLabel: `-${discountPercentage}%`,
    }
}

/**
 * Resuelve el pricing de un producto siguiendo esta estrategia:
 * 1. Busca la variante más barata con calculated_price
 * 2. Si no hay, usa la lista de precios raw
 * 3. Si no hay, retorna 0
 */
export function resolveProductPricing(product: StoreProduct): ProductPricingSummary {
    const variants = product.variants ?? []

    // Estrategia 1: Buscar variante más barata con precio calculado
    const cheapestVariant = findCheapestVariant(variants)
    let price: number
    let hasTax: boolean
    let priceSet: VariantCalculatedPrice | null = null

    if (cheapestVariant) {
        priceSet = cheapestVariant.priceSet
        price = cheapestVariant.amount!
        hasTax = includesTax(priceSet)
    } else {
        // Estrategia 2: Fallback a lista de precios raw
        const fallback = findFallbackPrice(variants)
        if (fallback) {
            price = fallback.amount
            hasTax = fallback.includesTax
        } else {
            // Estrategia 3: Sin precio disponible
            return {
                price: 0,
                originalPrice: null,
                discountPercentage: null,
                discountLabel: null,
                includesTax: false,
                priceListType: null,
            }
        }
    }

    // Extraer precio original y tipo de lista
    const priceListType = priceSet?.calculated_price?.price_list_type ?? null
    const originalAmount = hasTax
        ? priceSet?.original_amount_with_tax ?? priceSet?.original_amount ?? null
        : priceSet?.original_amount ?? null

    // Calcular descuento si aplica
    const discount = calculateDiscount(price, originalAmount, priceListType)

    return {
        price,
        ...discount,
        includesTax: hasTax,
        priceListType,
    }
}

