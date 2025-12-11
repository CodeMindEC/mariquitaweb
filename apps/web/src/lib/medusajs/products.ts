// src/lib/products.ts
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusaClient"
import { cacheProducts } from "./product-cache"
import { ensureRegionId, MEDUSA_DEFAULTS } from "./config"
import { createCache, serializeCacheKey } from "./cache"

// Re-export solo los tipos más usados para conveniencia
export type StoreProduct = HttpTypes.StoreProduct
export type StoreCollection = HttpTypes.StoreCollection

const DEFAULT_COLLECTION_CACHE_TTL_MS = 60 * 1000
const DEFAULT_REFERENCE_CACHE_TTL_MS = 60 * 1000

const COLLECTION_CACHE_TTL_MS = Number(import.meta.env.PUBLIC_COLLECTION_CACHE_TTL ?? DEFAULT_COLLECTION_CACHE_TTL_MS)
const REFERENCE_CACHE_TTL_MS = Number(import.meta.env.PUBLIC_MEDUSA_REFERENCE_CACHE_TTL ?? DEFAULT_REFERENCE_CACHE_TTL_MS)

// Sistema de caché unificado
const collectionsCache = createCache<HttpTypes.StoreCollectionListResponse>(COLLECTION_CACHE_TTL_MS)
const categoriesCache = createCache<HttpTypes.StoreProductCategoryListResponse>(REFERENCE_CACHE_TTL_MS)
const tagsCache = createCache<HttpTypes.StoreProductTagListResponse>(REFERENCE_CACHE_TTL_MS)
const typesCache = createCache<HttpTypes.StoreProductTypeListResponse>(REFERENCE_CACHE_TTL_MS)

const PRODUCT_DEFAULT_FIELDS = [
    "id",
    "title",
    "handle",
    "thumbnail",
    "status",
    "collection_id",
    "collection",
    "variants.id",
    "variants.calculated_price",
    "variants.prices",
    "variants.weight",
    "*categories",
    "type_id",
    "*type",
    "*tags",
]

const SEARCH_PRODUCT_FIELDS = [
    ...PRODUCT_DEFAULT_FIELDS,
    "description",
    "collection",
]

export const PRODUCT_FIELDS_QUERY = PRODUCT_DEFAULT_FIELDS.join(",")

const normalizePagination = (
    limit: number | undefined,
    offset: number | undefined,
    fallbackLimit: number,
) => ({
    limit: Number.isFinite(limit) && (limit as number) > 0 ? (limit as number) : fallbackLimit,
    offset: Number.isFinite(offset) && (offset as number) >= 0 ? (offset as number) : 0,
})

const emptyProducts = (limit: number, offset: number): HttpTypes.StoreProductListResponse => ({
    products: [],
    count: 0,
    limit,
    offset,
})

const emptyProductList = (): StoreProduct[] => []

const emptyCategories = (limit: number, offset: number): HttpTypes.StoreProductCategoryListResponse => ({
    product_categories: [],
    count: 0,
    limit,
    offset,
})

const emptyCollections = (limit: number, offset: number): HttpTypes.StoreCollectionListResponse => ({
    collections: [],
    count: 0,
    limit,
    offset,
})

const emptyTags = (limit: number, offset: number): HttpTypes.StoreProductTagListResponse => ({
    product_tags: [],
    count: 0,
    limit,
    offset,
})

const emptyTypes = (limit: number, offset: number): HttpTypes.StoreProductTypeListResponse => ({
    product_types: [],
    count: 0,
    limit,
    offset,
})

const withFallback = async <T>(
    label: string,
    task: () => Promise<T>,
    fallback: T,
): Promise<T> => {
    try {
        return await task()
    } catch (error) {
        console.error(`Error ${label}:`, error)
        return fallback
    }
}

/**
 * Lista productos + precios de variantes usando calculated_price.
 */
export async function listProducts(
    params: HttpTypes.StoreProductListParams = {},
): Promise<HttpTypes.StoreProductListResponse> {
    const { status, ...rest } = params as HttpTypes.StoreProductListParams & { status?: string }
    const { limit, offset } = normalizePagination(rest.limit, rest.offset, 12)
    const regionId = ensureRegionId(rest.region_id)
    const requestPayload: HttpTypes.StoreProductListParams = {
        ...rest,
        limit,
        offset,
        region_id: regionId,
        fields: rest.fields ?? PRODUCT_FIELDS_QUERY,
    }
    const fallback = emptyProducts(limit, offset)

    return withFallback("listando productos", async () => {
        const response = await sdk.store.product.list(requestPayload)
        const products = response.products ?? []
        const filteredProducts = status
            ? products.filter((product) => product.status === status)
            : products
        cacheProducts(filteredProducts)
        return {
            ...response,
            products: filteredProducts,
            count: status
                ? filteredProducts.length
                : response.count ?? fallback.count,
            limit: response.limit ?? fallback.limit,
            offset: response.offset ?? fallback.offset,
        }
    }, fallback)
}

