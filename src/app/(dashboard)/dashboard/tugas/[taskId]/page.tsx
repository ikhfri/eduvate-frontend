// app/(dashboard)/dashboard/tugas/[taskId]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, FormEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, isPast, isValid as isValidDate } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import axiosInstance from '@/lib/axiosInstance';
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertTriangle,
  BookOpen,
  CalendarCheck2,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  MessageSquareQuote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  submissionStartDate: string;
  deadline: string;
  author?: {
    name: string;
  };
  mySubmission?: {
    id: string;
    fileUrl: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
  } | null;
}

const formatDateSafe = (
  dateString: string | undefined | null,
  formatPattern: string
) => {
  if (!dateString) return "N/A";
  try {
    const date = parseISO(dateString);
    if (!isValidDate(date)) {
      console.warn(`Invalid date string received: ${dateString}`);
      return "Tanggal tidak valid";
    }
    return format(date, formatPattern, { locale: LocaleID });
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return "Error format";
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchTaskDetail = useCallback(async () => {
    if (!taskId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/tasks/${taskId}`);
      const taskDetailData = response.data?.task || response.data?.data || response.data;
      setTask(taskDetailData);
    } catch (err: any) {
      console.error("Gagal mengambil detail tugas:", err);
      const errorMessage = err.response?.data?.message || "Gagal memuat detail tugas.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTaskDetail();
    }
  }, [authLoading, user, fetchTaskDetail]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].size > 5 * 1024 * 1024) {
          toast({
              title: "Ukuran File Terlalu Besar",
              description: "Ukuran file maksimal adalah 5MB.",
              variant: "destructive"
          });
          event.target.value = '';
          setSelectedFile(null);
          return;
      }
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmitAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({ title: "File Belum Dipilih", description: "Silakan pilih file untuk diunggah.", variant: "destructive" });
      return;
    }
    if (!task) return;

    if (isPast(parseISO(task.deadline))) {
      toast({ title: "Tenggat Waktu Terlewat", description: "Anda tidak dapat mengumpulkan tugas karena tenggat waktu telah berakhir.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("submissionFile", selectedFile);

    try {
      const response = await axiosInstance.post(`/tasks/${taskId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newSubmission = response.data?.submission || response.data?.data;
      
      setTask((prevTask) => prevTask ? { ...prevTask, mySubmission: newSubmission } : null);
      toast({ title: "Pengumpulan Berhasil", description: "Tugas Anda telah berhasil dikumpulkan.", variant: "default" });
      setSelectedFile(null);

    } catch (err: any) {
      console.error("Gagal mengumpulkan tugas:", err);
      const errorMessage = err.response?.data?.message || "Terjadi kesalahan saat mengumpulkan tugas.";
      toast({ title: "Pengumpulan Gagal", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadlinePassed = task?.deadline ? isPast(parseISO(task.deadline)) : false;
  const canSubmit = task && !deadlinePassed && !task.mySubmission;

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat detail tugas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Gagal Memuat Tugas</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={() => router.back()} variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali</Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Tugas Tidak Ditemukan</h2>
        <Button onClick={() => router.push("/dashboard/tugas")} variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Tugas</Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "MENTOR"]}>
      <div className="space-y-8">
        <div>
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="mb-4 inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <p className="text-muted-foreground">
            Dibuat oleh {task.author?.name || "N/A"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi Tugas</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      task.description.replace(/\n/g, "<br />") ||
                      "<p>Tidak ada deskripsi.</p>",
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Informasi Waktu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm">
                  <CalendarCheck2 className="w-4 h-4 mr-2 text-green-500" />
                  <span>
                    Mulai:{" "}
                    {formatDateSafe(
                      task.submissionStartDate,
                      "EEEE, dd MMMM yyyy, HH:mm"
                    )}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <CalendarCheck2 className="w-4 h-4 mr-2 text-red-500" />
                  <span>
                    Deadline:{" "}
                    {formatDateSafe(task.deadline, "EEEE, dd MMMM yyyy, HH:mm")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle>Status Pengumpulan</CardTitle>
              </CardHeader>
              <CardContent>
                {task.mySubmission ? (
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                      <CheckCircle2 className="h-8 w-8 mr-4 text-green-600 dark:text-green-400" />
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-300">
                          Tugas Terkumpul
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDateSafe(
                            task.mySubmission.submittedAt,
                            "dd MMM, HH:mm"
                          )}
                        </p>
                      </div>
                    </div>
                    {task.mySubmission.fileUrl && (
                      <a
                        href={`${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:3001"
                        }${task.mySubmission.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Lihat File Anda
                        </Button>
                      </a>
                    )}
                    <div className="pt-4 border-t dark:border-gray-700 space-y-4">
                      <h4 className="text-md font-semibold text-center">
                        Penilaian
                      </h4>
                      {typeof task.mySubmission.grade === "number" ? (
                        <>
                          <div className="text-center">
                            <p className="text-6xl font-bold text-primary">
                              {task.mySubmission.grade}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground">
                              Skor Akhir
                            </p>
                          </div>
                          {task.mySubmission.feedback && (
                            <div className="text-left">
                              <h5 className="font-semibold flex items-center gap-2">
                                <MessageSquareQuote className="h-4 w-4" />
                                Feedback Mentor
                              </h5>
                              <blockquote className="mt-2 border-l-2 pl-4 italic text-sm text-muted-foreground">
                                {task.mySubmission.feedback}
                              </blockquote>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                          <p>Tugas Anda sedang dalam proses penilaian.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : deadlinePassed ? (
                  <div className="flex flex-col items-center justify-center text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="h-10 w-10 text-destructive mb-2" />
                    <h3 className="font-semibold text-destructive">
                      Tenggat Waktu Terlewat
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Anda tidak dapat lagi mengumpulkan tugas ini.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <Label htmlFor="submissionFile" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-semibold">
                          Klik untuk memilih file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          atau seret file ke sini
                        </p>
                        <p className="text-xs text-red-500 mt-2">
                          Maksimal 5MB
                        </p>
                      </div>
                    </Label>
                    <Input
                      id="submissionFile"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    {selectedFile && (
                      <p className="mt-2 text-xs text-muted-foreground text-center">
                        File dipilih: {selectedFile.name}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || !selectedFile || !canSubmit}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Mengunggah...
                        </>
                      ) : (
                        "Kumpulkan Tugas"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
