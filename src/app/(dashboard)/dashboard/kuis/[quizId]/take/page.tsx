// app/(dashboard)/dashboard/kuis/[quizId]/take/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  EyeOff,
  Map as MapIcon,
  Send,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useTabMonitor } from "@/hooks/useTabMonitor";
import { cn } from "@/lib/utils";

// Interface for questions
interface QuestionToTake {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
  options?: { text: string }[] | string;
  imageUrl?: string | null;
}

// Interface for the quiz
interface QuizToTake {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  questions: QuestionToTake[];
}

// Interface for student answers
interface StudentAnswer {
  questionId: string;
  answer: string;
}

const VISIBILITY_CHANGE_LIMIT = 5;

// Updated QuestionMap Component
const QuestionMap = ({
  totalQuestions,
  currentQuestionIndex,
  answers,
  questions,
  onSelectQuestion,
}: {
  totalQuestions: number;
  currentQuestionIndex: number;
  answers: Map<string, StudentAnswer>;
  questions: QuestionToTake[];
  onSelectQuestion: (index: number) => void;
}) => (
  <Card className="shadow-lg bg-white dark:bg-gray-800">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <MapIcon className="h-5 w-5" />
        Navigasi Soal
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-2 p-4">
      {Array.from({ length: totalQuestions }).map((_, index) => {
        const questionId = questions[index]?.id;
        const isAnswered =
          answers.has(questionId) &&
          answers.get(questionId)?.answer.trim() !== "";
        const isCurrent = index === currentQuestionIndex;

        return (
          <Button
            key={index}
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-md font-bold transition-all duration-200",
              isCurrent &&
                "bg-primary text-primary-foreground ring-2 ring-primary/80 ring-offset-2 ring-offset-background",
              !isCurrent &&
                isAnswered &&
                "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-200/80",
              !isCurrent && !isAnswered && "bg-card hover:bg-muted"
            )}
            onClick={() => onSelectQuestion(index)}
          >
            {index + 1}
          </Button>
        );
      })}
    </CardContent>
  </Card>
);

