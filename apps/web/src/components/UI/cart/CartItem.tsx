import CartItemIsland from "./CartItemIsland";
import type { FC } from "react";
import { useState } from "react";
import type { CartItem as CartEntry } from "@stores/cart";
import { formatPrice } from "@lib/medusajs/products";
import { FALLBACK_PRODUCT_IMAGE } from "@lib/utils/constants";

interface CartItemProps {
  item: CartEntry;
}

const CartItem: FC<CartItemProps> = ({ item }) => {
  const [selectedVariant, setSelectedVariant] = useState(item.variant_id);
  const image = item.thumbnail ?? FALLBACK_PRODUCT_IMAGE;
  const name = item.title || "Producto sin nombre";
  const currentVariant = item.variants?.find(
    (v) => v.id === selectedVariant
  ) || {
    id: item.variant_id,
    weight: item.weight,
    price: item.unit_price,
  };
  const basePrice = currentVariant.price ?? 0;
  const formattedPrice = formatPrice(basePrice);
  const originalPriceValue =
    typeof item.originalPrice === "number" ? item.originalPrice : null;
  const hasDiscount =
    originalPriceValue !== null && originalPriceValue > basePrice;
  const formattedOriginal =
    hasDiscount && originalPriceValue !== null
      ? formatPrice(originalPriceValue)
      : null;
  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    const variant = item.variants?.find((v) => v.id === variantId);
    if (!variant) return;

    window.dispatchEvent(
      new CustomEvent("cart:update-variant", {
        detail: {
          product_id: item.product_id,
          old_variant_id: item.variant_id, // la variante actual antes del cambio
          new_variant_id: variantId,
        },
      })
    );
  };

  return (
    <div className="cart-item flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-lg border border-gray-200 p-3 sm:p-4 transition-shadow hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_5px_10px_rgba(34,197,94,0.25)]">
      <div className="h-32 w-full sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-lg shadow-sm mb-2 sm:mb-0">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex grow flex-col gap-1">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          {name}
        </h3>
        {item.categoriesText && (
          <p className="text-xs sm:text-sm text-gray-500">
            {item.categoriesText}
          </p>
        )}
        {/* Selector de variantes mejorado */}
        {item.variants && item.variants.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Peso
            </label>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((variant) => {
                const isSelected = selectedVariant === variant.id;
                return (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantChange(variant.id)}
                    className={`
                      relative px-4 py-2 rounded-lg border-2 transition-all duration-200
                      ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-semibold">
                        {variant.weight}
                      </span>
                      <span className="text-xs">
                        {formatPrice(variant.price)}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="font-semibold text-emerald-600 text-sm sm:text-base">
            {formattedPrice}
          </p>
          {formattedOriginal && (
            <>
              <p className="text-xs sm:text-sm text-gray-400 line-through">
                {formattedOriginal}
              </p>
              {item.discountLabel && (
                <span className="text-xs sm:text-sm font-bold text-red-500">
                  {item.discountLabel}
                </span>
              )}
            </>
          )}
        </div>

        <CartItemIsland item={item} selectedVariantId={selectedVariant} />
      </div>
    </div>
  );
};

export default CartItem;
