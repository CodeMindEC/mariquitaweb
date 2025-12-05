// src/api/media/[file]/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { signImagorPath } from "../../../utils/imagor-signature"

// Que se pueda abrir sin token
export const AUTHENTICATE = false

export const GET = (req: MedusaRequest, res: MedusaResponse) => {
    const file = req.params.file

    if (!file) {
        return res.status(400).json({ message: "file param is required" })
    }

    const opsPath = process.env.IMAGOR_OPS_PATH || "fit-in/800x800"
    const secret = process.env.IMAGOR_SECRET
    const baseUrl = process.env.MEDIA_PROXY_BASE_URL

    if (!secret || !baseUrl) {
        return res.status(500).json({ message: "Imagor not configured" })
    }

    // Ej: "fit-in/800x800/KIWI_DESHIDRATADO-01KBG....webp"
    const path = `${opsPath}/${file}`

    const signedPath = signImagorPath(path, secret)

    const redirectUrl = `${baseUrl}/${signedPath}`

    return res.redirect(302, redirectUrl)
}
