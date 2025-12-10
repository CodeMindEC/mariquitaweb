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
    <div className="cart-item flex gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg shadow-sm">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex grow flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>

        {item.categoriesText && (
          <p className="text-sm text-gray-500">{item.categoriesText}</p>
        )}

        <div className="mt-1 flex items-center gap-2">
          <p className="font-semibold text-emerald-600">{formattedPrice}</p>
          {formattedOriginal && (
            <>
              <p className="text-sm text-gray-400 line-through">
                {formattedOriginal}
              </p>
              {item.discountLabel && (
                <span className="text-sm font-bold text-red-500">
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
