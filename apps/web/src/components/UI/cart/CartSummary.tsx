import { useStore } from "@nanostores/react";
import { cartDeliveryFee, cartSubtotal } from "@stores/cart";
import { formatPrice } from "@lib/medusajs/products";

export default function CartSummary() {
  const subtotal = useStore(cartSubtotal);
  const delivery = useStore(cartDeliveryFee);
  //const discount = useStore(cartDiscount) || 0;
  //const tax = useStore(cartTax) || 0;
  const total = subtotal + delivery;
  // + tax - discount;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-2 sm:gap-4 w-full max-w-md mx-auto">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 text-center">Resumen del pedido</h2>

      <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between text-sm sm:text-base">
        <span className="text-gray-600">Subtotal productos</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between text-sm sm:text-base">
        <span className="text-gray-600">Descuento aplicado</span>
        {/* <span className={discount > 0 ? "text-emerald-600 font-semibold" : "text-gray-400"}>{discount > 0 ? `- ${formatPrice(discount)}` : "No aplica"}</span> */}
        <span className={12 > 0 ? "text-emerald-600 font-semibold" : "text-gray-400"}>{12 > 0 ? `- ${formatPrice(12)}` : "No aplica"}</span>
      </div>

      <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between text-sm sm:text-base">
        <span className="text-gray-600">Impuestos</span>
        {/*<span>{cartTax > 0 ? formatPrice(cartTax) : "Incluidos"}</span>*/}
        <span>{15 > 0 ? formatPrice(15) : "Incluidos"}</span>
      </div>

      <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between text-sm sm:text-base">
        <span className="text-gray-600">Costo de envío</span>
        <span>{delivery > 0 ? formatPrice(delivery) : "Gratis"}</span>
      </div>

      <div className="border-t pt-3 mt-2 flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between font-bold text-base sm:text-lg">
        <span>Total a pagar</span>
        <span>{formatPrice(total)}</span>
      </div>


      <div className="mt-4">
        <a
          href="/checkout"
          className="block w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-center font-semibold py-3 px-4 text-base sm:text-lg transition-colors shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          Continuar con el pedido
        </a>
      </div>
      <div className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
        <p>Los descuentos, impuestos y costos de envío se calculan automáticamente según tu carrito y dirección de entrega.</p>
      </div>
    </div>
  );
}
