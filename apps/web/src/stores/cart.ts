import { persistentAtom, } from '@nanostores/persistent';
import { atom, computed } from "nanostores";
export interface CartItem {
    product_id: string;
    variant_id: string;
    title: string;
    thumbnail: string | null;
    quantity: number;
    unit_price: number;
}

// Carrito global (guardado en localStorage)
export const cart = persistentAtom<CartItem[]>('cart', [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

cart.subscribe((v) => console.log("CART:", v));

// --- Acciones del carrito ---

export function addItem(item: CartItem) {
    const items = cart.get()

    const existing = items.find(
        (i) =>
            i.product_id === item.product_id &&
            i.variant_id === item.variant_id
    )

    if (existing) {
        existing.quantity += item.quantity
        cart.set([...items])
        return
    }

    cart.set([...items, item])
}

export function removeItem(product_id: string, variant_id: string) {
    cart.set(
        cart
            .get()
            .filter(
                (i) =>
                    !(i.product_id === product_id && i.variant_id === variant_id)
            )
    )
}

export function increaseQuantity(product_id: string, variant_id: string) {
    cart.set(
        cart.get().map((i) =>
            i.product_id === product_id && i.variant_id === variant_id
                ? { ...i, quantity: i.quantity + 1 }
                : i
        )
    )
}

export function decreaseQuantity(product_id: string, variant_id: string) {
    cart.set(
        cart.get().map((i) =>
            i.product_id === product_id &&
                i.variant_id === variant_id &&
                i.quantity > 1
                ? { ...i, quantity: i.quantity - 1 }
                : i
        )
    )
}

export function clearCart() {
    cart.set([]);
}



// Cálculo del subtotal
export const cartSubtotal = computed(cart, (items) =>
    items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0)
);