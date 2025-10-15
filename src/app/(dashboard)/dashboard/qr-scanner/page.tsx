/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { cn } from "@/lib/utils";

export default function QRScannerPage() {
  const [message, setMessage] = useState("Arahkan kamera ke QR Code Siswa");
  const [bgColor, setBgColor] = useState("bg-gray-900 dark:bg-gray-950");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const { user } = useAuth();

  const playBeep = (type: "success" | "error") => {
    const audio = new Audio(
      type === "success" ? "/beep-success.mp3" : "/beep-error.mp3"
    );
    audio.play();
  };

  const handleScan = async (data: string) => {
    if (data && data !== lastScanned) {
      setLastScanned(data);

      try {
        const response = await axiosInstance.post("/attendance/qr-check-in", {
          studentId: data,
        });

        setMessage(response.data.message);
        setBgColor("bg-green-600 dark:bg-green-800");
        playBeep("success");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        setMessage(err.response?.data?.message || "QR Code tidak valid!");
        setBgColor("bg-red-600 dark:bg-red-800");
        playBeep("error");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div
        className={cn(
          "flex flex-col items-center justify-center h-screen transition-colors duration-500",
          bgColor
        )}
      >
        <div className="w-full max-w-md p-4">
          <Card className="mb-6 text-center shadow-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {message}
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="rounded-xl overflow-hidden border-4 border-white/50 dark:border-gray-400/50 shadow-lg">
            <Scanner
              onScan={(result) => handleScan(result[0]?.rawValue || "")}
              onError={(error) =>
                console.error((error as Error)?.message || error)
              }
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%" } }}
            />
          </div>
          <p className="text-center text-white/70 dark:text-gray-300 mt-4">
            Pastikan kamera memiliki izin akses dan cahaya cukup.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
