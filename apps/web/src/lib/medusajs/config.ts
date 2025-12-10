const medusaDefaults = {
    regionId: import.meta.env.PUBLIC_MEDUSA_REGION_ID,
    currencyCode: import.meta.env.PUBLIC_MEDUSA_CURRENCY_CODE || "USD",
    language: import.meta.env.PUBLIC_DEFAULT_LANGUAGE ?? "es",
    locale: import.meta.env.PUBLIC_DEFAULT_LOCALE ?? "es-EC",
} as const

export const MEDUSA_DEFAULTS = medusaDefaults

export const DEFAULT_LANGUAGE = medusaDefaults.language
export const DEFAULT_CURRENCY = medusaDefaults.currencyCode
export const DEFAULT_REGION_ID = medusaDefaults.regionId

export const ensureRegionId = (explicit?: string) => {
    const regionId = explicit ?? medusaDefaults.regionId
    if (!regionId) {
        throw new Error(
            "Falta PUBLIC_MEDUSA_REGION_ID en .env para poder calcular los precios.",
        )
    }
    return regionId
}

const priceFormatter = new Intl.NumberFormat(medusaDefaults.locale, {
    style: "currency",
    currency: medusaDefaults.currencyCode,
})

export const formatPrice = (amount: number) => priceFormatter.format(amount)
