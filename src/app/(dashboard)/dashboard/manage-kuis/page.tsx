/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Loader2,
  PlusCircle,
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  AlertCircle,
  FileQuestion,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { id as SLocale } from "date-fns/locale";

// Interface for quiz data
interface Quiz {
  id: string;
  title: string;
  deadline: string;
  submissionStartDate?: string | null;
  author?: {
    name?: string;
  };
}

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return "N/A";
  }
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Tanggal tidak valid";
    }
    return format(date, "dd MMM yyyy, HH:mm", { locale: SLocale });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Error format tanggal";
  }
};

const ActionMenu = ({
  quiz,
  onDelete,
}: {
  quiz: Quiz;
  onDelete: (id: string, title: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const createClickHandler = (path: string) => () => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-accent transition-colors"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-10 animate-in fade-in-0 zoom-in-95">
          <div className="p-1">
            <button
              onClick={createClickHandler(
                `/dashboard/manage-kuis/${quiz.id}/questions`
              )}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <FileQuestion className="h-4 w-4" /> Kelola Pertanyaan
            </button>
            <button
              onClick={createClickHandler(
                `/dashboard/manage-kuis/${quiz.id}/edit`
              )}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <Edit3 className="h-4 w-4" /> Edit Kuis
            </button>
            <button
              onClick={createClickHandler(
                `/dashboard/manage-kuis/${quiz.id}/submissions`
              )}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <Users className="h-4 w-4" /> Lihat Pengumpulan
            </button>
            <button
              onClick={createClickHandler(
                `/dashboard/manage-kuis/${quiz.id}/results`
              )}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <Eye className="h-4 w-4" /> Lihat Hasil
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => {
                onDelete(quiz.id, quiz.title);
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Hapus Kuis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ManageQuizzesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/quizzes");
      setQuizzes(response.data?.data || response.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Terjadi kesalahan saat mengambil data kuis.";
      setError(errorMessage);
      toast({
        title: "Gagal Mengambil Kuis",
        description: errorMessage,
        variant: "destructive",
      });
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user, fetchQuizzes]);

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus kuis "${quizTitle}"? Aksi ini tidak dapat diurungkan.`
      )
    ) {
      return;
    }
    try {
      await axiosInstance.delete(`/quizzes/${quizId}`);
      toast({
        title: "Kuis Dihapus",
        description: `Kuis "${quizTitle}" berhasil dihapus.`,
      });
      fetchQuizzes();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal menghapus kuis.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (authLoading || (isLoading && quizzes.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat data kuis...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="relative p-6 md:p-8 rounded-2xl shadow-lg bg-gradient-to-br from-teal-500 to-green-600 text-white overflow-hidden">
          <FileQuestion className="absolute -right-8 -bottom-8 h-32 w-32 sm:h-48 sm:w-48 text-white/10" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Kelola Kuis</h1>
              <p className="mt-2 text-white/80 max-w-lg">
                Buat, edit, atau hapus kuis untuk menguji pemahaman siswa.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/manage-kuis/new")}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 font-semibold bg-white/90 text-teal-700 rounded-lg shadow-sm hover:bg-white transition-colors flex-shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              Buat Kuis Baru
            </button>
          </div>
        </div>

        {error && !isLoading && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Gagal memuat data kuis.</p>
              <p className="text-sm opacity-90">{error}</p>
              <button
                className="mt-2 text-sm font-semibold hover:underline"
                onClick={fetchQuizzes}
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl shadow-lg">
          <div className="p-5 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">Daftar Kuis</h2>
            <p className="text-muted-foreground text-sm">
              Total {quizzes.length} kuis ditemukan.
            </p>
          </div>

          {isLoading && quizzes.length > 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin inline-block" />
            </div>
          )}

          {!isLoading && quizzes.length === 0 && !error ? (
            <div className="text-center py-16 px-6">
              <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">
                Belum Ada Kuis
              </h3>
              <p className="text-muted-foreground mt-1">
                Klik tombol Buat Kuis Baru untuk memulai.
              </p>
            </div>
          ) : quizzes.length > 0 ? (
            <div className="md:hidden p-4 space-y-4">
              {/* --- Mobile View: Card List --- */}
              {quizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="bg-secondary/30 rounded-lg border p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-foreground pr-2">
                      {quiz.title}
                    </h3>
                    <ActionMenu quiz={quiz} onDelete={handleDeleteQuiz} />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">No:</span>
                      <span>{index + 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Dibuka:</span>
                      <span>{formatDateSafe(quiz.submissionStartDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tenggat:</span>
                      <span>{formatDateSafe(quiz.deadline)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Pembuat:</span>
                      <span>{quiz.author?.name || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {quizzes.length > 0 ? (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-4 text-left font-semibold text-muted-foreground w-12">
                      No.
                    </th>
                    <th className="p-4 text-left font-semibold text-muted-foreground">
                      Judul Kuis
                    </th>
                    <th className="p-4 text-left font-semibold text-muted-foreground">
                      Dibuka
                    </th>
                    <th className="p-4 text-left font-semibold text-muted-foreground">
                      Tenggat
                    </th>
                    <th className="p-4 text-left font-semibold text-muted-foreground">
                      Pembuat
                    </th>
                    <th className="p-4 text-right font-semibold text-muted-foreground w-20">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz, index) => (
                    <tr
                      key={quiz.id}
                      className="border-b border-border last:border-b-0 hover:bg-accent transition-colors"
                    >
                      <td className="p-4 text-muted-foreground">{index + 1}</td>
                      <td className="p-4 font-medium text-foreground">
                        {quiz.title}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatDateSafe(quiz.submissionStartDate)}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatDateSafe(quiz.deadline)}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {quiz.author?.name || "-"}
                      </td>
                      <td className="p-4 text-right">
                        <ActionMenu quiz={quiz} onDelete={handleDeleteQuiz} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
