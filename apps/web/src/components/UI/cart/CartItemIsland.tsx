import { useStore } from "@nanostores/react";
import { useState, useEffect } from "react";
import {
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  cartItemMap,
  updateItemVariant,
  getCartItemKey,
  type CartItem as CartEntry,
} from "@stores/cart";
import { formatPrice } from "@lib/medusajs/products";

interface Props {
  item: CartEntry;
  selectedVariantId: string;
}

export default function CartItemIsland({ item, selectedVariantId }: Props) {
  if (!item) return null;
  const itemsMap = useStore(cartItemMap);
  const cartKey = getCartItemKey(item.product_id, selectedVariantId);
  const currentItem = itemsMap[cartKey] ?? item;

  const { quantity } = currentItem;

  // Calcular precio según la variante seleccionada
  const currentVariant = item.variants?.find(
    (v) => v.id === selectedVariantId
  ) || {
    id: item.variant_id,
    price: item.unit_price,
  };

  useEffect(() => {
    const handler = (e: any) => {
      try {
        const { product_id, old_variant_id, new_variant_id } = e.detail ?? {};
        if (!product_id || !old_variant_id || !new_variant_id) return;
        updateItemVariant(product_id, old_variant_id, new_variant_id);
      } catch (err) {
        // prevenir que un error en el handler rompa la hidratación / provoque remount
        console.error("cart:update-variant handler error:", err);
      }
    };

    window.addEventListener("cart:update-variant", handler);
    return () => window.removeEventListener("cart:update-variant", handler);
  }, []);

  const unit_price = currentVariant.price;
  const subtotal = unit_price * quantity;
  const isDecrementDisabled = quantity <= 1;

  const handleDecrease = () => {
    if (isDecrementDisabled) return;
    decreaseQuantity(item.product_id, selectedVariantId);
  };

  const handleIncrease = () => {
    increaseQuantity(item.product_id, selectedVariantId);
  };

  const handleRemove = () => {
    removeItem(item.product_id, selectedVariantId);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        className="px-2 text-xl disabled:cursor-not-allowed disabled:text-gray-400"
        onClick={handleDecrease}
        aria-label="Disminuir cantidad"
        disabled={isDecrementDisabled}
      >
        −
      </button>

      <span className="font-semibold" aria-live="polite">
        {quantity}
      </span>

      <button
        className="px-2 text-xl"
        onClick={() => handleIncrease()}
        aria-label="Incrementar cantidad"
      >
        +
      </button>

      <button className="ml-4 text-red-600" onClick={() => handleRemove()}>
        Eliminar
      </button>

      <p className="ml-auto font-bold">{formatPrice(subtotal)}</p>
    </div>
  );
}
