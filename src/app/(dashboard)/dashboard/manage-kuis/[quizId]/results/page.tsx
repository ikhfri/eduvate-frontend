/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  Users,
  Star,
  Trophy,
  Crown,
  ChevronsDown,
  ChevronsUp,
  Download,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { saveAs } from "file-saver";

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
  stats: {
    participantCount: number;
    averageScore: number;
  };
}


const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return isValid(date)
      ? format(date, "dd MMM yyyy, HH:mm", { locale: LocaleID })
      : "Waktu tidak valid";
  } catch {
    return "Waktu tidak valid";
  }
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return "S";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const PodiumCard = ({
  attempt,
  rank,
}: {
  attempt: QuizAttempt;
  rank: number;
}) => {
  const styles = [
    {
      delay: 0,
      borderColor: "border-amber-400",
      bgColor: "bg-amber-400/5",
      shadowColor: "shadow-amber-400/20",
      icon: <Crown className="h-8 w-8 text-amber-400" />,
    },
    {
      delay: 0.1,
      borderColor: "border-slate-400",
      bgColor: "bg-slate-400/5",
      shadowColor: "shadow-slate-400/20",
      icon: <Trophy className="h-7 w-7 text-slate-400" />,
    },
    {
      delay: 0.2,
      borderColor: "border-orange-400",
      bgColor: "bg-orange-400/5",
      shadowColor: "shadow-orange-400/20",
      icon: <Trophy className="h-6 w-6 text-orange-400" />,
    },
  ];
  const style = styles[rank - 1];

  return (
    <motion.div
      className={`relative rounded-2xl p-4 flex flex-col items-center text-center border-2 ${style.borderColor} ${style.bgColor} shadow-lg ${style.shadowColor}`}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ delay: style.delay }}
    >
      <div className="absolute -top-5">{style.icon}</div>
      <Avatar className="w-20 h-20 mt-6 border-4 border-background">
        <AvatarFallback>{getInitials(attempt.student.name)}</AvatarFallback>
      </Avatar>
      <h4 className="font-bold text-lg mt-3">
        {attempt.student.name || "Siswa Anonim"}
      </h4>
      <p className="text-sm text-muted-foreground">{attempt.student.email}</p>
      <p className="text-4xl font-black text-primary mt-2">
        {attempt.score.toFixed(2)}
      </p>
    </motion.div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-72" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
    <Skeleton className="h-28 w-full rounded-2xl" />
    <div className="grid md:grid-cols-3 gap-6">
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  </div>
);

// --- Main Page Component ---
export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);

  const fetchQuizResults = useCallback(async () => {
    if (!quizId || !user) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/quizzes/${quizId}/results`);
      setResultsData(response.data?.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Gagal mengambil data hasil kuis."
      );
    } finally {
      setIsLoading(false);
    }
  }, [quizId, user]);

  useEffect(() => {
    fetchQuizResults();
  }, [fetchQuizResults]);

  const { topThree, remainingAttempts, highestScore } = useMemo(() => {
    const sorted =
      resultsData?.attempts.sort((a, b) => b.score - a.score) ?? [];
    return {
      topThree: sorted.slice(0, 3),
      remainingAttempts: sorted.slice(3),
      highestScore: sorted.length > 0 ? sorted[0].score : 0,
    };
  }, [resultsData]);

  const displayedRemaining = isShowingAll
    ? remainingAttempts
    : remainingAttempts.slice(0, 2);

  const handleExport = async () => {
    setIsExportConfirmOpen(false);
    setIsExporting(true);
    toast({
      title: "Mempersiapkan file...",
      description: "Harap tunggu sebentar.",
    });
    try {
      const response = await axiosInstance.get(`/quizzes/${quizId}/export`, {
        responseType: "blob",
      });
      const contentDisposition = response.headers["content-disposition"];
      let filename = `hasil-kuis-${
        resultsData?.quizTitle.replace(/\s+/g, "-") || quizId
      }.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch?.length === 2) filename = filenameMatch[1];
      }
      saveAs(new Blob([response.data]), filename);
      toast({
        title: "Unduhan Dimulai",
        description: "File Excel Anda sedang diunduh.",
      });
    } catch (err: any) {
      toast({
        title: "Gagal Mengekspor",
        description: "Terjadi kesalahan saat mempersiapkan file.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error || !resultsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Gagal Memuat Hasil</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard/manage-kuis")}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div>
            <Button
              onClick={() => router.push("/dashboard/manage-kuis")}
              variant="ghost"
              size="sm"
              className="mb-2 -ml-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Kembali ke Daftar Kuis
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Hasil Kuis: {resultsData.quizTitle}
            </h1>
          </div>
          <Button
            onClick={() => setIsExportConfirmOpen(true)}
            disabled={isExporting || resultsData.attempts.length === 0}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Ekspor ke Excel
          </Button>
        </motion.div>

        <motion.div
          className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1 },
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-2 opacity-80" />
              <span className="font-bold text-4xl">
                {resultsData.stats.participantCount}
              </span>
              <span className="text-sm opacity-80">Peserta</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Star className="h-6 w-6 mb-2 opacity-80" />
              <span className="font-bold text-4xl">
                {resultsData.stats.averageScore.toFixed(2)}
              </span>
              <span className="text-sm opacity-80">Rata-rata Skor</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Trophy className="h-6 w-6 mb-2 opacity-80" />
              <span className="font-bold text-4xl">
                {highestScore.toFixed(2)}
              </span>
              <span className="text-sm opacity-80">Skor Tertinggi</span>
            </div>
          </div>
        </motion.div>

        {topThree.length > 0 && (
          <motion.div variants={containerVariants}>
            <h3 className="text-2xl font-bold mb-4 text-center">
              🏆 Podium Peringkat Teratas 🏆
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((attempt, index) => (
                <PodiumCard
                  key={attempt.id}
                  attempt={attempt}
                  rank={index + 1}
                />
              ))}
            </div>
          </motion.div>
        )}

        {remainingAttempts.length > 0 && (
          <motion.div
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          >
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Peringkat Lainnya</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">
                      Peringkat
                    </TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Waktu Pengerjaan
                    </TableHead>
                    <TableHead className="text-right">Skor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {displayedRemaining.map((attempt, index) => (
                      <motion.tr
                        key={attempt.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TableCell className="text-center font-semibold text-muted-foreground">
                          {index + 4}
                        </TableCell>
                        <TableCell className="font-medium">
                          {attempt.student.name || "Siswa Anonim"}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">
                          {formatDate(attempt.submittedAt)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {attempt.score.toFixed(2)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
            {remainingAttempts.length > 2 && (
              <div className="p-4 text-center border-t">
                <Button
                  variant="ghost"
                  onClick={() => setIsShowingAll((prev) => !prev)}
                >
                  {isShowingAll ? (
                    <>
                      <ChevronsUp className="mr-2 h-4 w-4" /> Tampilkan Lebih
                      Sedikit
                    </>
                  ) : (
                    <>
                      <ChevronsDown className="mr-2 h-4 w-4" /> Lihat
                      Selengkapnya
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {resultsData.attempts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              Belum ada siswa yang mengerjakan kuis ini.
            </p>
          </div>
        )}
      </motion.div>

      {/* Dialog Konfirmasi Ekspor */}
      <AlertDialog
        open={isExportConfirmOpen}
        onOpenChange={setIsExportConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Ekspor</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengunduh hasil kuis ini sebagai file Excel (XLSX).
              Apakah Anda ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
