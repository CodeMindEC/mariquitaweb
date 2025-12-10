import { useStore } from "@nanostores/react";
import { cartQuantityTotal } from "@stores/cart";
import { useEffect, useRef, useState } from "react";

export default function HeaderCartCount(): JSX.Element | null {
  const total = useStore(cartQuantityTotal);
  const [isClient, setIsClient] = useState(false);
  const [animate, setAnimate] = useState<boolean>(false);
  const prevTotalRef = useRef<number>(0);

  useEffect(() => {
    // Avoid rendering on the server to keep SSR and client markup in sync
    setIsClient(true);
  }, []);

  useEffect(() => {
    const prevTotal = prevTotalRef.current;
    if (total === 0) {
      prevTotalRef.current = total;
      setAnimate(false);
      return;
    }

    if (total === prevTotal) {
      return;
    }

    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 600);
    prevTotalRef.current = total;

    return () => {
      clearTimeout(timer);
    };
  }, [total]);

  if (!isClient || total === 0) return null;

  return (
    <span
      className={`
        absolute
        -top-1.5
        -right-1.5
        bg-red-600
        text-white
        text-[10px]
        font-bold
        min-w-5
        h-5
        px-1
        flex items-center justify-center
        rounded-full
        shadow-md
        transition-all
        duration-300
        ease-out
        select-none
        ${animate ? "scale-110" : "scale-100"}
      `}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
