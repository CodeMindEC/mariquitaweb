import CartItemIsland from "./CartItemIsland";
import type { FC } from "react";
import type { CartItem as CartEntry } from "@stores/cart";
import { formatPrice } from "@lib/medusajs/products";

interface CartItemProps {
  item: CartEntry;
}

const FALLBACK_IMAGE = "/images/placeholder-product.jpg";

const CartItem: FC<CartItemProps> = ({ item }) => {
  const image = item.thumbnail ?? FALLBACK_IMAGE;
  const name = item.title || "Producto sin nombre";
  const basePrice = item.unit_price ?? 0;
  const formattedPrice = formatPrice(basePrice);
  const originalPriceValue =
    typeof item.originalPrice === "number" ? item.originalPrice : null;
  const hasDiscount =
    originalPriceValue !== null && originalPriceValue > basePrice;
  const formattedOriginal = hasDiscount && originalPriceValue !== null
    ? formatPrice(originalPriceValue)
    : null;

  return (
    <div className="cart-item flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-lg border border-gray-200 p-3 sm:p-4 transition-shadow hover:shadow-md">
      <div className="h-32 w-full sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-lg shadow-sm mb-2 sm:mb-0">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex grow flex-col gap-1">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">{name}</h3>

        {item.categoriesText && (
          <p className="text-xs sm:text-sm text-gray-500">{item.categoriesText}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="font-semibold text-emerald-600 text-sm sm:text-base">{formattedPrice}</p>
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

        <CartItemIsland item={item} />
      </div>
    </div>
  );
};

export default CartItem;
