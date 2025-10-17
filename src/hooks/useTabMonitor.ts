/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";

/**
 * @param onLimitReached 
 * @param limit - 
 * @param onViolation - 
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
    const requestFullscreen = async () => {
      try {
        const element = document.documentElement;

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) { 
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) { 
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) { 
          await (element as any).msRequestFullscreen();
        }
      } catch (error) {
        console.error("Gagal masuk ke mode fullscreen:", error);
      }
    };

    requestFullscreen();

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