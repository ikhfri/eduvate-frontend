/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useTabMonitor.ts
import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook untuk memonitor aktivitas pengguna meninggalkan tab/jendela dan mengaktifkan auto fullscreen.
 * @param onLimitReached - Callback yang dipanggil saat batas pelanggaran tercapai.
 * @param limit - Batas jumlah pelanggaran. Default 5.
 * @param onViolation - Callback opsional yang dipanggil setiap kali pelanggaran terdeteksi. Menerima jumlah pelanggaran saat ini.
 */
export function useTabMonitor(
  onLimitReached: () => void,
  limit = 5,
  onViolation?: (count: number) => void
) {
  const counterRef = useRef(0);
  const lastViolationTime = useRef(0);

  const handleViolation = useCallback(() => {
    // Debounce untuk mencegah event terpicu ganda dalam waktu singkat
    const now = Date.now();
    if (now - lastViolationTime.current < 500) {
      return;
    }
    lastViolationTime.current = now;

    counterRef.current += 1;

    // Panggil callback onViolation jika ada
    if (onViolation) {
      onViolation(counterRef.current);
    }

    // Periksa apakah batas tercapai
    if (counterRef.current >= limit) {
      onLimitReached();
    }
  }, [onLimitReached, limit, onViolation]);

  useEffect(() => {
    // Fungsi untuk mengaktifkan mode fullscreen
    const requestFullscreen = async () => {
      try {
        const element = document.documentElement;

        // Cek apakah browser mendukung fullscreen
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Untuk Safari
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Untuk Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // Untuk IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } catch (error) {
        console.error("Gagal masuk ke mode fullscreen:", error);
      }
    };

    // Panggil fullscreen saat komponen dimuat
    requestFullscreen();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    // 'blur' mendeteksi saat jendela browser kehilangan fokus
    window.addEventListener("blur", handleViolation);
    // 'visibilitychange' mendeteksi saat tab disembunyikan
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleViolation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleViolation]);
}
