// src/lib/products.ts
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusaClient"
import { cacheProducts } from "./product-cache"

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

const envDefaults = {
    regionId: import.meta.env.PUBLIC_MEDUSA_REGION_ID,
    currencyCode: import.meta.env.PUBLIC_MEDUSA_CURRENCY_CODE || "USD",
    language: import.meta.env.PUBLIC_DEFAULT_LANGUAGE ?? "es",
}

export const DEFAULT_LANGUAGE = envDefaults.language
export const DEFAULT_CURRENCY = envDefaults.currencyCode
export const PRODUCT_FIELDS_QUERY = PRODUCT_DEFAULT_FIELDS.join(",")

const ensureRegionId = (explicit?: string) => {
    const regionId = explicit ?? envDefaults.regionId
    if (!regionId) {
        throw new Error(
            "Falta PUBLIC_MEDUSA_REGION_ID en .env para poder calcular los precios.",
        )
    }
    return regionId
}

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

export async function listProductCategories(
    params: ListProductCategoriesParams = {},
): Promise<ListProductCategoriesResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 50)
    const fallback = emptyCategories(limit, offset)

    return withFallback("listando categorías", async () => {
        const response = await sdk.store.category.list({
            ...params,
            limit,
            offset,
        })

        return {
            ...response,
            product_categories: response.product_categories ?? [],
            count: response.count ?? fallback.count,
            limit: response.limit ?? fallback.limit,
            offset: response.offset ?? fallback.offset,
        }
    }, fallback)
}

export async function listProductTags(
    params: ListProductTagsParams = {},
): Promise<ListProductTagsResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 50)
    const fallback = emptyTags(limit, offset)

    return withFallback("listando etiquetas", async () => {
        const response = await sdk.client.fetch<ListProductTagsResponse>(
            "/store/product-tags",
            {
                method: "GET",
                headers: { Accept: "application/json" },
                query: {
                    ...params,
                    limit,
                    offset,
                },
            },
        )

        return {
            ...response,
            product_tags: response.product_tags ?? [],
            count: response.count ?? fallback.count,
            limit: response.limit ?? fallback.limit,
            offset: response.offset ?? fallback.offset,
        }
    }, fallback)
}

export async function listProductTypes(
    params: ListProductTypesParams = {},
): Promise<ListProductTypesResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 50)
    const fallback = emptyTypes(limit, offset)

    return withFallback("listando tipos", async () => {
        const response = await sdk.client.fetch<ListProductTypesResponse>(
            "/store/product-types",
            {
                method: "GET",
                headers: { Accept: "application/json" },
                query: {
                    ...params,
                    limit,
                    offset,
                },
            },
        )

        return {
            ...response,
            product_types: response.product_types ?? [],
            count: response.count ?? fallback.count,
            limit: response.limit ?? fallback.limit,
            offset: response.offset ?? fallback.offset,
        }
    }, fallback)
}

export async function listCollections(
    params: ListCollectionsParams = {},
): Promise<ListCollectionsResponse> {
    const { limit, offset } = normalizePagination(params.limit, params.offset, 10)
    const defaultFields = ["id", "title", "handle", "metadata"]
    const fallback = emptyCollections(limit, offset)

    return withFallback("listando colecciones", async () => {
        const response = await sdk.store.collection.list({
            ...params,
            limit,
            offset,
            fields: params.fields ?? defaultFields.join(","),
        })

        return {
            ...response,
            collections: response.collections ?? [],
            count: response.count ?? fallback.count,
            limit: response.limit ?? fallback.limit,
            offset: response.offset ?? fallback.offset,
        }
    }, fallback)
}

export interface SearchProductsParams {
    query: string
    limit?: number
    offset?: number
    language?: string
    region_id?: string
    currency_code?: string
    semanticSearch?: boolean
    semanticRatio?: number
    fields?: string[]
    category_id?: string | string[]
    collection_id?: string | string[]
    status?: string
}

export interface SearchProductsResponse {
    products: StoreProduct[]
    count: number
    limit: number
    offset: number
}

const emptySearchResult = (limit: number, offset: number): SearchProductsResponse => ({
    products: [],
    count: 0,
    limit,
    offset,
})

export async function searchProducts(
    params: SearchProductsParams,
): Promise<SearchProductsResponse> {
    const trimmedQuery = params.query?.trim()
    const { limit, offset } = normalizePagination(params.limit, params.offset, 6)

    if (!trimmedQuery) {
        return emptySearchResult(limit, offset)
    }

    const regionId = ensureRegionId(params.region_id)
    const currencyCode = params.currency_code ?? envDefaults.currencyCode
    const language = params.language ?? envDefaults.language
    const fields = params.fields ?? SEARCH_PRODUCT_FIELDS

    const query: Record<string, string | number | boolean | string[]> = {
        limit,
        offset,
        query: trimmedQuery,
        language,
        fields: fields.join(","),
        region_id: regionId,
        currency_code: currencyCode,
    }

    if (params.category_id) {
        query.category_id = Array.isArray(params.category_id)
            ? params.category_id
            : [params.category_id]
    }

    if (typeof params.semanticSearch === "boolean") {
        query.semanticSearch = params.semanticSearch
    }

    if (typeof params.semanticRatio === "number") {
        query.semanticRatio = params.semanticRatio
    }

    const response = await sdk.client.fetch<SearchProductsResponse>(
        "/store/meilisearch/products",
        {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            query,
        },
    )

    return {
        products: response.products ?? [],
        count: response.count ?? 0,
        limit: response.limit ?? limit,
        offset: response.offset ?? offset,
    }
}

const priceFormatter = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: envDefaults.currencyCode,
})

export const formatPrice = (amount: number) => priceFormatter.format(amount)