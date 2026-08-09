import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 -> target over `duration` ms, starting when
 * `active` becomes true (or immediately if omitted). Uses an eased
 * requestAnimationFrame loop rather than a fixed interval, so it stays
 * smooth regardless of frame rate.
 */
export default function useCountUp(target, { duration = 1200, active = true } = {}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active]);

  return value;
}
