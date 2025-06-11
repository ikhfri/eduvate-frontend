/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useTabMonitor.ts
import { useEffect, useRef, useCallback, useState } from "react";

interface ViolationLog {
  timestamp: number;
  type: string;
}

/**
 * Custom hook untuk memonitor aktivitas pengguna, mengaktifkan auto fullscreen, dan mencegah kuis dikerjakan sebelum fullscreen.
 * @param onLimitReached - Callback yang dipanggil saat batas pelanggaran tercapai.
 * @param limit - Batas jumlah pelanggaran. Default 5.
 * @param onViolation - Callback opsional yang dipanggil setiap kali pelanggaran terdeteksi.
 * @param debug - Aktifkan logging debug untuk melacak event (default: false).
 */
export function useTabMonitor(
  onLimitReached: () => void,
  limit = 5,
  onViolation?: (count: number, log: ViolationLog) => void,
  debug: boolean = false
) {
  const counterRef = useRef(0);
  const violationLogs = useRef<ViolationLog[]>([]);
  const lastViolationTime = useRef(new Map<string, number>()); // Debounce per event type
  const isMobile = useRef(
    /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent)
  );
  const isMonitoring = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReturnToFullscreen, setShowReturnToFullscreen] = useState(false);

  const logViolation = useCallback(
    (type: string) => {
      const now = Date.now();
      const lastTime = lastViolationTime.current.get(type) || 0;

      // Debounce: minimal 2 detik antar event per jenis
      if (now - lastTime < 2000) {
        if (debug) console.log(`Event ${type} dibatasi oleh debounce`);
        return;
      }
      lastViolationTime.current.set(type, now);

      counterRef.current += 1;
      const log: ViolationLog = { timestamp: now, type };
      violationLogs.current.push(log);

      if (onViolation) {
        onViolation(counterRef.current, log);
      }

      // Peringatan non-intrusif
      console.warn(
        `Peringatan: ${type} terdeteksi! Pelanggaran ke-${counterRef.current}.`
      );

      if (counterRef.current >= limit) {
        onLimitReached();
      }
    },
    [onLimitReached, limit, onViolation, debug]
  );

  const requestFullscreen = useCallback(async () => {
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
      setIsFullscreen(true);
      setShowReturnToFullscreen(false);
    } catch (error) {
      console.error("Gagal masuk fullscreen:", error);
      setIsFullscreen(false);
      logViolation("Gagal masuk fullscreen");
    }
  }, [logViolation]);

  useEffect(() => {
    const checkFullscreenStatus = () => {
      const isCurrentlyFullscreen =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      setShowReturnToFullscreen(!isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen && isMonitoring.current) {
        logViolation("Keluar dari fullscreen");
      }
    };

    const startMonitoring = () => {
      isMonitoring.current = true;
      requestFullscreen();

      const handleVisibilityChange = () => {
        if (!isMonitoring.current) return;
        if (document.hidden && !isMobile.current) {
          // Hanya deteksi di desktop untuk menghindari spam di mobile
          logViolation("Tab disembunyikan");
        }
      };

      const handleFullscreenChange = () => {
        if (!isMonitoring.current) return;
        checkFullscreenStatus();
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (!isMonitoring.current || isMobile.current) return;
        const blockedKeys = [
          "F12",
          "Control+Shift+I",
          "Control+Shift+J",
          "Control+T",
          "Control+W",
          "Alt+Tab",
          "Escape",
        ];

        const isBlockedCombo =
          (event.ctrlKey && ["t", "w"].includes(event.key.toLowerCase())) ||
          (event.altKey && event.key === "Tab") ||
          event.key === "F12" ||
          (event.ctrlKey &&
            event.shiftKey &&
            ["i", "j"].includes(event.key.toLowerCase())) ||
          event.key === "Escape";

        if (isBlockedCombo) {
          event.preventDefault();
          logViolation(`Tombol terlarang: ${event.key}`);
        }
      };

      const handleContextMenu = (event: MouseEvent) => {
        if (!isMonitoring.current) return;
        event.preventDefault();
        logViolation("Menu konteks dibuka");
      };

      // Tambahkan event listener
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);
      if (!isMobile.current) {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("contextmenu", handleContextMenu);
      }

      // Cek status fullscreen awal
      checkFullscreenStatus();

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "webkitfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "mozfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "MSFullscreenChange",
          handleFullscreenChange
        );
        if (!isMobile.current) {
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("contextmenu", handleContextMenu);
        }
      };
    };

    // Mulai monitoring dengan konfirmasi di mobile
    if (isMobile.current) {
      const confirmed = confirm(
        "Masuk ke mode ujian? Pastikan tidak beralih aplikasi atau membuka notifikasi."
      );
      if (confirmed) {
        startMonitoring();
      } else {
        logViolation("Menolak masuk mode ujian");
      }
    } else {
      startMonitoring();
    }
  }, [logViolation, requestFullscreen]);

  // Fungsi untuk mendapatkan log pelanggaran
  const getViolationLogs = useCallback(() => violationLogs.current, []);

  return {
    getViolationLogs,
    isFullscreen,
    showReturnToFullscreen,
    requestFullscreen,
  };
}
