import type { StoreProduct } from "../../lib/medusajs/products";
import { formatPrice } from "../../lib/medusajs/products";
import {
  getProductThumbnail,
  getProductTitle,
  resolveProductPricing,
} from "../../lib/medusajs/pricing";

interface Props {
  product: StoreProduct;
  children: React.ReactNode; // <-- AQUI
}

export default function Card({ product, children }: Props) {
  const pricing = resolveProductPricing(product);
  const image = getProductThumbnail(product);
  const name = getProductTitle(product);
  const formattedPrice = formatPrice(pricing.price);
  const formattedOriginalPrice =
    pricing.originalPrice !== null ? formatPrice(pricing.originalPrice) : null;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full">
      <div className="relative w-full flex justify-center items-center">
        {pricing.discountLabel && (
          <div className="absolute top-2 right-2 bg-[#249b3e] text-white text-xs text-center w-[45px] h-[45px] rounded-full flex items-center justify-center font-bold shadow-md">
            {pricing.discountLabel}
          </div>
        )}
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-[230px]"
          loading="lazy"
        />
      </div>

      <div className="p-4 flex flex-col gap-2">
        <p className="text-[#444] font-semibold text-sm line-clamp-2">
          {name}
        </p>

        <div className="flex flex-col">
          <p className="text-lg font-bold text-[#333]">{formattedPrice}</p>
          {formattedOriginalPrice && (
            <p className="text-xs text-[#999] line-through">
              {formattedOriginalPrice}
            </p>
          )}
          {pricing.includesTax && (
            <p className="text-[11px] text-[#777] mt-1">Precio incluye IVA</p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
