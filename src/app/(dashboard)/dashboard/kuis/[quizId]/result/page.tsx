/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Loader2,
  AlertCircle,
  Award,
  ChevronLeft,
  Check,
  X,
  HelpCircle,
  User,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import Image from "next/image";

interface OptionType {
  text: string;
  isCorrect: boolean;
}
interface QuestionType {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
  imageUrl?: string | null;
  options: OptionType[];
}
interface AnswerType {
  isCorrect: boolean;
  selectedOptionIndex?: number | null;
  answerText?: string | null;
  question: QuestionType;
}
interface QuizAttemptResult {
  id: string;
  score: number;
  submittedAt: string;
  quiz: { title: string };
  answers: AnswerType[];
}

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return "Tanggal tidak valid";
    return format(date, "dd MMMM yyyy, HH:mm 'WIB'", { locale: LocaleID });
  } catch (error) {
    return "Error format tanggal";
  }
};

const getScoreTheme = (score: number) => {
  if (score >= 80)
    return {
      gradient: "from-green-500 to-teal-600",
      message: "Luar Biasa!",
      icon: <Award className="h-24 w-24 text-white/80" />,
    };
  if (score >= 60)
    return {
      gradient: "from-amber-500 to-orange-500",
      message: "Bagus, Terus Tingkatkan!",
      icon: <Award className="h-24 w-24 text-white/80" />,
    };
  return {
    gradient: "from-red-500 to-rose-600",
    message: "Jangan Menyerah, Coba Lagi!",
    icon: <HelpCircle className="h-24 w-24 text-white/80" />,
  };
};

const AnswerReviewCard = ({
  answer,
  index,
}: {
  answer: AnswerType;
  index: number;
}) => {
  const { question } = answer;
  if (!question) return null;
  const studentAnswerText =
    question.type === "ESSAY"
      ? answer.answerText
      : answer.selectedOptionIndex !== null &&
        answer.selectedOptionIndex !== undefined
      ? question.options[answer.selectedOptionIndex]?.text
      : null;
  const correctAnswerOption = question.options.find(
    (opt: OptionType) => opt.isCorrect
  );

  const getStatusBadge = () => {
    let text = "",
      style = "";
    if (answer.isCorrect) {
      text = "Benar";
      style =
        "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    } else if (question.type === "ESSAY") {
      text = "Perlu Dinilai";
      style =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
    } else {
      text = "Salah";
      style = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    }
    return (
      <div
        className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${style}`}
      >
        {text}
      </div>
    );
  };

  return (
    <div
      className={`bg-card border rounded-lg shadow-md overflow-hidden border-l-4 ${
        answer.isCorrect ? "border-l-green-500" : "border-l-red-500"
      }`}
    >
      <div className="p-5 border-b border-border">
        <div className="flex justify-between items-start gap-4">
          <p className="flex-1 font-semibold text-foreground">
            {index + 1}. {question.text}
          </p>
          {getStatusBadge()}
        </div>
      </div>
      <div className="p-5 space-y-4 bg-secondary/30">
        {question.imageUrl && (
          <div className="my-2 rounded-lg overflow-hidden border border-border">
            <Image
              src={question.imageUrl}
              width={700}
              height={400}
              alt={`Gambar untuk pertanyaan ${index + 1}`}
              className="w-full h-auto max-h-80 object-contain bg-background"
              unoptimized
            />
          </div>
        )}
        <div className="flex items-start gap-3 p-3 bg-background rounded-md">
          <User className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm text-muted-foreground">
              Jawaban Anda:
            </p>
            <p
              className={`mt-1 font-medium ${
                !answer.isCorrect && "text-destructive"
              }`}
            >
              {studentAnswerText || (
                <span className="italic text-muted-foreground">
                  Tidak dijawab
                </span>
              )}
            </p>
          </div>
        </div>
        {!answer.isCorrect &&
          (question.type === "MULTIPLE_CHOICE" ||
            question.type === "TRUE_FALSE") && (
            <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-700 dark:text-green-300/80">
                  Jawaban Benar:
                </p>
                <p className="mt-1 font-medium text-green-800 dark:text-green-200">
                  {correctAnswerOption?.text || "Kunci jawaban tidak tersedia."}
                </p>
              </div>
            </div>
          )}
        {(question.type === "MULTIPLE_CHOICE" ||
          question.type === "TRUE_FALSE") &&
          Array.isArray(question.options) && (
            <div className="pt-2">
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                Semua Pilihan:
              </p>
              <div className="space-y-2">
                {question.options.map(
                  (option: OptionType, optIndex: number) => {
                    const isUserAnswer =
                      optIndex === answer.selectedOptionIndex;
                    return (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-3 text-sm p-2 rounded-md ${
                          option.isCorrect ? "bg-green-500/10" : ""
                        } ${
                          isUserAnswer && !option.isCorrect
                            ? "bg-red-500/10"
                            : ""
                        }`}
                      >
                        {option.isCorrect ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : isUserAnswer ? (
                          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span
                          className={`${
                            option.isCorrect
                              ? "font-bold text-green-700 dark:text-green-300"
                              : isUserAnswer
                              ? "font-medium text-red-700 dark:text-red-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {option.text}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default function StudentQuizResultPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttemptResult = useCallback(async () => {
    if (!quizId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/quizzes/${quizId}/attempt`);
      setAttemptResult(response.data?.data || response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal mengambil hasil kuis.";
      setError(errorMessage);
      toast({
        title: "Gagal Mengambil Hasil",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, user, toast]);

  useEffect(() => {
    if (quizId && user) fetchAttemptResult();
  }, [fetchAttemptResult, quizId, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat hasil kuis...</p>
      </div>
    );
  }

  if (error || !attemptResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Gagal Memuat Hasil</h2>
        <p className="text-muted-foreground mb-4">
          {error || "Data hasil kuis tidak ditemukan."}
        </p>
        <button
          onClick={() => router.push("/dashboard/kuis")}
          className="inline-flex items-center gap-2 px-4 py-2 font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Daftar Kuis
        </button>
      </div>
    );
  }

  const correctCount = attemptResult.answers.filter((a) => a.isCorrect).length;
  const totalQuestions = attemptResult.answers.length;
  const theme = getScoreTheme(attemptResult.score);

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "MENTOR"]}>
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        <button
          onClick={() => router.push("/dashboard/kuis")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Daftar Kuis
        </button>

        <div
          className={`relative p-8 rounded-2xl shadow-xl text-white overflow-hidden bg-gradient-to-br ${theme.gradient}`}
        >
          <div className="absolute -right-10 -bottom-10 opacity-10">
            {React.cloneElement(theme.icon, { className: "h-48 w-48" })}
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold">{theme.message}</h1>
            <p className="mt-1 text-white/80">
              Hasil Kuis: {attemptResult.quiz.title}
            </p>
            <p className="mt-1 text-xs text-white/60">
              Diselesaikan pada: {formatDateSafe(attemptResult.submittedAt)}
            </p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-semibold text-white/80">
                  Skor Akhir
                </p>
                <p className="text-4xl font-bold">
                  {attemptResult.score.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-semibold text-white/80">
                  Jawaban Benar
                </p>
                <p className="text-4xl font-bold">{correctCount}</p>
              </div>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-semibold text-white/80">
                  Jawaban Salah
                </p>
                <p className="text-4xl font-bold">
                  {totalQuestions - correctCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            Rincian Jawaban
          </h2>
          {attemptResult.answers.map((answer, index) => (
            <AnswerReviewCard
              key={answer.question.id}
              answer={answer}
              index={index}
            />
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