export async function listProductsByIds(ids: string[], regionId?: string): Promise<StoreProduct[]> {
    const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
    if (!uniqueIds.length) {
        return [] as StoreProduct[]
    }

    const resolvedRegionId = ensureRegionId(regionId)

    return withFallback(
        "listando productos por id",
        async () => {
            const response = await sdk.store.product.list({
                id: uniqueIds,
                limit: uniqueIds.length,
                offset: 0,
                region_id: resolvedRegionId,
                fields: PRODUCT_FIELDS_QUERY,
            })

            const products = response.products ?? []
            cacheProducts(products)
            return products
        },
        emptyProductList(),
    )
}

export async function listProductCategories(
    params: HttpTypes.StoreProductCategoryListParams = {},
): Promise<HttpTypes.StoreProductCategoryListResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 50)
    const fallback = emptyCategories(limit, offset)

    const requestPayload: HttpTypes.StoreProductCategoryListParams = {
        ...params,
        limit,
        offset,
    }

    const loader = () =>
        withFallback(
            "listando categorías",
            async () => {
                const response = await sdk.store.category.list(requestPayload)

                return {
                    ...response,
                    product_categories: response.product_categories ?? [],
                    count: response.count ?? fallback.count,
                    limit: response.limit ?? fallback.limit,
                    offset: response.offset ?? fallback.offset,
                }
            },
            fallback,
        )

    const cacheKey = serializeCacheKey(requestPayload as Record<string, unknown>)
    return categoriesCache.get(cacheKey, loader, (result) => result !== fallback)
}

export async function listProductTags(
    params: HttpTypes.StoreProductTagListParams = {},
): Promise<HttpTypes.StoreProductTagListResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 50)
    const fallback = emptyTags(limit, offset)

    const requestQuery = {
        ...params,
        limit,
        offset,
    }

    const loader = () =>
        withFallback(
            "listando etiquetas",
            async () => {
                const response = await sdk.client.fetch<HttpTypes.StoreProductTagListResponse>("/store/product-tags", {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    query: requestQuery,
                })

                return {
                    ...response,
                    product_tags: response.product_tags ?? [],
                    count: response.count ?? fallback.count,
                    limit: response.limit ?? fallback.limit,
                    offset: response.offset ?? fallback.offset,
                }
            },
            fallback,
        )

    const cacheKey = serializeCacheKey(requestQuery as Record<string, unknown>)
    return tagsCache.get(cacheKey, loader, (result) => result !== fallback)
}

export async function listProductTypes(
    params: HttpTypes.StoreProductTypeListParams = {},
): Promise<HttpTypes.StoreProductTypeListResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 50)
    const fallback = emptyTypes(limit, offset)

    const requestQuery = {
        ...params,
        limit,
        offset,
    }

    const loader = () =>
        withFallback(
            "listando tipos",
            async () => {
                const response = await sdk.client.fetch<HttpTypes.StoreProductTypeListResponse>("/store/product-types", {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    query: requestQuery,
                })

                return {
                    ...response,
                    product_types: response.product_types ?? [],
                    count: response.count ?? fallback.count,
                    limit: response.limit ?? fallback.limit,
                    offset: response.offset ?? fallback.offset,
                }
            },
            fallback,
        )

    const cacheKey = serializeCacheKey(requestQuery as Record<string, unknown>)
    return typesCache.get(cacheKey, loader, (result) => result !== fallback)
}

export async function listCollections(
    params: HttpTypes.StoreCollectionListParams = {},
): Promise<HttpTypes.StoreCollectionListResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 10)
    const defaultFields = ["id", "title", "handle", "metadata"]
    const fallback = emptyCollections(limit, offset)

    const requestPayload: HttpTypes.StoreCollectionListParams = {
        ...params,
        limit,
        offset,
        fields: params.fields ?? defaultFields.join(","),
    }

    const loader = () =>
        withFallback(
            "listando colecciones",
            async () => {
                const response = await sdk.store.collection.list(requestPayload)

                return {
                    ...response,
                    collections: response.collections ?? [],
                    count: response.count ?? fallback.count,
                    limit: response.limit ?? fallback.limit,
                    offset: response.offset ?? fallback.offset,
                }
            },
            fallback,
        )

    const cacheKey = serializeCacheKey(requestPayload as Record<string, unknown>)
    return collectionsCache.get(cacheKey, loader, (result) => result !== fallback)
}

export { DEFAULT_LANGUAGE, DEFAULT_CURRENCY, DEFAULT_REGION_ID, formatPrice } from "./config"

export const getProductThumbnail = (product: StoreProduct) =>
    product.thumbnail ?? product.images?.[0]?.url ?? "/images/product-placeholder.jpg"

export const getProductTitle = (product: StoreProduct) => product.title ?? "Producto sin nombre"
