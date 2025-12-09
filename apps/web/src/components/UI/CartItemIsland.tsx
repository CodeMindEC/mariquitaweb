import { useStore } from "@nanostores/react";
import {
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  cart,
} from "../../stores/cart";
interface CartItem {
  product_id: string;
  variant_id: string;
  title: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
}
interface Props {
  item: CartItem;
}
export default function CartItemIsland({ item }: Props) {
  if (!item) return null;
  const items = useStore(cart);
  const updated = items.find(
    (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
  );

  const quantity = updated?.quantity ?? item.quantity;
  const subtotal = updated
    ? updated.unit_price * updated.quantity
    : item.unit_price * item.quantity;
  return (
    <div className="flex items-center gap-4">
      <button
        className="text-xl px-2"
        onClick={() => decreaseQuantity(item.product_id, item.variant_id)}
      >
        −
      </button>

      <span className="font-semibold">{item.quantity}</span>

      <button
        className="text-xl px-2"
        onClick={() => increaseQuantity(item.product_id, item.variant_id)}
      >
        +
      </button>

      <button
        className="ml-4 text-red-600"
        onClick={() => removeItem(item.product_id, item.variant_id)}
      >
        Eliminar
      </button>

      <p className="ml-auto font-bold">
        ${subtotal.toFixed(2)}
      </p>
    </div>
  );
}
