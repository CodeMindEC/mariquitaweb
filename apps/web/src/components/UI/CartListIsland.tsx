import { useStore } from "@nanostores/react";
import { cart } from "../../stores/cart";
import CartItem from "../UI/CartItem";

export default function CartListIsland() {
  const items = useStore(cart);

  if (!items.length) {
    return <p className="text-gray-500">No tienes productos en el carrito.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CartItem key={item.product_id} item={item} />
      ))}
    </div>
  );
}
