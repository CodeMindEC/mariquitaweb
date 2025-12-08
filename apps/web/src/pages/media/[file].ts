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

export const GET: APIRoute = async ({ params }) => {
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

    try {
        const upstream = await fetch(redirectUrl)

        if (!upstream.body) {
            console.error("Imagor returned empty body", redirectUrl)
            return new Response(
                JSON.stringify({ message: "Imagor fetch failed" }),
                {
                    status: 502,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            )
        }

        const headers = new Headers()
        const contentType = upstream.headers.get("content-type")
        const cacheControl =
            upstream.headers.get("cache-control") ?? "public, max-age=3600, immutable"

        if (contentType) headers.set("Content-Type", contentType)
        headers.set("Cache-Control", cacheControl)
        headers.set("Access-Control-Allow-Origin", "*")
        headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
        headers.set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")

        return new Response(upstream.body, {
            status: upstream.status,
            headers,
        })
    } catch (error) {
        console.error("Imagor proxy error", error)
        return new Response(
            JSON.stringify({ message: "Imagor proxy error" }),
            {
                status: 502,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        )
    }
}
