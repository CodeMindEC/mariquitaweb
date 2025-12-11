export interface MeiliProductHit {
    id?: string
    objectID?: string
    title?: string
    description?: string
    handle?: string
    thumbnail?: string
    min_price?: number | string | null
    max_price?: number | string | null
    currency_code?: string | null
    category_ids?: string[]
    category_names?: string[]
    tag_values?: string[]
    collection_id?: string | null
    collection_title?: string | null
    type_id?: string | null
    type_value?: string | null
    status?: string | null
    variant_skus?: string[]
    variant_weights?: number[]
    weight_price_map?: Record<number, number>
    weight_thumbnail_map?: Record<number, string | null>
    weight_for_min_price?: number | null
    weight_for_max_price?: number | null
    available_weights_text?: string[]
}

export const parseMeiliPrice = (value: unknown): number | null => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null
    }

    if (typeof value === "string") {
        const trimmed = value.trim()
        if (!trimmed) {
            return null
        }

        const normalized = trimmed.replace(/,/g, ".").replace(/[^0-9.\-]/g, "")
        if (!normalized) {
            return null
        }

        const firstDot = normalized.indexOf(".")
        let cleaned = normalized
        if (firstDot !== -1) {
            cleaned =
                normalized.slice(0, firstDot + 1) + normalized.slice(firstDot + 1).replace(/\./g, "")
        }

        const parsed = Number(cleaned)
        return Number.isFinite(parsed) ? parsed : null
    }

    return null
}
