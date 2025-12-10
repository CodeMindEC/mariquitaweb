import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "motion";
import { AnimatePresence, motion } from "motion/react";
import { addItem } from "@stores/cart";
import { resolveProductPricing } from "@lib/medusajs/pricing";
import type { StoreProduct } from "@lib/medusajs/products";
import { getProductThumbnail, getProductTitle } from "@lib/medusajs/products";

const SUCCESS_MESSAGES = [
  "¡Buena elección!",
  "¡Listo!",
  "¡Perfecto!",
  "¡Excelente!",
  "¡Yummy!",
  "¡ÑAM ÑAM!",
  "¡A disfrutar!",
];

export default function AddToCartButton({
  product,
}: {
  product: StoreProduct;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const pricing = resolveProductPricing(product);
  const defaultVariant = product.variants?.[0];
  const unitPrice = pricing?.price ?? 0;
  const isUnavailable = !defaultVariant;
  const productTitle = getProductTitle(product);
  const productThumbnail = getProductThumbnail(product);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const isConfirming = Boolean(confirmationMessage);
  const motionProps = isUnavailable || shouldReduceMotion
    ? {}
    : {
      whileHover: { scale: 1.02, y: -1 },
      whileTap: { scale: 0.98, y: 0 },
      animate: {
        backgroundColor: isConfirming ? "#1f7c32" : "#22c55e",
        boxShadow: isConfirming
          ? "0 16px 32px rgba(31,124,50,0.55)"
          : "0 8px 18px rgba(34,197,94,0.35)",
        scale: isConfirming ? 1.02 : 1,
      },
      transition: {
        backgroundColor: { duration: 0.18 },
        boxShadow: { duration: 0.18 },
        scale: { duration: 0.18 },
      },
    };

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

    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
    }

    const randomMessage = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
    setConfirmationMessage(randomMessage);

    confirmationTimeoutRef.current = setTimeout(() => {
      setConfirmationMessage(null);
      confirmationTimeoutRef.current = null;
    }, 900);
  }, [defaultVariant, product.id, productTitle, productThumbnail, unitPrice, triggerFlyAnimation]);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  const IconComponent = isConfirming ? CheckIcon : CartIcon;
  const buttonLabel = confirmationMessage ?? "Agregar al carrito";
  return (
    <motion.button
      {...motionProps}
      ref={buttonRef}
      className={`group relative mt-2 inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-16 ${isUnavailable
        ? "cursor-not-allowed bg-gray-400/80"
        : "cursor-pointer bg-primary shadow-[0_8px_18px_rgba(34,197,94,0.35)] hover:bg-[#1f7c32]"
        }`}
      disabled={isUnavailable}
      aria-disabled={isUnavailable}
      onClick={handleAdd}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isConfirming ? "confirming" : "default"}
          className="inline-flex min-w-40 items-center justify-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
        >
          <motion.span
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10"
            animate={{
              scale: isConfirming ? 1.18 : 1,
              rotate: isConfirming ? 8 : 0,
              backgroundColor: isConfirming ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
            }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          >
            <IconComponent className="h-5 w-5 text-white" />
          </motion.span>
          <span
            className="text-base font-semibold leading-tight text-center whitespace-nowrap"
            aria-live="polite"
          >
            {buttonLabel}
          </span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
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

type IconProps = {
  className?: string;
};

function CartIcon({ className = "text-white" }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.4631 41.2923C16.3423 41.2923 17.0569 42.0069 17.0569 42.8861C17.0569 43.7652 16.3423 44.4777 15.4631 44.4777C14.584 44.4777 13.8715 43.7652 13.8715 42.8861C13.8715 42.0069 14.584 41.2923 15.4631 41.2923Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M38.9056 41.2923C39.7848 41.2923 40.4994 42.0069 40.4994 42.8861C40.4994 43.7652 39.7848 44.4777 38.9056 44.4777C38.0265 44.4777 37.3119 43.7652 37.3119 42.8861C37.3119 42.0069 38.0265 41.2923 38.9056 41.2923Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.72894 6.77084L10.0623 7.52084L12.0685 31.4229C12.231 33.3708 13.8581 34.8667 15.8123 34.8667H38.5456C40.4123 34.8667 41.9956 33.4958 42.2644 31.6458L44.2414 17.9833C44.4852 16.2979 43.1789 14.7896 41.4769 14.7896H10.7581"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29.4279 22.4896H35.205"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "text-white" }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
