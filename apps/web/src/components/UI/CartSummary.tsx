import { useStore } from "@nanostores/react";
import { cartSubtotal } from "../../stores/cart";

export default function CartSummary() {
  const subtotal = useStore(cartSubtotal);
  const delivery = 2.5;
  const total = subtotal + delivery;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen</h2>

      <div className="flex justify-between mb-2">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between mb-2">
        <span>Envío</span>
        <span>${delivery.toFixed(2)}</span>
      </div>

      <div className="border-t pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
