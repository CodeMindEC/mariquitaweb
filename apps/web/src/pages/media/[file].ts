// src/pages/media/[file].ts
import type { APIRoute } from "astro"
import crypto from "crypto"

// Este endpoint debe ejecutarse SIEMPRE en el servidor
export const prerender = false

function signImagorPath(path: string, secret: string) {
    const hash = crypto
        .createHmac("sha1", secret)
        .update(path)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_") // NO quitamos '=' porque Imagor no trunca

    return `${hash}/${path}`
}

export const GET: APIRoute = async ({ params, redirect }) => {
    const file = params.file

    if (!file) {
        return new Response(
            JSON.stringify({ message: "file param is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        )
    }

    const secret = import.meta.env.IMAGOR_SECRET
    const opsPath = import.meta.env.IMAGOR_OPS_PATH ?? "fit-in/800x800"
    const baseUrl =
        import.meta.env.IMAGOR_BASE_URL ??
        import.meta.env.MEDIA_PROXY_BASE_URL

    if (!secret || !baseUrl) {
        console.error("Imagor env not configured in Astro")
        return new Response(
            JSON.stringify({ message: "Imagor not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }

    const path = `${opsPath}/${file}`
    const signedPath = signImagorPath(path, secret)
    const redirectUrl = `${baseUrl}/${signedPath}`

    return redirect(redirectUrl, 302)
}
