// app/(dashboard)/dashboard/ranking/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  Trophy,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RankedStudent {
  id: string;
  name: string | null;
  email: string;
  finalScore: number;
}

interface RankingData {
  quizTitle: string; // Walaupun namanya quizTitle, kita gunakan untuk judul halaman
  attempts: RankedStudent[];
  isRevealed: boolean;
}

const RankCard = ({
  student,
  rank,
}: {
  student: RankedStudent;
  rank: number;
}) => {
  const rankColors = {
    1: "from-amber-400 to-yellow-500",
    2: "from-slate-400 to-gray-500",
    3: "from-yellow-600 to-amber-700",
  };
  const isTopThree = rank <= 3;

  return (
    <div
      className={`relative p-4 rounded-lg bg-gradient-to-br ${
        isTopThree
          ? rankColors[rank as 1 | 2 | 3]
          : "from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"
      } text-white shadow-lg`}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold w-12 text-center flex-shrink-0">
          #{rank}
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl">
          {student.name ? student.name.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">{student.name || "Tanpa Nama"}</p>
          <p className="text-xs opacity-80">{student.email}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold">
            {student.finalScore.toFixed(2)}
          </p>
          <p className="text-xs opacity-80">Skor Akhir</p>
        </div>
      </div>
      {isTopThree && (
        <Trophy className="absolute top-2 right-2 h-6 w-6 text-white/50" />
      )}
    </div>
  );
};

export default function RankingPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/rankings/top-students");
      setRankingData(response.data?.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Gagal mengambil data peringkat."
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRanking();
    }
  }, [user, fetchRanking]);

  const toggleVisibility = async () => {
    const endpoint = rankingData?.isRevealed
      ? "/rankings/hide"
      : "/rankings/reveal";
    const successMessage = rankingData?.isRevealed
      ? "Peringkat berhasil disembunyikan."
      : "Peringkat berhasil diumumkan.";

    setIsToggling(true);
    try {
      await axiosInstance.post(endpoint);
      toast({ title: "Sukses", description: successMessage });
      fetchRanking(); // Refresh data untuk mendapatkan status terbaru
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Gagal mengubah status.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Menghitung peringkat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchRanking}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR", "STUDENT"]}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative text-white">
            <div className="absolute -inset-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl transform -rotate-2"></div>
            <div className="relative p-6">
              <h1 className="text-4xl font-bold">Peringkat Siswa</h1>
              <p className="mt-1 text-white/80">
                Siswa dengan akumulasi skor tertinggi.
              </p>
            </div>
          </div>
          {(user?.role === "ADMIN" || user?.role === "MENTOR") && (
            <Button onClick={toggleVisibility} disabled={isToggling}>
              {isToggling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : rankingData?.isRevealed ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {rankingData?.isRevealed
                ? "Sembunyikan Peringkat"
                : "Umumkan Peringkat"}
            </Button>
          )}
        </div>

        {rankingData && rankingData.attempts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl">
            <Trophy className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">
              Peringkat Belum Tersedia
            </h3>
            <p className="text-muted-foreground mt-1">
              {user?.role === "STUDENT"
                ? "Peringkat belum diumumkan oleh mentor. Periksa kembali nanti!"
                : "Belum ada data yang cukup untuk menampilkan peringkat."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* FIX: Menambahkan .slice(0, 5) untuk memastikan hanya 5 teratas yang ditampilkan */}
            {rankingData?.attempts.slice(0, 5).map((student, index) => (
              <RankCard key={student.id} student={student} rank={index + 1} />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
