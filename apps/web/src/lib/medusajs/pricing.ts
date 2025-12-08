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

const getVariantAmount = (price: VariantCalculatedPrice | null | undefined) => {
    if (!price) {
        return null
    }
    return (
        price.calculated_amount_with_tax ??
        price.calculated_amount ??
        price.original_amount_with_tax ??
        price.original_amount ??
        null
    )
}

const amountIncludesTax = (price: VariantCalculatedPrice | null | undefined) =>
    Boolean(
        price?.calculated_amount_with_tax ??
        price?.original_amount_with_tax ??
        null,
    )

const resolveFallbackVariantAmount = (
    variants: StoreProduct["variants"] | null | undefined,
) => {
    if (!Array.isArray(variants)) {
        return null
    }

    const normalizedCurrency = DEFAULT_CURRENCY?.toLowerCase() ?? null
    const candidates = variants
        .map((variant) => {
            if (!variant) return null
            const priceList = (variant as VariantWithFallbackPrices).prices ?? []
            if (!priceList.length) return null

            const preferred = normalizedCurrency
                ? priceList.find(
                    (entry) =>
                        entry.currency_code?.toLowerCase() === normalizedCurrency &&
                        typeof entry.amount === "number",
                )
                : null

            const resolvedEntry = preferred ?? priceList.find((entry) => typeof entry.amount === "number") ?? null
            if (!resolvedEntry || typeof resolvedEntry.amount !== "number") {
                return null
            }

            return {
                amount: resolvedEntry.amount,
                includesTax: Boolean(resolvedEntry.includes_tax),
            }
        })
        .filter((entry): entry is { amount: number; includesTax: boolean } => Boolean(entry))

    if (!candidates.length) {
        return null
    }

    candidates.sort((a, b) => a.amount - b.amount)
    return candidates[0]
}

export function resolveProductPricing(product: StoreProduct): ProductPricingSummary {
    const variants = product.variants ?? []

    const featuredEntry = [...variants]
        .map((variant) => {
            const priceSet = variant.calculated_price as VariantCalculatedPrice | null
            return {
                priceSet,
                amount: getVariantAmount(priceSet),
            }
        })
        .filter((entry) => entry.amount !== null)
        .sort((a, b) => a.amount! - b.amount!)
    [0]

    const priceSet = featuredEntry?.priceSet ?? null
    let featuredAmount = featuredEntry?.amount ?? null
    let includesTax = amountIncludesTax(priceSet)

    if (featuredAmount === null) {
        const fallbackEntry = resolveFallbackVariantAmount(variants)
        if (fallbackEntry) {
            featuredAmount = fallbackEntry.amount
            includesTax = fallbackEntry.includesTax
        }
    }
    const calculatedAmount = includesTax
        ? priceSet?.calculated_amount_with_tax ?? priceSet?.calculated_amount ?? null
        : priceSet?.calculated_amount ?? null
    const originalAmount = includesTax
        ? priceSet?.original_amount_with_tax ?? priceSet?.original_amount ?? null
        : priceSet?.original_amount ?? null

    const price = featuredAmount ?? calculatedAmount ?? originalAmount ?? 0

    const priceListType = priceSet?.calculated_price?.price_list_type ?? null
    let originalPrice: number | null = null
    let discountPercentage: number | null = null
    let discountLabel: string | null = null

    if (
        priceListType === "sale" &&
        originalAmount !== null &&
        originalAmount > price
    ) {
        originalPrice = originalAmount
        const diff = originalAmount - price
        discountPercentage = Math.round((diff / originalAmount) * 100)
        discountLabel = `-${discountPercentage}%`
    }

    return {
        price,
        originalPrice,
        discountPercentage,
        discountLabel,
        includesTax,
        priceListType,
    }
}

export const getProductThumbnail = (product: StoreProduct) =>
    product.thumbnail ?? product.images?.[0]?.url ?? "/images/placeholder-product.jpg"

export const getProductTitle = (product: StoreProduct) => product.title ?? "Producto sin nombre"
