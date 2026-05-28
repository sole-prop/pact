import { useEffect, useState, useRef } from "react";

export function useAnimatedNumber(target: number, duration: number = 300): number {
  const [current, setCurrent] = useState(target);
  const startValRef = useRef(current);
  const targetValRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Keep target value updated
  useEffect(() => {
    startValRef.current = current;
    targetValRef.current = target;
    startTimeRef.current = null;

    if (current === target) return;

    function animate(timestamp: number) {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const nextVal = startValRef.current + (targetValRef.current - startValRef.current) * easeProgress;

      const roundedVal = Math.round(nextVal);
      setCurrent(roundedVal);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(targetValRef.current);
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [target, duration]);

  return current;
}
