import { useStore } from "@nanostores/react";
import { cart } from "../../stores/cart";
import { useEffect, useState } from "react";

export default function HeaderCartCount(): JSX.Element | null {
  const items = useStore(cart);
  const [animate, setAnimate] = useState<boolean>(false);
  const [prevTotal, setPrevTotal] = useState<number>(0);
  const [showPulse, setShowPulse] = useState<boolean>(false);

   const total: number = items.length;

  useEffect(() => {
    if (total !== prevTotal && total > 0) {
      setAnimate(true);
      setShowPulse(true);

      const animTimer = setTimeout(() => setAnimate(false), 600);
      const pulseTimer = setTimeout(() => setShowPulse(false), 1000);

      setPrevTotal(total);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(pulseTimer);
      };
    }
  }, [total, prevTotal]);

  if (total === 0) return null;

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
