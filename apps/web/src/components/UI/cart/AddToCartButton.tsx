import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "motion";
import { addItem } from "@stores/cart";
import { resolveProductPricing } from "@lib/medusajs/pricing";
import type { StoreProduct } from "@lib/medusajs/products";
import {
  getProductThumbnail,
  getProductTitle,
  formatPrice,
} from "@lib/medusajs/products";

export default function AddToCartButton({
  product,
}: {
  product: StoreProduct;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const pricing = resolveProductPricing(product);
  const defaultVariant = product.variants?.[0];
  const unitPrice = pricing?.price ?? 0;
  const formattedPrice = formatPrice(unitPrice);
  const isUnavailable = !defaultVariant;
  const productTitle = getProductTitle(product);
  const productThumbnail = getProductThumbnail(product);

  const triggerFlyAnimation = useCallback(() => {
    if (typeof window === "undefined" || shouldReduceMotion) return;

    const button = buttonRef.current;
    const cartTarget = document.querySelector<HTMLElement>("[data-cart-indicator]");
    if (!button || !cartTarget) return;

    const card = button.closest<HTMLElement>("[data-product-card]");
    const image = card?.querySelector<HTMLImageElement>("[data-product-image]");
    if (!image) return;

    const imageRect = image.getBoundingClientRect();
    const cartRect = cartTarget.getBoundingClientRect();

    const imageCenterX = imageRect.left + imageRect.width / 2;
    const imageCenterY = imageRect.top + imageRect.height / 2;
    const cartCenterX = cartRect.left + cartRect.width / 2;
    const cartCenterY = cartRect.top + cartRect.height / 2;
    const deltaX = cartCenterX - imageCenterX;
    const deltaY = cartCenterY - imageCenterY;

    const clone = image.cloneNode(true) as HTMLImageElement;
    const imageStyles = window.getComputedStyle(image);

    clone.style.position = "fixed";
    clone.style.left = `${imageRect.left}px`;
    clone.style.top = `${imageRect.top}px`;
    clone.style.width = `${imageRect.width}px`;
    clone.style.height = `${imageRect.height}px`;
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "9999";
    clone.style.borderRadius = imageStyles.borderRadius;
    clone.style.willChange = "transform, opacity";
    clone.style.filter = "drop-shadow(0 12px 20px rgba(15,23,42,0.25))";

    document.body.appendChild(clone);

    const animation = animate(
      clone,
      {
        x: [0, deltaX * 0.65, deltaX],
        y: [0, deltaY * 0.45, deltaY],
        scale: [1, 0.9, 0.2],
        opacity: [1, 0.85, 0.1],
        rotate: [0, 5, 0],
      },
      {
        duration: 0.85,
        ease: "easeInOut",
        times: [0, 0.55, 1],
      },
    );

    animation.finished.finally(() => {
      clone.remove();
    });
  }, [shouldReduceMotion]);

  const handleAdd = useCallback(() => {
    if (!defaultVariant) {
      console.warn("No hay variantes disponibles para el producto", product.id);
      return;
    }

    addItem({
      product_id: product.id,
      variant_id: defaultVariant.id,
      title: productTitle,
      thumbnail: productThumbnail,
      quantity: 1,
      unit_price: unitPrice,
    });

    triggerFlyAnimation();
  }, [defaultVariant, product.id, productTitle, productThumbnail, unitPrice, triggerFlyAnimation]);
  return (
    <button
      ref={buttonRef}
      className={`mt-2 w-full rounded-lg py-2 text-sm font-semibold text-white transition-all duration-300 ${isUnavailable
        ? "cursor-not-allowed bg-gray-400"
        : "cursor-pointer bg-[#249b3e] hover:scale-105"
        }`}
      disabled={isUnavailable}
      aria-disabled={isUnavailable}
      onClick={handleAdd}
    >
      Comprar ahora - {formattedPrice}
    </button>
  );
}

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefers(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefers;
}
