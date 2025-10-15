/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import {
  Loader2,
  AlertTriangle,
  PlusCircle,
  ArrowLeft,
  ListChecks,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatISO, parse, isValid } from "date-fns";

interface NewQuizFormState {
  title: string;
  description: string;
  duration: string; 
  deadline: string;
  submissionStartDate: string;
}

export default function CreateNewQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<NewQuizFormState>({
    title: "",
    description: "",
    duration: "60", 
    deadline: "",
    submissionStartDate: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (
    name: "deadline" | "submissionStartDate",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!user || !user.id) {
      setError("Pengguna tidak terautentikasi. Silakan login kembali.");
      toast({
        title: "Autentikasi Gagal",
        description:
          "Pengguna tidak ditemukan. Sesi Anda mungkin telah berakhir.",
        variant: "destructive",
      });
      return;
    }

    const durationValue = parseInt(formData.duration, 10);
    if (
      !formData.title ||
      !formData.deadline ||
      isNaN(durationValue) ||
      durationValue <= 0
    ) {
      const message =
        "Judul, Durasi (> 0), dan Tenggat Waktu (Deadline) wajib diisi.";
      setError(message);
      toast({
        title: "Input Tidak Lengkap",
        description: message,
        variant: "destructive",
      });
      return;
    }

    let isoDeadline: string | undefined = undefined;
    let isoSubmissionStartDate: string | undefined = undefined;

    try {
      const deadlineDate = parse(
        formData.deadline,
        "yyyy-MM-dd'T'HH:mm",
        new Date()
      );
      if (!isValid(deadlineDate)) {
        throw new Error("Format Tenggat Waktu (Deadline) tidak valid.");
      }
      isoDeadline = formatISO(deadlineDate);

      if (formData.submissionStartDate) {
        const submissionStartDateParsed = parse(
          formData.submissionStartDate,
          "yyyy-MM-dd'T'HH:mm",
          new Date()
        );
        if (!isValid(submissionStartDateParsed)) {
          throw new Error("Format Tanggal Mulai Pengumpulan tidak valid.");
        }
        isoSubmissionStartDate = formatISO(submissionStartDateParsed);
        if (deadlineDate <= submissionStartDateParsed) {
          throw new Error(
            "Tenggat Waktu (Deadline) harus setelah Tanggal Mulai Pengumpulan."
          );
        }
      }
    } catch (e: any) {
      setError(e.message || "Format tanggal atau waktu tidak valid.");
      toast({
        title: "Tanggal Tidak Valid",
        description: e.message || "Format tanggal atau waktu tidak valid.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        duration: durationValue,
        deadline: isoDeadline,
        authorId: user.id,
      };

      if (isoSubmissionStartDate) {
        payload.submissionStartDate = isoSubmissionStartDate;
      }

      const response = await axiosInstance.post("/quizzes", payload);

      const quizTitle = response.data?.data?.title || formData.title;

      toast({
        title: "Kuis Berhasil Dibuat",
        description: `Kuis "${quizTitle}" telah ditambahkan.`,
        variant: "default",
      });

      router.push("/dashboard/manage-kuis");
    } catch (err: any) {
      console.error("Gagal membuat kuis:", err);
      const errorMessage =
        err.response?.data?.message || "Terjadi kesalahan saat membuat kuis.";
      setError(errorMessage);
      toast({
        title: "Pembuatan Kuis Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat...</p>
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
              <PlusCircle className="w-7 h-7 mr-3 text-primary" />
              Buat Kuis Baru
            </CardTitle>
            <CardDescription>
              Isi detail kuis. Field yang ditandai * wajib diisi.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
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
                  placeholder="Contoh: Kuis Mingguan Bab 1"
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
                  placeholder="Jelaskan detail kuis, topik yang dicakup, dll."
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
                  placeholder="Contoh: 60"
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
                    Tanggal Mulai Pengumpulan (Opsional)
                  </Label>
                  <Input
                    id="submissionStartDate"
                    name="submissionStartDate"
                    type="datetime-local"
                    value={formData.submissionStartDate}
                    onChange={(e) =>
                      handleDateChange("submissionStartDate", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleDateChange("deadline", e.target.value)
                    }
                    required
                    className="rounded-md"
                  />
                </div>
              </div>

              <CardFooter className="px-0 pt-8 flex justify-end">
                <Button
                  type="submit"
                  className="w-full sm:w-auto rounded-md"
                  disabled={isLoading || authLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <ListChecks className="mr-2 h-4 w-4" /> Buat Kuis
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
