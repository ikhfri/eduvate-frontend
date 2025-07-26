// app/(dashboard)/dashboard/manage-kuis/[quizId]/results/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  AlertCircle,
  BarChart2,
  ChevronLeft,
  Users,
  Star,
  Trophy,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Assuming utility is moved
import { saveAs } from "file-saver";

// Interfaces (restored for type safety)
interface QuizAttempt {
  id: string;
  score: number;
  submittedAt: string;
  student: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface QuizResultsData {
  quizTitle: string;
  attempts: QuizAttempt[];
  stats?: {
    participantCount: number;
    averageScore: number;
  };
}

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizResults = useCallback(async () => {
    if (!quizId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/quizzes/${quizId}/results`);
      setResultsData(response.data?.data || response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Terjadi kesalahan saat mengambil data hasil kuis.";
      setError(errorMessage);
      toast({
        title: "Gagal Mengambil Hasil",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [quizId, user, toast]);

  useEffect(() => {
    fetchQuizResults();
  }, [fetchQuizResults]);

  const handleExport = async () => {
    if (!confirm("Apakah Anda ingin mengunduh hasil kuis dalam format Excel?"))
      return;
    setIsExporting(true);
    toast({
      title: "Mempersiapkan file...",
      description: "Harap tunggu sebentar.",
    });
    try {
      const response = await axiosInstance.get(`/quizzes/${quizId}/export`, {
        responseType: "blob",
      });

      if (
        response.headers["content-type"] !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        throw new Error("Format file tidak valid.");
      }

      const contentDisposition = response.headers["content-disposition"];
      let filename = `hasil-kuis-${resultsData?.quizTitle || quizId}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch?.length > 1) {
          filename = filenameMatch[1];
        }
      }

      saveAs(new Blob([response.data]), filename);
      toast({
        title: "Unduhan Dimulai",
        description: "File Excel Anda sedang diunduh.",
      });
    } catch (err: any) {
      console.error("Gagal mengekspor hasil:", err);
      let errorMessage = "Terjadi kesalahan saat mempersiapkan file.";
      if (err.response?.status === 404) {
        errorMessage = "Data kuis tidak ditemukan.";
      } else if (err.code === "ERR_NETWORK") {
        errorMessage = "Koneksi jaringan gagal.";
      }
      toast({
        title: "Gagal Mengekspor",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-yellow-700" />;
    return <span className="text-sm font-medium">{rank}</span>;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat hasil kuis...</p>
      </div>
    );
  }

  if (error || !resultsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Gagal Memuat Hasil</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard/manage-kuis")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Kembali ke Kelola Kuis
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Button
          onClick={() => router.push("/dashboard/manage-kuis")}
          variant="outline"
          size="sm"
          className="mb-4 inline-flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Kembali ke Kelola Kuis
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Hasil Kuis</h1>
            <p className="text-muted-foreground">
              Peringkat dan skor untuk kuis: {resultsData.quizTitle}
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || resultsData.attempts.length === 0}
            variant="default"
            size="sm"
            aria-label="Ekspor hasil kuis ke Excel"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Ekspor ke Excel
          </Button>
        </div>

        <Card className="shadow-lg border-border rounded-lg">
          <CardHeader className="text-center">
            <BarChart2 className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-3xl font-bold mt-2">
              Hasil Kuis: {resultsData.quizTitle}
            </CardTitle>
            <CardDescription>Ringkasan performa peserta kuis.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center p-6 border-y">
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Jumlah Peserta</p>
              </div>
              <p className="text-4xl font-bold text-primary">
                {resultsData.stats?.participantCount ?? 0}
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Rata-rata Skor</p>
              </div>
              <p className="text-4xl font-bold text-blue-600">
                {resultsData.stats?.averageScore?.toFixed(2) ?? "0.00"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border rounded-lg">
          <CardHeader>
            <CardTitle>Peringkat Peserta</CardTitle>
            <CardDescription>
              Daftar peserta diurutkan berdasarkan skor tertinggi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resultsData.attempts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  Belum ada siswa yang mengerjakan kuis ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] text-center">
                        Peringkat
                      </TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Skor</TableHead>
                      <TableHead>Waktu Pengerjaan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultsData.attempts.map(
                      (attempt: QuizAttempt, index: number) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                          </TableCell>
                          <TableCell>{attempt.student.name || "N/A"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {attempt.student.email}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {attempt.score.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {cn(attempt.submittedAt)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
