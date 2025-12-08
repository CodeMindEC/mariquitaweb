import type { APIRoute } from "astro"
import { DEFAULT_LANGUAGE, listProducts, searchProducts } from "../../lib/medusajs/products"
import { hydrateProducts } from "../../lib/medusajs/product-cache"

const DEFAULT_LIMIT = 6
const MAX_LIMIT = 12

const fetchProductsByIds = async (ids: string[]) => {
    if (!ids.length) {
        return []
    }

    const response = await listProducts({
        id: ids,
        limit: ids.length,
        offset: 0,
    })

    return response.products ?? []
}

const parseSearchParams = (url: URL) => {
    const query = url.searchParams.get("q")?.trim() ?? ""
    const limitParam = Number(url.searchParams.get("limit"))
    const offsetParam = Number(url.searchParams.get("offset"))
    const hasLimit = Number.isFinite(limitParam)
    const hasOffset = Number.isFinite(offsetParam)
    const categoryIds = url.searchParams.getAll("category_id").filter(Boolean)
    const collectionIds = url.searchParams.getAll("collection_id").filter(Boolean)

    return {
        query,
        limit:
            hasLimit && limitParam > 0
                ? Math.min(limitParam, MAX_LIMIT)
                : DEFAULT_LIMIT,
        offset:
            hasOffset && offsetParam >= 0
                ? offsetParam
                : 0,
        region_id: url.searchParams.get("region_id") ?? undefined,
        currency_code: url.searchParams.get("currency_code") ?? undefined,
        language: url.searchParams.get("language") ?? DEFAULT_LANGUAGE,
        category_id: categoryIds.length ? categoryIds : undefined,
        collection_id: collectionIds.length ? collectionIds : undefined,
        status: url.searchParams.get("status") ?? undefined,
    }
}

export const GET: APIRoute = async ({ url }) => {
    const params = parseSearchParams(url)
    const isWildcardQuery = params.query === "*"

    if (!params.query) {
        return new Response(JSON.stringify({ products: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    }

    try {
        if (isWildcardQuery) {
            const { products, count, limit, offset } = await listProducts({
                limit: params.limit,
                offset: params.offset,
                category_id: params.category_id,
                collection_id: params.collection_id,
                region_id: params.region_id,
            })

            return new Response(
                JSON.stringify({ products, count, limit, offset }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                },
            )
        }

        const { products, count, limit, offset } = await searchProducts(params)
        const filteredProducts = params.status
            ? products.filter((product) => product.status === params.status)
            : products
        const resolvedCount = params.status ? filteredProducts.length : count
        const hydratedProducts = await hydrateProducts(filteredProducts, fetchProductsByIds)

        return new Response(
            JSON.stringify({ products: hydratedProducts, count: resolvedCount, limit, offset }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        )
    } catch (error) {
        console.error("Error en /api/search", error)
        return new Response(
            JSON.stringify({ error: "No pudimos obtener resultados." }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        )
    }
}
