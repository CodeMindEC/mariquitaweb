import { LRUCache } from "lru-cache"
import type { StoreProduct } from "./products"

const DEFAULT_TTL_MS = Number(import.meta.env.PUBLIC_PRODUCT_CACHE_TTL ?? 1000 * 60)
const MAX_CACHE_ITEMS = Number(import.meta.env.PUBLIC_PRODUCT_CACHE_MAX ?? 500)

const productCache = new LRUCache<string, StoreProduct>({
    max: Math.max(1, MAX_CACHE_ITEMS),
    ttl: Math.max(0, DEFAULT_TTL_MS),
    allowStale: false,
    updateAgeOnGet: true,
})

export const cacheProducts = (products: StoreProduct[], ttlMs = DEFAULT_TTL_MS) => {
    if (!Array.isArray(products) || !products.length) {
        return
    }

    products.forEach((product) => {
        if (!product?.id) return
        productCache.set(product.id, product, { ttl: ttlMs })
    })
}

export const getCachedProduct = (id: string) => {
    return productCache.get(id) ?? null
}

interface HydrateOptions {
    cacheTtlMs?: number
}

export const hydrateProducts = async (
    products: StoreProduct[],
    fetchMissing: (ids: string[]) => Promise<StoreProduct[]>,
    options: HydrateOptions = {},
): Promise<StoreProduct[]> => {
    if (!Array.isArray(products) || !products.length) {
        return products
    }

    const replacements = new Map<string, StoreProduct>()
    const missingIds: string[] = []

    products.forEach((product) => {
        const id = product?.id
        if (!id) return

        const cached = getCachedProduct(id)
        if (cached) {
            replacements.set(id, cached)
        } else {
            missingIds.push(id)
        }
    })

    if (missingIds.length) {
        const fetched = await fetchMissing(missingIds)
        cacheProducts(fetched, options.cacheTtlMs)
        fetched.forEach((product) => {
            const id = product?.id
            if (!id) return
            replacements.set(id, product)
        })
    }

    return products.map((product) => {
        const id = product?.id
        if (!id) return product
        return replacements.get(id) ?? product
    })
}

export const clearProductCache = () => productCache.clear()
