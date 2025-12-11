import type { APIRoute } from "astro"
import { listProducts } from "../../lib/medusajs/products"
import { computePriceRangeFromProducts } from "../../lib/meilisearch/converters"
import { parseIdList, parsePositiveNumber } from "../../lib/utils"

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 60

const parseNumericParam = (value: string | null, fallback: number, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
    if (!value) return fallback
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    const clamped = Math.max(min, Math.min(parsed, max))
    return clamped
}

export const GET: APIRoute = async ({ url }) => {
    const limit = parseNumericParam(url.searchParams.get("limit"), DEFAULT_LIMIT, {
        min: 1,
        max: MAX_LIMIT,
    })
    const offset = parseNumericParam(url.searchParams.get("offset"), 0, {
        min: 0,
    })
    const categoryIds = parseIdList(url, "category_id")
    const collectionIds = parseIdList(url, "collection_id", "collection")
    const tagValues = parseIdList(url, "tag", "tag_id", "tags")
    const typeIds = parseIdList(url, "type_id", "type")

    try {
        const response = await listProducts({
            limit,
            offset,
            category_id: categoryIds.length ? categoryIds : undefined,
            collection_id: collectionIds.length ? collectionIds : undefined,
            tag_id: tagValues.length ? tagValues : undefined,
            type_id: typeIds.length ? typeIds : undefined,
        })

        const priceRange = computePriceRangeFromProducts(response.products ?? [])

        return new Response(
            JSON.stringify({
                products: response.products ?? [],
                count: response.count ?? 0,
                limit: response.limit ?? limit,
                offset: response.offset ?? offset,
                priceRange,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        )
    } catch (error) {
        console.error("Error en /api/catalog", error)
        return new Response(
            JSON.stringify({ error: "No pudimos cargar el catálogo." }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        )
    }
}
