/**
 * Utilidades para parsear parámetros de URL
 */

/**
 * Extrae y normaliza una lista de IDs desde múltiples posibles parámetros de URL
 * Soporta valores separados por comas y múltiples parámetros con el mismo nombre
 * 
 * @example
 * // URL: ?tag=vintage&tag_id=123&tags=modern,retro
 * parseIdList(url, "tag", "tag_id", "tags") 
 * // => ["vintage", "123", "modern", "retro"]
 */
export const parseIdList = (url: URL, ...keys: string[]): string[] => {
    return keys
        .flatMap((key) => url.searchParams.getAll(key))
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean)
}

/**
 * Parsea un valor numérico de parámetro de URL
 * Retorna null si no es un número válido o si es negativo o cero
 */
export const parsePositiveNumber = (value: string | null): number | null => {
    if (!value) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
