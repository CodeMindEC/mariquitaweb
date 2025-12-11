import { useStore } from "@nanostores/react";
import { cart } from "@stores/cart";
import CartItem from "@ui/cart/CartItem";

export default function CartListIsland() {
  const items = useStore(cart);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[120px] p-2 sm:p-4">
        <p className="text-gray-500 text-center text-sm sm:text-base" role="status">
          No tienes productos en el carrito.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {items.map((item) => (
        <CartItem
          key={`${item.product_id}-${item.variant_id}`}
          item={item}
        />
      ))}
    </div>
  );
}
