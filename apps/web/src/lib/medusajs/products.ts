// src/lib/products.ts
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusaClient"
import { cacheProducts } from "./product-cache"
import { ensureRegionId, MEDUSA_DEFAULTS } from "./config"

export type StoreProduct = HttpTypes.StoreProduct
export type StoreProductCategory = HttpTypes.StoreProductCategory
export type StoreProductTag = HttpTypes.StoreProductTag
export type StoreProductType = HttpTypes.StoreProductType
export type ListProductsParams = HttpTypes.StoreProductListParams
export type ListProductsResponse = HttpTypes.StoreProductListResponse
export type ListProductCategoriesParams = HttpTypes.StoreProductCategoryListParams
export type ListProductCategoriesResponse =
    HttpTypes.StoreProductCategoryListResponse
export type ListProductTagsParams = HttpTypes.StoreProductTagListParams
export type ListProductTagsResponse = HttpTypes.StoreProductTagListResponse
export type ListProductTypesParams = HttpTypes.StoreProductTypeListParams
export type ListProductTypesResponse = HttpTypes.StoreProductTypeListResponse
export type StoreCollection = HttpTypes.StoreCollection
export type ListCollectionsParams = HttpTypes.StoreCollectionListParams
export type ListCollectionsResponse = HttpTypes.StoreCollectionListResponse

const DEFAULT_COLLECTION_CACHE_TTL_MS = 60 * 1000
const DEFAULT_REFERENCE_CACHE_TTL_MS = 60 * 1000

const resolveTtl = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback
    }
    return parsed
}

const createCachedFetcher = <T>(ttlMsInput: number) => {
    const ttlMs = resolveTtl(ttlMsInput, 0)
    const cache = new Map<string, { value: T; expiresAt: number }>()
    const pending = new Map<string, Promise<T>>()
    const disabled = ttlMs <= 0

    const fetchWithCache = async (
        key: string,
        loader: () => Promise<T>,
        shouldCache?: (value: T) => boolean,
    ): Promise<T> => {
        if (disabled) {
            return loader()
        }

        const now = Date.now()
        const cached = cache.get(key)
        if (cached && cached.expiresAt > now) {
            return cached.value
        }

        const existingPromise = pending.get(key)
        if (existingPromise) {
            return existingPromise
        }

        const promise = loader()
            .then((value) => {
                if (!shouldCache || shouldCache(value)) {
                    cache.set(key, { value, expiresAt: Date.now() + ttlMs })
                }
                return value
            })
            .finally(() => {
                pending.delete(key)
            })

        pending.set(key, promise)
        return promise
    }

    return {
        fetchWithCache,
        clear: () => {
            cache.clear()
            pending.clear()
        },
    }
}

const normalizeForKey = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(normalizeForKey)
    }

    if (value && typeof value === "object") {
        return Object.keys(value as Record<string, unknown>)
            .sort()
            .reduce<Record<string, unknown>>((acc, key) => {
                const normalizedValue = normalizeForKey(
                    (value as Record<string, unknown>)[key],
                )
                if (typeof normalizedValue !== "undefined") {
                    acc[key] = normalizedValue
                }
                return acc
            }, {})
    }

    return value
}

const serializeCacheKey = (payload: Record<string, unknown>): string => {
    const normalizedPayload = Object.keys(payload)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
            const normalizedValue = normalizeForKey(payload[key])
            if (typeof normalizedValue !== "undefined") {
                acc[key] = normalizedValue
            }
            return acc
        }, {})

    return JSON.stringify(normalizedPayload)
}

const COLLECTION_CACHE_TTL_MS = resolveTtl(
    import.meta.env.PUBLIC_COLLECTION_CACHE_TTL,
    DEFAULT_COLLECTION_CACHE_TTL_MS,
)

const REFERENCE_CACHE_TTL_MS = resolveTtl(
    import.meta.env.PUBLIC_MEDUSA_REFERENCE_CACHE_TTL,
    DEFAULT_REFERENCE_CACHE_TTL_MS,
)

const collectionsCache = createCachedFetcher<ListCollectionsResponse>(COLLECTION_CACHE_TTL_MS)
const categoriesCache = createCachedFetcher<ListProductCategoriesResponse>(REFERENCE_CACHE_TTL_MS)
const tagsCache = createCachedFetcher<ListProductTagsResponse>(REFERENCE_CACHE_TTL_MS)
const typesCache = createCachedFetcher<ListProductTypesResponse>(REFERENCE_CACHE_TTL_MS)

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

const emptyProducts = (limit: number, offset: number): ListProductsResponse => ({
    products: [],
    count: 0,
    limit,
    offset,
})

const emptyProductList = (): StoreProduct[] => []

const emptyCategories = (limit: number, offset: number): ListProductCategoriesResponse => ({
    product_categories: [],
    count: 0,
    limit,
    offset,
})

const emptyCollections = (limit: number, offset: number): ListCollectionsResponse => ({
    collections: [],
    count: 0,
    limit,
    offset,
})

const emptyTags = (limit: number, offset: number): ListProductTagsResponse => ({
    product_tags: [],
    count: 0,
    limit,
    offset,
})

const emptyTypes = (limit: number, offset: number): ListProductTypesResponse => ({
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
    params: ListProductsParams = {},
): Promise<ListProductsResponse> {
    const { status, ...rest } = params as ListProductsParams & { status?: string }
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

export async function listProductsByIds(ids: string[], regionId?: string) {
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
    params: ListProductCategoriesParams = {},
): Promise<ListProductCategoriesResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 50)
    const fallback = emptyCategories(limit, offset)

    const requestPayload: ListProductCategoriesParams = {
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
    return categoriesCache.fetchWithCache(cacheKey, loader, (result) => result !== fallback)
}

export async function listProductTags(
    params: ListProductTagsParams = {},
): Promise<ListProductTagsResponse> {
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
                const response = await sdk.client.fetch<ListProductTagsResponse>("/store/product-tags", {
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
    return tagsCache.fetchWithCache(cacheKey, loader, (result) => result !== fallback)
}

export async function listProductTypes(
    params: ListProductTypesParams = {},
): Promise<ListProductTypesResponse> {
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
                const response = await sdk.client.fetch<ListProductTypesResponse>("/store/product-types", {
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
    return typesCache.fetchWithCache(cacheKey, loader, (result) => result !== fallback)
}

export async function listCollections(
    params: ListCollectionsParams = {},
): Promise<ListCollectionsResponse> {
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
    return collectionsCache.fetchWithCache(cacheKey, loader, (result) => result !== fallback)
}

export { DEFAULT_LANGUAGE, DEFAULT_CURRENCY, DEFAULT_REGION_ID, formatPrice } from "./config"

export const getProductThumbnail = (product: StoreProduct) =>
    product.thumbnail ?? product.images?.[0]?.url ?? "/images/product-placeholder.jpg"

export const getProductTitle = (product: StoreProduct) => product.title ?? "Producto sin nombre"
