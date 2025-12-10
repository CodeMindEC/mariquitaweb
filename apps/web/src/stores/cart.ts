import { persistentAtom } from "@nanostores/persistent";
import { computed } from "nanostores";

export interface CartItem {
    product_id: string;
    variant_id: string;
    title: string;
    thumbnail: string | null;
    quantity: number;
    unit_price: number;
    categoriesText?: string;
    originalPrice?: number;
    discountLabel?: string;
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

// --- Acciones del carrito ---

export function addItem(item: CartItem) {
    const items = cart.get();
    const matcher = getMatcher(item.product_id, item.variant_id);
    const index = items.findIndex(matcher);

    if (index >= 0) {
        const nextItems = [...items];
        nextItems[index] = {
            ...nextItems[index],
            quantity: nextItems[index].quantity + item.quantity,
        };
        cart.set(nextItems);
        return;
    }

    cart.set([...items, item]);
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