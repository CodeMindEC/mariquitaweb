import type { StoreProduct } from "./products"

interface VariantCalculatedPrice {
    calculated_amount?: number
    calculated_amount_with_tax?: number
    original_amount?: number
    original_amount_with_tax?: number
    calculated_price?: {
        price_list_type?: string
    }
}

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
    const featuredAmount = featuredEntry?.amount ?? null
    const includesTax = amountIncludesTax(priceSet)
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
