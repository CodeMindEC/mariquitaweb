/**
 * Sistema unificado de caché para reducir llamadas a API
 * Usa caché en memoria con TTL configurable
 */

interface CacheEntry<T> {
    value: T
    expiresAt: number
}

interface CacheOptions {
    ttlMs: number
    shouldCache?: (value: unknown) => boolean
}

/**
 * Crea un sistema de caché genérico con TTL
 * @param ttlMsInput - Tiempo de vida en milisegundos (0 o negativo deshabilita el caché)
 */
export function createCache<T>(ttlMsInput: number) {
    const ttlMs = resolveTtl(ttlMsInput, 0)
    const cache = new Map<string, CacheEntry<T>>()
    const pending = new Map<string, Promise<T>>()
    const disabled = ttlMs <= 0

    /**
     * Obtiene o carga un valor del caché
     * @param key - Clave única para el caché
     * @param loader - Función para cargar el valor si no está en caché
     * @param shouldCache - Opcional: función para determinar si se debe cachear el resultado
     */
    const get = async (
        key: string,
        loader: () => Promise<T>,
        shouldCache?: (value: T) => boolean,
    ): Promise<T> => {
        if (disabled) {
            return loader()
        }

        // Verificar si hay un valor válido en caché
        const now = Date.now()
        const cached = cache.get(key)
        if (cached && cached.expiresAt > now) {
            return cached.value
        }

        // Si ya hay una petición en curso para esta clave, reutilizarla
        const existingPromise = pending.get(key)
        if (existingPromise) {
            return existingPromise
        }

        // Crear nueva petición
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

    /**
     * Limpia todo el caché
     */
    const clear = () => {
        cache.clear()
        pending.clear()
    }

    /**
     * Invalida una clave específica del caché
     */
    const invalidate = (key: string) => {
        cache.delete(key)
    }

    return { get, clear, invalidate }
}

/**
 * Normaliza valores para crear claves de caché consistentes
 */
export const normalizeForKey = (value: unknown): unknown => {
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

/**
 * Serializa un objeto en una clave de caché
 */
export const serializeCacheKey = (payload: Record<string, unknown>): string => {
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

/**
 * Resuelve el TTL asegurando que sea un número válido
 */
const resolveTtl = (value: unknown, fallback: number): number => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback
    }
    return parsed
}
