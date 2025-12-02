// src/lib/products.ts
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusaClient"

export type StoreProduct = HttpTypes.StoreProduct

export interface ListProductsParams {
    limit?: number
    offset?: number
    q?: string
    category_id?: string | string[]
    collection_id?: string | string[]
    /** Si no lo pasas, usamos PUBLIC_MEDUSA_REGION_ID */
    regionId?: string
}

export interface ListProductsResult {
    products: StoreProduct[]
    count: number
    limit: number
    offset: number
}

/**
 * Lista productos + precios de variantes usando calculated_price.
 */
export async function listProducts(
    params: ListProductsParams = {},
): Promise<ListProductsResult> {
    const defaultLimit = params.limit ?? 12
    const defaultOffset = params.offset ?? 0

    const regionId =
        params.regionId ?? import.meta.env.PUBLIC_MEDUSA_REGION_ID

    if (!regionId) {
        throw new Error(
            "Falta PUBLIC_MEDUSA_REGION_ID en .env para poder calcular los precios.",
        )
    }

    const { products, count, limit, offset } = await sdk.store.product.list({
        limit: defaultLimit,
        offset: defaultOffset,
        q: params.q,
        category_id: params.category_id,
        collection_id: params.collection_id,

        // 👇 Esto es CLAVE para que lleguen los precios de variantes
        fields: "*variants.calculated_price",
        region_id: regionId,
        // si quisieras precio con impuestos, también tendrías que pasar country_code :contentReference[oaicite:2]{index=2}
        // country_code: "ec", // por ejemplo
    })

    return {
        products,
        count,
        limit: limit ?? defaultLimit,
        offset: offset ?? defaultOffset,
    }
}

const currencyCode =
    import.meta.env.PUBLIC_MEDUSA_CURRENCY_CODE || "USD"

export const formatPrice = (amountInMinor: number) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: currencyCode,
    }).format(amountInMinor / 100) // Medusa trabaja en centavos