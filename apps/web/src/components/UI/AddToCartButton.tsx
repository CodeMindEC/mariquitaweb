import { addItem } from "../../stores/cart";
import { resolveProductPricing } from "../../lib/medusajs/pricing";
import type { StoreProduct } from "../../lib/medusajs/products";
import {
  getProductThumbnail,
  getProductTitle,
  formatPrice,
} from "../../lib/medusajs/products";

export default function AddToCartButton({
  product,
}: {
  product: StoreProduct;
}) {
  const pricing = resolveProductPricing(product);
  const formattedPrice = formatPrice(pricing.price);
  function handleAdd() {
    if (!product.variants || product.variants.length === 0) {
      console.error("El producto no tiene variantes disponibles.");
      return;
    }

    addItem({
      product_id: product.id,
      variant_id: product.variants[0].id, // variante por defecto
      title: getProductTitle(product),
      thumbnail: getProductThumbnail(product),
      quantity: 1,
      unit_price: pricing.price,
    });
  }
  return (
    <button
      className="mt-2 w-full bg-[#249b3e] text-white py-2 rounded-lg font-semibold text-sm transition-transform duration-300 hover:scale-105"
      onClick={handleAdd}
    >
      Comprar ahora - {formattedPrice}
    </button>
  );
}