// New Component for the Information Panel
const QuizInfoPanel = ({
  timeLeft,
  formatTime,
  violationCount,
  totalQuestions,
  currentQuestionIndex,
  answers,
  questions,
  onSelectQuestion,
}: {
  timeLeft: number | null;
  formatTime: (seconds: number) => string;
  violationCount: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  answers: Map<string, StudentAnswer>;
  questions: QuestionToTake[];
  onSelectQuestion: (index: number) => void;
}) => (
  <aside className="space-y-6">
    <Card className="shadow-lg bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg">Informasi Kuis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeLeft !== null && (
          <div
            className={cn(
              "flex items-center justify-between gap-2 p-3 rounded-lg font-semibold text-lg",
              timeLeft > 60
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 animate-pulse"
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Sisa Waktu</span>
            </div>
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-semibold">
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            <span>Pelanggaran</span>
          </div>
          <span>
            {violationCount} / {VISIBILITY_CHANGE_LIMIT}
          </span>
        </div>
      </CardContent>
    </Card>
    <QuestionMap
      totalQuestions={totalQuestions}
      currentQuestionIndex={currentQuestionIndex}
      answers={answers}
      questions={questions}
      onSelectQuestion={onSelectQuestion}
    />
  </aside>
);

export default function TakeQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [quizData, setQuizData] = useState<QuizToTake | null>(null);
  const [answers, setAnswers] = useState<Map<string, StudentAnswer>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  const currentQuestion = useMemo(() => {
    if (!quizData || quizData.questions.length === 0) return null;
    return quizData.questions[currentQuestionIndex];
  }, [quizData, currentQuestionIndex]);

  const getParsedOptions = (
    options: QuestionToTake["options"]
  ): { text: string }[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to parse options string:", options, e);
        return [];
      }
    }
    return [];
  };

  const handleSubmitQuiz = useCallback(
    async (
      isAutoSubmit = false,
      reason = "Jawaban Anda telah berhasil dikirim."
    ) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setShowSubmitConfirm(false);

      if (!quizData) {
        toast({
          title: "Error",
          description: "Data kuis tidak ditemukan.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const formattedAnswers = Array.from(answers.values())
          .map((studentAnswer) => {
            const question = quizData.questions.find(
              (q) => q.id === studentAnswer.questionId
            );
            if (!question) return null;
            if (
              question.type === "MULTIPLE_CHOICE" ||
              question.type === "TRUE_FALSE"
            ) {
              // For TRUE_FALSE, the options might not be in the question object itself
              const options =
                question.type === "TRUE_FALSE"
                  ? [{ text: "Benar" }, { text: "Salah" }]
                  : getParsedOptions(question.options);

              const selectedIndex = options.findIndex(
                (opt) => opt.text === studentAnswer.answer
              );

              return {
                questionId: studentAnswer.questionId,
                selectedOptionIndex:
                  selectedIndex !== -1 ? selectedIndex : null,
              };
            } else if (question.type === "ESSAY") {
              return {
                questionId: studentAnswer.questionId,
                answerText: studentAnswer.answer,
              };
            }
            return null;
          })
          .filter(Boolean);

        const submissionPayload = { answers: formattedAnswers };
        await axiosInstance.post(
          `/quizzes/${quizId}/attempt`,
          submissionPayload
        );

        toast({
          title: isAutoSubmit
            ? "Kuis Dikirim Otomatis!"
            : "Kuis Telah Diserahkan",
          description: reason,
          variant: isAutoSubmit ? "destructive" : "default",
          duration: 5000,
        });

        router.replace(`/dashboard/kuis/${quizId}/result`);
      } catch (err: any) {
        toast({
          title: "Gagal Mengirim Jawaban",
          description:
            err.response?.data?.message || "Terjadi kesalahan server.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    },
    [answers, quizData, quizId, router, toast, isSubmitting]
  );

  const handleViolation = useCallback(
    (count: number) => {
      if (isSubmitting || timeLeft === 0) return;
      setViolationCount(count);
      toast({
        title: `Peringatan Pelanggaran ke-${count}`,
        description: `Anda telah meninggalkan halaman kuis. Batas: ${VISIBILITY_CHANGE_LIMIT} kali.`,
        variant: "destructive",
      });
    },
    [isSubmitting, timeLeft, toast]
  );

  const handleLimitReached = useCallback(() => {
    handleSubmitQuiz(true, "Batas pelanggaran telah tercapai.");
  }, [handleSubmitQuiz]);

  useTabMonitor(handleLimitReached, VISIBILITY_CHANGE_LIMIT, handleViolation);

  useEffect(() => {
    if (quizData && quizData.duration && timeLeft === null) {
      setTimeLeft(quizData.duration * 60);
    }
  }, [quizData, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmitQuiz(true, "Waktu habis, jawaban Anda dikirim otomatis.");
      return;
    }
    if (!timeLeft || isSubmitting) return;
    const intervalId = setInterval(
      () => setTimeLeft((prev) => (prev ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(intervalId);
  }, [timeLeft, isSubmitting, handleSubmitQuiz]);

  const fetchQuiz = useCallback(async () => {
    if (!quizId || !user) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/quizzes/${quizId}/take`);
      setQuizData(response.data?.data || response.data);
    } catch (err: any) {
      if (
        err.response?.status === 403 &&
        err.response?.data?.message?.includes("sudah pernah mengerjakan")
      ) {
        setAlreadyTaken(true);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Tidak dapat memuat kuis.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [quizId, user]);

  useEffect(() => {
    if (authLoading === false) {
      fetchQuiz();
    }
  }, [fetchQuiz, authLoading]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => new Map(prev).set(questionId, { questionId, answer }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const questionOptions = currentQuestion
    ? getParsedOptions(currentQuestion.options)
    : [];

  const unansweredQuestionNumbers = useMemo(() => {
    if (!quizData) return [];
    return quizData.questions
      .map((q, index) => {
        const answerObj = answers.get(q.id);
        if (!answerObj || !answerObj.answer || answerObj.answer.trim() === "") {
          return index + 1;
        }
        return null;
      })
      .filter((qNumber): qNumber is number => qNumber !== null);
  }, [answers, quizData]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">
          Mempersiapkan kuis untuk Anda...
        </p>
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Kuis Telah Diselesaikan</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          {error ||
            "Anda sudah pernah mengerjakan dan mengirimkan jawaban untuk kuis ini."}
        </p>
        <div className="flex gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/kuis")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Kuis
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/kuis/${quizId}/result`)}
          >
            Lihat Hasil Anda <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Gagal Memuat Kuis</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard/kuis")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Kuis
        </Button>
      </div>
    );
  }

  const totalQuestions = quizData.questions.length;
  const answeredCount = totalQuestions - unansweredQuestionNumbers.length;
  const progressPercentage =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {quizData.title}
          </h1>
          <p className="text-muted-foreground mt-1">{quizData.description}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <main className="lg:col-span-2 xl:col-span-3">
            <Card className="w-full mx-auto shadow-xl bg-white dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="border-b dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground bg-primary/10 px-2 py-1 rounded-md">
                    {currentQuestion?.type?.replace("_", " ") || "Pertanyaan"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                {currentQuestion?.imageUrl && (
                  <div className="mb-6 rounded-lg overflow-hidden border dark:border-gray-600">
                    <Image
                      src={currentQuestion.imageUrl}
                      alt={`Gambar untuk pertanyaan ${
                        currentQuestionIndex + 1
                      }`}
                      width={800}
                      height={450}
                      className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
                      unoptimized
                    />
                  </div>
                )}
                <p className="font-semibold text-lg md:text-xl mb-6">
                  {currentQuestion?.text}
                </p>
                {currentQuestion && (
                  <div className="space-y-4">
                    {currentQuestion.type === "MULTIPLE_CHOICE" && (
                      <RadioGroup
                        value={answers.get(currentQuestion.id)?.answer}
                        onValueChange={(value) =>
                          handleAnswerChange(currentQuestion.id, value)
                        }
                        className="space-y-3"
                      >
                        {questionOptions.map((option, index) => {
                          const uniqueId = `q${currentQuestion.id}-opt${index}`;
                          const isChecked =
                            answers.get(currentQuestion.id)?.answer ===
                            option.text;
                          return (
                            <Label
                              key={uniqueId}
                              htmlFor={uniqueId}
                              className={cn(
                                "flex items-center p-4 border-2 rounded-lg transition-all cursor-pointer",
                                isChecked
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                              )}
                            >
                              <RadioGroupItem
                                value={option.text}
                                id={uniqueId}
                                className="h-5 w-5"
                              />
                              <span className="ml-4 cursor-pointer flex-grow text-base">
                                {option.text}
                              </span>
                              {isChecked && (
                                <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                              )}
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    )}
                    {currentQuestion.type === "TRUE_FALSE" && (
                      <RadioGroup
                        value={answers.get(currentQuestion.id)?.answer}
                        onValueChange={(value) =>
                          handleAnswerChange(currentQuestion.id, value)
                        }
                        className="space-y-3"
                      >
                        {["Benar", "Salah"].map((optionText, index) => {
                          const uniqueId = `q${currentQuestion.id}-opt-${index}`;
                          const isChecked =
                            answers.get(currentQuestion.id)?.answer ===
                            optionText;
                          return (
                            <Label
                              key={uniqueId}
                              htmlFor={uniqueId}
                              className={cn(
                                "flex items-center p-4 border-2 rounded-lg transition-all cursor-pointer",
                                isChecked
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                              )}
                            >
                              <RadioGroupItem
                                value={optionText}
                                id={uniqueId}
                                className="h-5 w-5"
                              />
                              <span className="ml-4 cursor-pointer flex-grow text-base">
                                {optionText}
                              </span>
                              {isChecked && (
                                <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                              )}
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    )}
                    {currentQuestion.type === "ESSAY" && (
                      <Textarea
                        placeholder="Ketik jawaban Anda di sini..."
                        rows={8}
                        className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-base focus:ring-primary"
                        value={answers.get(currentQuestion.id)?.answer || ""}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestion.id, e.target.value)
                        }
                      />
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between p-6 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  disabled={currentQuestionIndex === 0 || isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Sebelumnya
                </Button>
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    disabled={isSubmitting}
                  >
                    Selanjutnya <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Kirim Jawaban
                  </Button>
                )}
              </CardFooter>
            </Card>
          </main>

          <div className="relative">
            <div className="lg:sticky lg:top-24">
              <QuizInfoPanel
                timeLeft={timeLeft}
                formatTime={formatTime}
                violationCount={violationCount}
                totalQuestions={totalQuestions}
                currentQuestionIndex={currentQuestionIndex}
                answers={answers}
                questions={quizData.questions}
                onSelectQuestion={setCurrentQuestionIndex}
              />
            </div>
          </div>
        </div>

        <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100 flex items-center gap-2">
                {unansweredQuestionNumbers.length > 0 ? (
                  <HelpCircle className="text-amber-500" />
                ) : (
                  <CheckCircle className="text-green-500" />
                )}
                Konfirmasi Pengiriman Kuis
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 pt-2">
                {unansweredQuestionNumbers.length > 0 ? (
                  <>
                    Anda akan mengirimkan jawaban, namun ada
                    <span className="font-bold text-destructive px-1">
                      {unansweredQuestionNumbers.length}
                    </span>
                    soal yang belum terjawab (No.{" "}
                    {unansweredQuestionNumbers.join(", ")}).
                    <br />
                    <br />
                    Apakah Anda tetap yakin ingin menyelesaikan dan mengirim
                    jawaban sekarang?
                  </>
                ) : (
                  <>
                    Anda telah menjawab semua pertanyaan. Apakah Anda yakin
                    ingin menyelesaikan dan mengirim jawaban Anda sekarang?
                  </>
                )}
                <br />
                Aksi ini tidak dapat diurungkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Batal
                </Button>
              </DialogClose>
              <Button
                onClick={() => handleSubmitQuiz(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ya, Kirim Jawaban Saya
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
