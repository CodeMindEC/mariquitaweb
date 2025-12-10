import { useStore } from "@nanostores/react";
import {
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  cartItemMap,
  getCartItemKey,
  type CartItem as CartEntry,
} from "@stores/cart";
import { formatPrice } from "@lib/medusajs/products";

interface Props {
  item: CartEntry;
}

export default function CartItemIsland({ item }: Props) {
  if (!item) return null;

  const itemsMap = useStore(cartItemMap);
  const cartKey = getCartItemKey(item.product_id, item.variant_id);
  const currentItem = itemsMap[cartKey] ?? item;

  const { quantity, unit_price } = currentItem;
  const subtotal = unit_price * quantity;
  const isDecrementDisabled = quantity <= 1;

  const handleDecrease = () => {
    if (isDecrementDisabled) return;
    decreaseQuantity(item.product_id, item.variant_id);
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
        onClick={() => increaseQuantity(item.product_id, item.variant_id)}
        aria-label="Incrementar cantidad"
      >
        +
      </button>

      <button
        className="ml-4 text-red-600"
        onClick={() => removeItem(item.product_id, item.variant_id)}
      >
        Eliminar
      </button>

      <p className="ml-auto font-bold">{formatPrice(subtotal)}</p>
    </div>
  );
}
