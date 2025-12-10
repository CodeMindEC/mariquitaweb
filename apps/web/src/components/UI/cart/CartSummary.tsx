import { useStore } from "@nanostores/react";
import { cartDeliveryFee, cartSubtotal } from "@stores/cart";
import { formatPrice } from "@lib/medusajs/products";

export default function CartSummary() {
  const subtotal = useStore(cartSubtotal);
  const delivery = useStore(cartDeliveryFee);
  const total = subtotal + delivery;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen</h2>

      <div className="flex justify-between mb-2">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      <div className="flex justify-between mb-2">
        <span>Envío</span>
        <span>{formatPrice(delivery)}</span>
      </div>

      <div className="border-t pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
