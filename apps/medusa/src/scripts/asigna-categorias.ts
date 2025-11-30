import { ExecArgs, IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const CATEGORY_IDS = {
    SNACKS_DE_FRUTA: "pcat_01KASQDXM86PPC6CTDK558Q5JJ",
    PARA_COCINAR_SALADO: "pcat_01KASQE4GH13ZZCXNAM9H31NPD",
    PARA_BEBIDAS_INFUSIONES: "pcat_01KASQEC289GN0AC2B0CFHQNZR",
    ROLLS_FRUITS: "pcat_01KASQETQ23T4XBPGQ7CS5E06A",

    FRUTAS_ROJAS: "pcat_01KASQTMVCXPPT4YYXGFT2J5MB",
    FRUTAS_TROPICALES: "pcat_01KASQV2FRZX2SGF79NFM7W1SN",
    FRUTAS_CLASICAS: "pcat_01KASQVH4A1Q4QCMN0CDCC3AYF",

    VERDURAS_PARA_SOPAS: "pcat_01KASQW7NPCFH6QT9E301BK26S",
    TOPPINGS_CHIPS: "pcat_01KASQWPD9KF8ESGH7M58FC5XP",
    CONDIMENTOS_HIERBAS: "pcat_01KASSATTG0832JB9A0SXX1H4C",

    CITRICOS: "pcat_01KASSBG48Q5QYYVM8BVWAANNA",
    HIERBAS_INFUSIONES: "pcat_01KASSC4N41FDT8QSW5WGYK583",
    PARA_COCTELERIA: "pcat_01KASSCE15G7Q97SWPGQD4XKQM",
} as const

const PRODUCT_CATEGORY_MAP: Record<string, string[]> = {
    "frutilla-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_ROJAS,
    ],
    "banano-deshidratado": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "kiwi-deshidratado": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "mango-deshidratado": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "manzana-roja-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_CLASICAS,
    ],
    "manzana-verde-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_CLASICAS,
    ],
    "pina-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "mora-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_ROJAS,
    ],
    "papaya-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "naranjilla-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "pitahaya-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "uvilla-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_TROPICALES,
    ],
    "arandano-deshidratado": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_ROJAS,
    ],
    "frambuesa-deshidratada": [
        CATEGORY_IDS.SNACKS_DE_FRUTA,
        CATEGORY_IDS.FRUTAS_ROJAS,
    ],

    "naranja-deshidratada": [
        CATEGORY_IDS.PARA_BEBIDAS_INFUSIONES,
        CATEGORY_IDS.CITRICOS,
    ],
    "limon-deshidratado": [
        CATEGORY_IDS.PARA_BEBIDAS_INFUSIONES,
        CATEGORY_IDS.CITRICOS,
    ],
    "mandarina-deshidratada": [
        CATEGORY_IDS.PARA_BEBIDAS_INFUSIONES,
        CATEGORY_IDS.CITRICOS,
    ],
    "toronja-deshidratada": [
        CATEGORY_IDS.PARA_BEBIDAS_INFUSIONES,
        CATEGORY_IDS.CITRICOS,
    ],
    "pepino-deshidratado": [
        CATEGORY_IDS.PARA_BEBIDAS_INFUSIONES,
        CATEGORY_IDS.HIERBAS_INFUSIONES,
    ],
    "menta-deshidratada": [
        CATEGORY_IDS.PARA_BEBIDAS_INFUSIONES,
        CATEGORY_IDS.HIERBAS_INFUSIONES,
    ],

    "tomate-deshidratado": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.VERDURAS_PARA_SOPAS,
    ],
    "remolacha-deshidratada": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.VERDURAS_PARA_SOPAS,
    ],
    "zanahoria-deshidratada": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.VERDURAS_PARA_SOPAS,
    ],
    "col-morada-deshidratada": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.TOPPINGS_CHIPS,
    ],
    "camote-deshidratado": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.TOPPINGS_CHIPS,
    ],
    "chayote-deshidratado": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.VERDURAS_PARA_SOPAS,
    ],

    "ajo-deshidratado": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.CONDIMENTOS_HIERBAS,
    ],
    "mix-de-pimientos-deshidratados": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.CONDIMENTOS_HIERBAS,
    ],
    "albahaca-deshidratada": [
        CATEGORY_IDS.PARA_COCINAR_SALADO,
        CATEGORY_IDS.CONDIMENTOS_HIERBAS,
    ],

    "rolls-fruits-maracuya": [CATEGORY_IDS.ROLLS_FRUITS],
    "rolls-fruits-kiwi": [CATEGORY_IDS.ROLLS_FRUITS],
    "rolls-fruits-frutilla": [CATEGORY_IDS.ROLLS_FRUITS],
}

export default async function asignaCategorias({ container }: ExecArgs) {
    const productModuleService: IProductModuleService = container.resolve(
        Modules.PRODUCT
    )

    const [products] = await productModuleService.listAndCountProducts()

    console.log(`Productos encontrados: ${products.length}`)

    const handleToId = new Map<string, string>()
    for (const p of products) {
        if (p.handle) {
            handleToId.set(p.handle, p.id)
        }
    }

    for (const [handle, categoryIds] of Object.entries(PRODUCT_CATEGORY_MAP)) {
        const productId = handleToId.get(handle)

        if (!productId) {
            console.warn(
                `⚠️  No se encontró producto con handle '${handle}'. ¿Se importó bien el CSV?`
            )
            continue
        }

        console.log(
            `Asignando categorías [${categoryIds.join(
                ", "
            )}] al producto '${handle}' (${productId})`
        )

        await productModuleService.updateProducts(productId, {
            category_ids: categoryIds,
        })
    }

    console.log("✅ Listo. Categorías asignadas.")
}
