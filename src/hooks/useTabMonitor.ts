import { useEffect, useRef, useCallback } from "react";

/**

 * @param onLimitReached 
 * @param limit -
 * @param onViolation 
 */
export function useTabMonitor(
  onLimitReached: () => void,
  limit = 5,
  onViolation?: (count: number) => void
) {
  const counterRef = useRef(0);
  const lastViolationTime = useRef(0);

  const handleViolation = useCallback(() => {
    const now = Date.now();
    if (now - lastViolationTime.current < 500) {
      return;
    }
    lastViolationTime.current = now;

    counterRef.current += 1;

    if (onViolation) {
      onViolation(counterRef.current);
    }

    if (counterRef.current >= limit) {
      onLimitReached();
    }
  }, [onLimitReached, limit, onViolation]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    window.addEventListener("blur", handleViolation);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleViolation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleViolation]);
}
