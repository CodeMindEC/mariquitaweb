import { useStore } from "@nanostores/react";
import { cartDeliveryFee, cartSubtotal } from "@stores/cart";
import { formatPrice } from "@lib/medusajs/products";
import { useState } from "react";

export default function CheckoutSummary() {
  const subtotal = useStore(cartSubtotal);
  const delivery = useStore(cartDeliveryFee);
  const total = subtotal + delivery;
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountMessage("Por favor ingresa un código");
      return;
    }

    // Códigos de descuento válidos
    const validCodes: Record<string, number> = {
      "DESCUENTO10": 0.10,
      "DESCUENTO20": 0.20,
      "BIENVENIDA15": 0.15,
      "VERANO25": 0.25,
    };

    const upperCode = discountCode.toUpperCase();
    if (validCodes[upperCode]) {
      const percentage = validCodes[upperCode];
      setDiscountApplied(true);
      setDiscountMessage(
        `✓ Código válido: ${(percentage * 100).toFixed(0)}% de descuento aplicado`
      );
    } else {
      setDiscountMessage("✗ Código inválido o expirado");
      setDiscountApplied(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Código de descuento - Primero */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-t-4 border-yellow-400">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Código de descuento</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleApplyDiscount()}
            placeholder="Ingresa tu código"
            disabled={discountApplied}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white hover:border-yellow-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none transition disabled:bg-yellow-50 disabled:border-yellow-300"
          />
          <button
            type="button"
            onClick={handleApplyDiscount}
            disabled={discountApplied}
            className="w-full rounded-lg bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-300 text-gray-900 font-semibold py-2 px-4 text-sm transition-colors shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            Aplicar descuento
          </button>
          {discountMessage && (
            <p
              className={`text-xs text-center ${
                discountApplied ? "text-green-600" : "text-red-600"
              }`}
            >
              {discountMessage}
            </p>
          )}
        </div>
      </div>

      {/* Resumen del pedido - Como estaba antes */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-2 sm:gap-4 w-full max-w-md mx-auto">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 text-center">
          Resumen del pedido
        </h2>

        <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between text-sm sm:text-base">
          <span className="text-gray-600">Subtotal productos</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between text-sm sm:text-base">
          <span className="text-gray-600">Descuento aplicado</span>
          <span className={12 > 0 ? "text-emerald-600 font-semibold" : "text-gray-400"}>
            {12 > 0 ? `- ${formatPrice(12)}` : "No aplica"}
          </span>
        </div>

        <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:justify-between text-sm sm:text-base">
          <span className="text-gray-600">Impuestos</span>
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
          <button
            type="submit"
            form="checkout-form"
            className="block w-full rounded-lg bg-green-600 hover:bg-green-700 text-white text-center font-semibold py-3 px-4 text-base sm:text-lg transition-colors shadow focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          >
            Confirmar pedido
          </button>
        </div>

        <div className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
          <p>
            Los descuentos, impuestos y costos de envío se calculan automáticamente según tu carrito y dirección de entrega.
          </p>
        </div>
      </div>
    </div>
  );
}
