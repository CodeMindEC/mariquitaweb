// src/lib/medusaClient.ts
import Medusa from "@medusajs/js-sdk"
import type { HttpTypes } from "@medusajs/types"

// Alias para no estar tipeando HttpTypes.StoreProduct todo el tiempo
export type StoreProduct = HttpTypes.StoreProduct

// Evitamos errores si las envs no están definidas
const backendUrl = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL
const publishableKey = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!backendUrl) {
    throw new Error("PUBLIC_MEDUSA_BACKEND_URL no está definido en .env")
}

if (!publishableKey) {
    throw new Error("PUBLIC_MEDUSA_PUBLISHABLE_KEY no está definido en .env")
}

// SDK compartido en todo el front
export const sdk = new Medusa({
    baseUrl: backendUrl,
    publishableKey,
    // puedes activar debug si quieres ver requests en consola
    // debug: import.meta.env.DEV,
})
