/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/absensi/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, QrCode, Calendar, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

// Komponen untuk setiap pilihan aksi (Izin atau QR)
const ActionCard = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  children,
  disabled = false,
  bgColor,
  hoverColor,
}: any) => (
  <motion.div
    whileHover={!disabled ? { scale: 1.03 } : {}}
    className={`relative flex flex-col justify-between w-full h-full p-8 rounded-2xl overflow-hidden transition-colors duration-300 ${bgColor}`}
  >
    <div>
      <div className="p-3 bg-white/20 rounded-lg w-fit mb-4">
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white">{title}</h2>
      <p className="text-white/80 mt-2 max-w-sm">{description}</p>
    </div>
    <div className="mt-8">
      {children}
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`w-full mt-2 text-lg py-6 font-bold bg-white text-black hover:${hoverColor} transition-all duration-300 shadow-lg`}
      >
        {buttonText}
      </Button>
    </div>
  </motion.div>
);

// Komponen untuk tampilan setelah berhasil mengajukan izin
const SuccessState = ({ onReset }: { onReset: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center text-center p-8"
  >
    <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
    <h2 className="text-2xl font-bold">Izin Berhasil Diajukan</h2>
    <p className="text-muted-foreground mt-2 max-w-md">
      Pengajuan izin Anda untuk hari ini telah berhasil dicatat. Anda dapat
      menutup halaman ini.
    </p>
    <Button onClick={onReset} variant="outline" className="mt-6">
      Ajukan Izin Lain
    </Button>
  </motion.div>
);

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false); // State untuk menandai izin sudah diajukan

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmitLeave = async () => {
    if (!notes.trim()) {
      toast({
        title: "Catatan Kosong",
        description: "Harap isi alasan mengapa Anda mengajukan izin.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/attendance/request-leave", { notes });
      toast({
        title: "Berhasil",
        description: "Pengajuan izin Anda telah berhasil dicatat.",
      });
      setLeaveSubmitted(true); // Set state berhasil
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-5xl mx-auto text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight">
              Absensi Kehadiran
            </h1>
            <p className="flex items-center justify-center gap-2 mt-2 text-lg text-muted-foreground">
              <Calendar className="h-5 w-5" /> {today}
            </p>
          </motion.div>
        </div>

        {leaveSubmitted ? (
          <SuccessState onReset={() => setLeaveSubmitted(false)} />
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu untuk Ajukan Izin */}
            <ActionCard
              icon={Send}
              title="Ajukan Izin"
              description="Jika Anda tidak dapat hadir karena sakit atau keperluan lain, ajukan izin di sini."
              buttonText={isSubmitting ? "Mengirim..." : "Kirim Pengajuan Izin"}
              onClick={handleSubmitLeave}
              disabled={isSubmitting}
              bgColor="bg-blue-600"
              hoverColor="bg-blue-100"
            >
              <Textarea
                placeholder="Tuliskan alasan lengkap Anda di sini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white/90 text-black placeholder:text-gray-600 border-0 focus-visible:ring-2 focus-visible:ring-white"
                rows={5}
              />
            </ActionCard>

            {/* Kartu untuk Tampilkan QR Code */}
            <ActionCard
              icon={QrCode}
              title="Hadir di Tempat"
              description="Untuk absensi hadir, klik tombol di bawah ini dan tunjukkan Kode QR Anda kepada mentor."
              buttonText="Tampilkan Kode QR Saya"
              onClick={() => router.push("/dashboard/my-qr")}
              bgColor="bg-gray-800"
              hoverColor="bg-gray-200"
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
