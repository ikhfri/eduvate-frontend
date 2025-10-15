// app/(dashboard)/dashboard/kuis/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Loader2,
  AlertCircle,
  BookOpenCheck,
  ArrowRight,
  CalendarClock,
  Timer,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid, isFuture } from "date-fns";
import { id as LocaleID } from "date-fns/locale";

interface AvailableQuiz {
  id: string;
  title: string;
  description?: string | null;
  deadline: string;
  submissionStartDate?: string | null;
}

const formatDateSafe = (
  dateString: string | null | undefined,
  formatString: string = "dd MMMM yyyy, HH:mm"
): string => {
  if (!dateString) return "Tidak ditentukan";
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Tanggal tidak valid";
    return format(date, formatString, { locale: LocaleID });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Error format tanggal";
  }
};

const QuizCard = ({
  quiz,
  isLocked,
}: {
  quiz: AvailableQuiz;
  isLocked: boolean | null;
}) => {
  const router = useRouter();
  const handleTakeQuiz = (quizId: string) => {
    router.push(`/dashboard/kuis/${quizId}/take`);
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-lg border border-border flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5">
      <div className="p-5 bg-gradient-to-br from-teal-600 to-green-700 text-white relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold line-clamp-2 leading-tight drop-shadow-sm">
            {quiz.title}
          </h3>
          {quiz.description && (
            <p className="mt-1 text-xs text-white/80 line-clamp-2">
              {quiz.description}
            </p>
          )}
        </div>
      </div>

      {/* Konten Kartu */}
      <div className="p-5 flex-grow space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <span className="font-semibold text-foreground">
              Tenggat Waktu:
            </span>
            <p className="text-muted-foreground">
              {formatDateSafe(quiz.deadline)}
            </p>
          </div>
        </div>
        {quiz.submissionStartDate && (
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground">
                Dibuka Mulai:
              </span>
              <p className="text-muted-foreground">
                {formatDateSafe(quiz.submissionStartDate)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-secondary/30 mt-auto">
        <button
          onClick={() => handleTakeQuiz(quiz.id)}
          disabled={isLocked ?? false}
          className={`w-full inline-flex items-center justify-center px-4 py-2.5 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary
                        ${
                          isLocked
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
        >
          {isLocked ? "Belum Dimulai" : "Kerjakan Kuis"}
          {!isLocked && <ArrowRight className="ml-2 h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default function StudentAvailableQuizzesPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [availableQuizzes, setAvailableQuizzes] = useState<AvailableQuiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableQuizzes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/questions");
      setAvailableQuizzes(response.data?.data || response.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Terjadi kesalahan.";
      setError(errorMessage);
      toast({
        title: "Gagal Mengambil Kuis",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) fetchAvailableQuizzes();
  }, [user, fetchAvailableQuizzes]);

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat daftar kuis...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "MENTOR"]}>
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        <div className="relative p-8 rounded-2xl shadow-lg bg-gradient-to-br from-teal-500 to-green-600 text-white overflow-hidden">
          <BookOpenCheck className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold">Kuis Tersedia</h1>
            <p className="mt-2 text-white/80 max-w-lg">
              Pilih kuis di bawah ini untuk menguji pemahaman Anda.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Gagal memuat data kuis.</p>
              <p className="text-sm opacity-90">{error}</p>
              <button
                className="mt-2 text-sm font-semibold hover:underline"
                onClick={fetchAvailableQuizzes}
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {!isLoading && availableQuizzes.length === 0 && !error && (
          <div className="text-center p-16 bg-card rounded-xl border-2 border-dashed border-border">
            <Info className="mx-auto h-16 w-16 text-primary/50 mb-4" />
            <h3 className="text-2xl font-semibold text-foreground">
              Belum Ada Kuis
            </h3>
            <p className="mt-2 text-muted-foreground">
              Saat ini tidak ada kuis yang tersedia untuk Anda.
            </p>
          </div>
        )}

        {availableQuizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableQuizzes.map((quiz) => {
              const startDate = quiz.submissionStartDate
                ? parseISO(quiz.submissionStartDate)
                : null;
              const isLocked = startDate && isFuture(startDate);

              return <QuizCard key={quiz.id} quiz={quiz} isLocked={isLocked} />;
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
