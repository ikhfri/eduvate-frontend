// app/(dashboard)/dashboard/my-qr/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MyQrPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-blue-50 dark:bg-blue-950 transition-colors duration-500">
        {/* Tombol Kembali */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="absolute top-6 left-6 z-20"
        >
          <ChevronLeft className="h-5 w-5 mr-2" /> Kembali
        </Button>

        {/* Kartu Identitas Digital */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full max-w-sm"
        >
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
            <div className="p-8 space-y-4">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold text-foreground">
                  QR Code Absensi
                </h1>
                <p className="text-muted-foreground">
                  Tunjukkan kode ini kepada mentor Anda.
                </p>
              </div>

              {/* Kontainer untuk QR Code atau Loader */}
              <div className="relative flex justify-center items-center aspect-square">
                {user ? (
                  <div className="p-4 bg-white rounded-lg shadow-inner">
                    <QRCodeCanvas
                      value={user.id}
                      size={220}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                      imageSettings={{
                        src: "/logo.png", // Ganti dengan path logo yang valid atau gunakan placeholder
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>
                ) : (
                  <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Informasi Pengguna di Bagian Bawah Kartu */}
            {user && (
              <div className="bg-muted/50 p-4 border-t text-center">
                <p className="font-semibold text-lg">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
