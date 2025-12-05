// src/utils/imagor-signature.ts
import crypto from "crypto"

/**
 * Devuelve "HASH/path" para Imagor
 * - path: ej. "fit-in/800x800/archivo.webp"
 */
export function signImagorPath(path: string, secret: string) {
    const digest = crypto
        .createHmac("sha1", secret)
        .update(path)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_") // OJO: NO quitar los '=' del final

    return `${digest}/${path}`
}
