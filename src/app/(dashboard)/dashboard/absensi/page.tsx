// app/(dashboard)/dashboard/absensi/page.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import axiosInstance from "@/lib/axiosInstance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, QrCode } from "lucide-react"; // Import QrCode icon
import { useToast } from "@/hooks/use-toast";

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // Inisialisasi router
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmitLeave = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/attendance/request-leave", { notes });
      toast({
        title: "Berhasil",
        description:
          "Pengajuan izin Anda untuk hari ini telah berhasil dicatat.",
      });
      // Idealnya, Anda akan menonaktifkan form setelah berhasil
    } catch (err: any) {
      toast({
        title: "Gagal Mengajukan Izin",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Absensi Hari Ini</CardTitle>
            <CardDescription>{today}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Jika Anda tidak dapat hadir, silakan ajukan izin. Untuk absensi
              hadir, tunjukkan QR Code Anda kepada mentor.
            </p>
            <Textarea
              placeholder="Tuliskan alasan izin Anda di sini (opsional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleSubmitLeave}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Ajukan Izin
              </Button>
              {/* Tombol baru untuk menampilkan QR Code */}
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/my-qr")}
                className="w-full"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Tampilkan QR Code Saya
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
