// components/UI/CartItem.tsx
import CartItemIsland from "./CartItemIsland";
import type { FC } from "react";

interface CartItemProps {
  item: {
    product_id: string;
    variant_id: string;
    title: string;
    thumbnail: string | null;
    quantity: number;
    unit_price: number;
    // opcional: categoriesText, priceCalculated, originalPrice, discountLabel si los guardas en el store
  };
}

const CartItem: FC<CartItemProps> = ({ item }) => {
  const image = item.thumbnail ?? "/images/placeholder-product.jpg";
  const name = item.title ?? "Producto sin nombre";
  const price = item.unit_price ?? 0;
  // Si guardas price original/descuento en item, muéstralo aquí igual

  return (
    <div className="cart-item flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden shadow-sm">
        <img src={image} alt={name} className="object-cover w-full h-full" loading="lazy" />
      </div>

      <div className="grow flex flex-col gap-1">
        <h3 className="font-semibold text-gray-800 text-lg">{name}</h3>

        {/* Si tienes categoriesText en el item, úsalo; si no, lo ocultamos */}
        {("categoriesText" in item) && (
          <p className="text-sm text-gray-500">{(item as any).categoriesText}</p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <p className="font-semibold text-emerald-600">${price.toFixed(2)}</p>
          {/* Si guardaste originalPrice/discountLabel en item, muéstralos aquí */}
          { (item as any).originalPrice && (
            <>
              <p className="line-through text-gray-400 text-sm">
                ${(item as any).originalPrice.toFixed(2)}
              </p>
              <span className="text-red-500 font-bold text-sm">{(item as any).discountLabel}</span>
            </>
          )}
        </div>

        {/* Island React para controles (cantidad, eliminar) */}
        <CartItemIsland item={item} />
      </div>
    </div>
  );
};

export default CartItem;
