// src/lib/products.ts
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusaClient"

export type StoreProduct = HttpTypes.StoreProduct
export type StoreProductCategory = HttpTypes.StoreProductCategory
export type ListProductsParams = HttpTypes.StoreProductListParams
export type ListProductsResponse = HttpTypes.StoreProductListResponse
export type ListProductCategoriesParams = HttpTypes.StoreProductCategoryListParams
export type ListProductCategoriesResponse =
    HttpTypes.StoreProductCategoryListResponse
export type StoreCollection = HttpTypes.StoreCollection
export type ListCollectionsParams = HttpTypes.StoreCollectionListParams
export type ListCollectionsResponse = HttpTypes.StoreCollectionListResponse

/**
 * Lista productos + precios de variantes usando calculated_price.
 */
export async function listProducts(
    params: ListProductsParams = {},
): Promise<ListProductsResponse> {
    const limit = params.limit ?? 12
    const offset = params.offset ?? 0

    const regionId =
        params.region_id ?? import.meta.env.PUBLIC_MEDUSA_REGION_ID

    if (!regionId) {
        throw new Error(
            "Falta PUBLIC_MEDUSA_REGION_ID en .env para poder calcular los precios.",
        )
    }

    const defaultFields = [
        "id",
        "title",
        "handle",
        "thumbnail",
        "status",
        "collection_id",
        "*variants",
        "variants.calculated_price",
        "*categories",
    ]

    const requestPayload: HttpTypes.StoreProductListParams = {
        ...params,
        limit,
        offset,
        region_id: regionId,
        fields: params.fields ?? defaultFields.join(","),
    }

    try {
        const response = await sdk.store.product.list(requestPayload)

        return {
            ...response,
            products: response.products ?? [],
            count: response.count ?? 0,
            limit: response.limit ?? limit,
            offset: response.offset ?? offset,
        }

    } catch (error) {
        console.error("Error listando productos:", error)
        return {
            products: [],
            count: 0,
            limit,
            offset,
        }
    }
}

export async function listProductCategories(
    params: ListProductCategoriesParams = {},
): Promise<ListProductCategoriesResponse> {
    const limit = params.limit ?? 50
    const offset = params.offset ?? 0

    try {
        const response = await sdk.store.category.list({
            ...params,
            limit,
            offset,
        })

        return {
            ...response,
            product_categories: response.product_categories ?? [],
            count: response.count ?? 0,
            limit: response.limit ?? limit,
            offset: response.offset ?? offset,
        }
    } catch (error) {
        console.error("Error listando categorías:", error)
        return {
            product_categories: [],
            count: 0,
            limit,
            offset,
        }
    }
}

export async function listCollections(
    params: ListCollectionsParams = {},
): Promise<ListCollectionsResponse> {
    const limit = params.limit ?? 10
    const offset = params.offset ?? 0
    const defaultFields = ["id", "title", "handle", "metadata"]

    try {
        const response = await sdk.store.collection.list({
            ...params,
            limit,
            offset,
            fields: params.fields ?? defaultFields.join(","),
        })

        return {
            ...response,
            collections: response.collections ?? [],
            count: response.count ?? 0,
            limit: response.limit ?? limit,
            offset: response.offset ?? offset,
        }
    } catch (error) {
        console.error("Error listando colecciones:", error)
        return {
            collections: [],
            count: 0,
            limit,
            offset,
        }
    }
}

const currencyCode =
    import.meta.env.PUBLIC_MEDUSA_CURRENCY_CODE || "USD"

export const formatPrice = (amount: number) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: currencyCode,
    }).format(amount)