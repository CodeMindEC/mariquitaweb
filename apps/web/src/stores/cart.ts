import { persistentAtom } from "@nanostores/persistent";
import { computed } from "nanostores";
import type { StoreProduct } from "@lib/medusajs/products";

export interface CartItem {
    product_id: string;
    variant_id: string;
    weight: string;
    title: string;
    thumbnail: string | null;
    quantity: number;
    unit_price: number;
    categoriesText?: string;
    originalPrice?: number;
    discountLabel?: string;
    variants?: {
        id: string;
        weight: string;
        price: number;
    }[];
}

const CART_STORAGE_KEY = "cart";
const CART_KEY_SEPARATOR = "::";
const BASE_DELIVERY_FEE = 2.5;
const FREE_SHIPPING_THRESHOLD = 50;

const getMatcher = (productId: string, variantId: string) =>
    (item: CartItem) =>
        item.product_id === productId && item.variant_id === variantId;

export const getCartItemKey = (productId: string, variantId: string) =>
    `${productId}${CART_KEY_SEPARATOR}${variantId}`;

// Carrito global (guardado en localStorage)
export const cart = persistentAtom<CartItem[]>(CART_STORAGE_KEY, [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

export const buildCartItem = (product: StoreProduct): CartItem => {
    const variants = product.variants?.map((v) => ({
        id: v.id,
        weight: v.weight != null ? String(v.weight) : "",
        price: v.calculated_price?.calculated_amount ?? 0,
    })) ?? [];

    variants.sort((a, b) => a.price - b.price);

    const defaultVariant = variants[0] ?? null;

    return {
        product_id: product.id,
        variant_id: defaultVariant?.id ?? "",
        weight: defaultVariant?.weight?.toString() ?? "",
        title: product.title,
        thumbnail: product.thumbnail,
        quantity: 1,
        unit_price: defaultVariant?.price ?? 0,
        variants,
    };
};

// --- Acciones del carrito ---
export function addItemFromProduct(product: StoreProduct) {
    const item = buildCartItem(product);
    addItem(item);
}
export function addItem(item: CartItem) {
    const items = cart.get();

    // Buscar coincidencia exacta: mismo producto + misma variante
    const index = items.findIndex(
        (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
    );

    if (index >= 0) {
        // Si ya existe, fusionar cantidades
        const nextItems = [...items];
        nextItems[index] = {
            ...nextItems[index],
            quantity: nextItems[index].quantity + item.quantity,
        };

        cart.set(nextItems);
        return;
    }

    // No existe → agregar nuevo
    cart.set([...items, item]);
}

export function updateItemVariant(
    productId: string,
    oldVariantId: string,
    newVariantId: string
) {
    const items = cart.get();

    // Buscar el item fuente EXACTO (producto + variante antigua)
    const source = items.find(
        (i) => i.product_id === productId && i.variant_id === oldVariantId
    );
    if (!source) return;

    // Si la variante no cambia -> no hacer nada
    if (oldVariantId === newVariantId) return;

    // Buscar si ya existe un item con la variante destino
    const target = items.find(
        (i) => i.product_id === productId && i.variant_id === newVariantId
    );

    // Obtener datos de la variante destino desde el mismo source (si existe en variants)
    const newVariant =
        source.variants?.find((v) => String(v.id) === String(newVariantId)) ?? null;

    // Si no encontramos info de la nueva variante, abortar (evita inconsistencias)
    if (!newVariant) return;

    // Si existe target -> fusionar cantidades y eliminar el source
    if (target) {
        const merged = items.map((i) =>
            i.product_id === productId && i.variant_id === newVariantId
                ? { ...i, quantity: i.quantity + source.quantity }
                : i
        ).filter(
            (i) => !(i.product_id === productId && i.variant_id === oldVariantId)
        );

        cart.set(merged);
        return;
    }

    // Si no existe target -> actualizar el item fuente cambiando su variante
    const updatedItems = items.map((i) =>
        i.product_id === productId && i.variant_id === oldVariantId
            ? {
                ...i,
                variant_id: String(newVariant.id),
                unit_price: newVariant.price,
                weight: String(newVariant.weight ?? i.weight ?? ""),
            }
            : i
    );

    cart.set(updatedItems);
}


export function removeItem(product_id: string, variant_id: string) {
    const matcher = getMatcher(product_id, variant_id);
    cart.set(cart.get().filter((item) => !matcher(item)));
}

export function increaseQuantity(product_id: string, variant_id: string) {
    const matcher = getMatcher(product_id, variant_id);
    cart.set(
        cart.get().map((item) =>
            matcher(item)
                ? { ...item, quantity: item.quantity + 1 }
                : item,
        ),
    );
}

export function decreaseQuantity(product_id: string, variant_id: string) {
    const matcher = getMatcher(product_id, variant_id);
    cart.set(
        cart.get().map((item) =>
            matcher(item) && item.quantity > 1
                ? { ...item, quantity: item.quantity - 1 }
                : item,
        ),
    );
}

export function clearCart() {
    cart.set([]);
}

export const cartSubtotal = computed(cart, (items) =>
    items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0),
);

export const cartItemMap = computed(cart, (items) =>
    items.reduce<Record<string, CartItem>>((acc, item) => {
        acc[getCartItemKey(item.product_id, item.variant_id)] = item;
        return acc;
    }, {}),
);

export const cartItemCount = computed(cart, (items) => items.length);

export const cartQuantityTotal = computed(cart, (items) =>
    items.reduce((total, item) => total + item.quantity, 0),
);

export const cartDeliveryFee = computed(cartSubtotal, (subtotal) =>
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_DELIVERY_FEE,
);