/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useTabMonitor.ts
import { useEffect, useRef, useCallback } from "react";

interface ViolationLog {
  timestamp: number;
  type: string;
}

/**
 * Custom hook untuk memonitor aktivitas siswa di desktop dan mobile, mencegah kecurangan selama ujian.
 * @param onLimitReached - Callback saat batas pelanggaran tercapai.
 * @param limit - Batas jumlah pelanggaran. Default 5.
 * @param onViolation - Callback opsional saat pelanggaran terdeteksi.
 * @param debug - Aktifkan logging debug untuk melacak event (default: false).
 */
export function useTabMonitor(
  onLimitReached: () => void,
  limit = 5,
  onViolation?: (count: number, log: ViolationLog) => void,
  debug: boolean = false
) {
  const counterRef = useRef(0);
  const lastViolationTime = useRef(0);
  const violationLogs = useRef<ViolationLog[]>([]);
  const isMobile = useRef(
    /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent)
  );
  const lastEventType = useRef<string | null>(null); // Untuk mencegah spam event yang sama

  const logViolation = useCallback(
    (type: string) => {
      const now = Date.now();
      // Debounce: cegah event dalam 1 detik dan event berulang yang sama
      if (
        now - lastViolationTime.current < 1000 ||
        lastEventType.current === type
      ) {
        if (debug)
          console.log(`Event ${type} dibatasi oleh debounce atau duplikasi`);
        return;
      }
      lastViolationTime.current = now;
      lastEventType.current = type;

      counterRef.current += 1;
      const log: ViolationLog = { timestamp: now, type };
      violationLogs.current.push(log);

      // Panggil callback onViolation
      if (onViolation) {
        onViolation(counterRef.current, log);
      }

      // Peringatan terkendali (hanya log di mobile, hindari alert berulang)
      if (debug || !isMobile.current) {
        console.warn(
          `Peringatan: ${type} terdeteksi! Pelanggaran ke-${counterRef.current}.`
        );
      }

      // Periksa batas pelanggaran
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
    } catch (error) {
      console.error("Gagal masuk fullscreen:", error);
      if (isMobile.current) {
        logViolation("Gagal masuk fullscreen di perangkat mobile");
      }
    }
  }, [logViolation]);

  useEffect(() => {
    const startMonitoring = () => {
      requestFullscreen();

      const handleVisibilityChange = () => {
        if (document.hidden) {
          logViolation(
            isMobile.current ? "Aplikasi di-background" : "Tab disembunyikan"
          );
        }
      };

      const handleFullscreenChange = () => {
        if (
          !document.fullscreenElement &&
          !(document as any).webkitFullscreenElement &&
          !(document as any).mozFullScreenElement &&
          !(document as any).msFullscreenElement
        ) {
          logViolation("Keluar dari fullscreen");
          requestFullscreen();
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (isMobile.current) return; // Skip di mobile karena keyboard virtual
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
          (event.ctrlKey && ["t", "w", "Shift"].includes(event.key)) ||
          (event.altKey && event.key === "Tab") ||
          event.key === "F12" ||
          (event.ctrlKey && event.shiftKey && ["I", "J"].includes(event.key)) ||
          event.key === "Escape";

        if (isBlockedCombo) {
          event.preventDefault();
          logViolation(`Tombol terlarang: ${event.key}`);
        }
      };

      const handleBlur = () => {
        if (!isMobile.current) {
          // Hanya log di desktop, mobile ditangani oleh visibilitychange
          logViolation("Jendela kehilangan fokus");
        }
      };

      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        logViolation("Menu konteks dibuka");
      };

      const handleTouchStart = (event: TouchEvent) => {
        // Hanya deteksi multi-touch mencurigakan di mobile
        if (isMobile.current && event.touches.length > 2) {
          event.preventDefault();
          logViolation("Multi-touch mencurigakan");
        }
      };

      // Tambahkan event listener
      window.addEventListener("blur", handleBlur);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("contextmenu", handleContextMenu);
      if (isMobile.current) {
        document.addEventListener("touchstart", handleTouchStart);
      }

      return () => {
        window.removeEventListener("blur", handleBlur);
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
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("contextmenu", handleContextMenu);
        if (isMobile.current) {
          document.removeEventListener("touchstart", handleTouchStart);
        }
      };
    };

    // Mulai monitoring, dengan konfirmasi di mobile
    if (isMobile.current) {
      const confirmed = confirm(
        "Masuk ke mode ujian? Pastikan tidak beralih aplikasi."
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

  return { getViolationLogs };
}
