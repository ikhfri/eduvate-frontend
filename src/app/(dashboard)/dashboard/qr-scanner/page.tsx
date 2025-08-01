"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";

export default function QRScannerPage() {
  const [message, setMessage] = useState("Siap scan...");
  const [color, setColor] = useState("text-white");
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const playBeep = () => {
    const audio = new Audio("/beep.mp3");
    audio.play();
  };

  const handleScan = async (data: string) => {
    if (data && data !== lastScanned) {
      setLastScanned(data);
      try {
        const res = await fetch("/api/qr-check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ studentId: data }),
        });
        const result = await res.json();

        if (res.ok) {
          setMessage(result.message);
          setColor("text-green-500");
          playBeep();
        } else {
          setMessage(result.message);
          setColor("text-red-500");
        }
      } catch {
        setMessage("❌ Gagal absen!");
        setColor("text-red-500");
      }

      setTimeout(() => {
        setMessage("Siap scan...");
        setColor("text-white");
        setLastScanned(null);
      }, 2000);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div
        className={`flex flex-col items-center justify-center h-screen bg-black ${color}`}
      >
        <Card className="p-4 bg-white mb-4">
          <h1 className="text-3xl text-center">{message}</h1>
        </Card>
        <div className="w-full max-w-md">
          <Scanner
            onScan={(result) => handleScan(result[0]?.rawValue || "")}
            onError={(error) => console.error(error)}
            constraints={{ facingMode: "environment" }}
            styles={{ container: { width: "100%" } }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
