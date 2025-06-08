/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/manage-kuis/[quizId]/edit/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatISO, parseISO, isValid, format } from "date-fns";

// Interface diperbarui untuk menyertakan durasi
interface QuizFormData {
  title: string;
  description: string;
  duration: string; // Durasi dalam menit
  deadline: string;
  submissionStartDate: string;
}

// Fungsi untuk memformat ISO string ke format yyyy-MM-DDTHH:mm
const formatDateTimeLocal = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return "";
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error("Error formatting date for input:", isoString, error);
    return "";
  }
};

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<QuizFormData>({
    title: "",
    description: "",
    duration: "60",
    deadline: "",
    submissionStartDate: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  const fetchQuizDetails = useCallback(
    async (id: string) => {
      setIsFetchingData(true);
      setError(null);
      setNotFound(false);
      try {
        const response = await axiosInstance.get(`/quizzes/${quizId}`);
        const quizData = response.data?.data || response.data;

        if (!quizData) {
          setNotFound(true);
          setError("Data kuis tidak ditemukan.");
          return;
        }

        setFormData({
          title: quizData.title || "",
          description: quizData.description || "",
          duration: String(quizData.duration || "60"), // Ambil durasi dari backend
          deadline: formatDateTimeLocal(quizData.deadline),
          submissionStartDate: formatDateTimeLocal(
            quizData.submissionStartDate
          ),
        });
      } catch (err: any) {
        console.error("Gagal mengambil detail kuis:", err);
        setError(err.response?.data?.message || "Gagal memuat data kuis.");
        setNotFound(true);
      } finally {
        setIsFetchingData(false);
      }
    },
    [quizId]
  );

  useEffect(() => {
    if (quizId && user) {
      fetchQuizDetails(quizId);
    }
  }, [quizId, user, fetchQuizDetails]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const durationValue = parseInt(formData.duration, 10);
    if (
      !formData.title ||
      !formData.deadline ||
      isNaN(durationValue) ||
      durationValue <= 0
    ) {
      setError(
        "Judul, Durasi (> 0), dan Tenggat Waktu (Deadline) wajib diisi."
      );
      toast({
        title: "Input Tidak Lengkap",
        description: "Judul, durasi, dan tenggat waktu wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    try {
      const deadlineDate = new Date(formData.deadline);
      const submissionStartDateParsed = formData.submissionStartDate
        ? new Date(formData.submissionStartDate)
        : null;

      if (
        submissionStartDateParsed &&
        deadlineDate <= submissionStartDateParsed
      ) {
        throw new Error(
          "Tenggat Waktu harus setelah Tanggal Mulai Pengumpulan."
        );
      }

      const payload = {
        title: formData.title,
        description: formData.description || null,
        duration: durationValue,
        deadline: formatISO(deadlineDate),
        submissionStartDate: submissionStartDateParsed
          ? formatISO(submissionStartDateParsed)
          : null,
      };

      setIsLoading(true);
      await axiosInstance.put(`/quizzes/${quizId}`, payload);

      toast({
        title: "Kuis Berhasil Diperbarui",
        description: `Kuis "${formData.title}" telah disimpan.`,
      });
      router.push("/dashboard/manage-kuis");
    } catch (err: any) {
      console.error("Gagal memperbarui kuis:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat memperbarui kuis.";
      setError(errorMessage);
      toast({
        title: "Update Kuis Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat data kuis...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Kuis Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard/manage-kuis")}>
          Kembali ke Kelola Kuis
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-6 max-w-3xl mx-auto p-4 md:p-0">
        <Button
          onClick={() => router.push("/dashboard/manage-kuis")}
          variant="outline"
          size="sm"
          className="inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Kelola Kuis
        </Button>

        <Card className="shadow-lg border-border rounded-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Save className="w-7 h-7 mr-3 text-primary" />
              Edit Kuis: {formData.title || "Memuat..."}
            </CardTitle>
            <CardDescription>
              Perbarui detail kuis di bawah ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && !isLoading && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <Label
                  htmlFor="title"
                  className="block text-sm font-medium mb-1"
                >
                  Judul Kuis <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="rounded-md"
                />
              </div>
              <div>
                <Label
                  htmlFor="description"
                  className="block text-sm font-medium mb-1"
                >
                  Deskripsi Kuis (Opsional)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="rounded-md"
                />
              </div>
              <div>
                <Label
                  htmlFor="duration"
                  className="block text-sm font-medium mb-1"
                >
                  Durasi (menit) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  className="rounded-md"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="submissionStartDate"
                    className="block text-sm font-medium mb-1"
                  >
                    Tanggal Mulai (Opsional)
                  </Label>
                  <Input
                    id="submissionStartDate"
                    name="submissionStartDate"
                    type="datetime-local"
                    value={formData.submissionStartDate}
                    onChange={handleChange}
                    className="rounded-md"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="deadline"
                    className="block text-sm font-medium mb-1"
                  >
                    Tenggat Waktu (Deadline){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                    className="rounded-md"
                  />
                </div>
              </div>
              <CardFooter className="px-0 pt-8 flex justify-end">
                <Button
                  type="submit"
                  className="w-full sm:w-auto rounded-md"
                  disabled={isLoading || authLoading || isFetchingData}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
