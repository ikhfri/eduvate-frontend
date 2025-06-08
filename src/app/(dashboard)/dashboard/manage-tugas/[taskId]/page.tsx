/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, isPast, isValid as isValidDate } from "date-fns"; // Import isValidDate
import { id as LocaleID } from "date-fns/locale";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertTriangle,
  BookOpen,
  CalendarCheck2,
  UserCircle,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  submissionStartDate: string;
  deadline: string;
  course?: {
    id: string;
    name: string;
  };
  author?: {
    name: string;
  };
  currentUserSubmission?: {
    id: string;
    fileUrl: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
  } | null;
}

// Helper function untuk format tanggal yang aman
const formatDateSafe = (
  dateString: string | undefined | null,
  formatPattern: string
) => {
  if (!dateString) return "N/A";
  try {
    const date = parseISO(dateString);
    if (!isValidDate(date)) {
      // Menggunakan isValidDate dari date-fns
      console.warn(
        `Invalid date string received for formatting: ${dateString}`
      );
      return "Tanggal tidak valid";
    }
    return format(date, formatPattern, { locale: LocaleID });
  } catch (error) {
    console.error(
      `Error parsing or formatting date string: ${dateString}`,
      error
    );
    return "Error format tanggal";
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

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!taskId) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/tasks/${taskId}`);
        setTask(response.data.task || response.data);
      } catch (err: any) {
        console.error("Gagal mengambil detail tugas:", err);
        const errorMessage =
          err.response?.data?.message || "Gagal memuat detail tugas.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchTaskDetail();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [taskId, toast, authLoading, user, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmitAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        title: "File Belum Dipilih",
        description: "Silakan pilih file untuk diunggah.",
        variant: "destructive",
      });
      return;
    }
    if (!task || !user) return;

    if (!task.deadline || !isValidDate(parseISO(task.deadline))) {
      toast({
        title: "Deadline Tidak Valid",
        description: "Informasi deadline tugas tidak valid.",
        variant: "destructive",
      });
      return;
    }
    if (isPast(parseISO(task.deadline))) {
      toast({
        title: "Tenggat Waktu Terlewat",
        description:
          "Anda tidak dapat mengumpulkan tugas karena tenggat waktu telah berakhir.",
        variant: "destructive",
      });
      return;
    }

    if (task.currentUserSubmission) {
      toast({
        title: "Sudah Mengumpulkan",
        description: "Anda sudah pernah mengumpulkan tugas ini.",
        variant: "default",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("submissionFile", selectedFile);

    try {
      const response = await axiosInstance.post(
        `/tasks/${taskId}/submit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setTask((prevTask) =>
        prevTask
          ? { ...prevTask, currentUserSubmission: response.data.submission }
          : null
      );

      toast({
        title: "Pengumpulan Berhasil",
        description: "Tugas Anda telah berhasil dikumpulkan.",
        variant: "default",
      });
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Gagal mengumpulkan tugas:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Terjadi kesalahan saat mengumpulkan tugas.";
      toast({
        title: "Pengumpulan Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadlinePassed =
    task?.deadline && isValidDate(parseISO(task.deadline))
      ? isPast(parseISO(task.deadline))
      : false;
  const canSubmit =
    task &&
    task.deadline &&
    isValidDate(parseISO(task.deadline)) &&
    !isPast(parseISO(task.deadline)) &&
    !task.currentUserSubmission;

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
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Gagal Memuat Tugas
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
          Tugas Tidak Ditemukan
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Detail untuk tugas ini tidak dapat ditemukan.
        </p>
        <Button
          onClick={() => router.push("/dashboard/tugas")}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Tugas
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "MENTOR"]}>
      <div className="space-y-8">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="sm"
          className="mb-6 inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <Card className="shadow-lg border-border rounded-lg overflow-hidden">
          <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10 p-6 border-b">
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-start">
              <BookOpen className="w-8 h-8 mr-3 mt-1 flex-shrink-0 text-primary" />
              {task.title}
            </CardTitle>
            {task.course?.name && (
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Mata Kuliah: {task.course.name}
              </CardDescription>
            )}
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p className="flex items-center">
                <UserCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />{" "}
                Dibuat oleh: {task.author?.name || "N/A"}
              </p>
              <p className="flex items-center">
                <CalendarCheck2 className="w-3.5 h-3.5 mr-1.5 text-green-600 dark:text-green-400 flex-shrink-0" />{" "}
                Mulai:{" "}
                {formatDateSafe(task.submissionStartDate, "dd MMM yyyy, HH:mm")}
              </p>
              <p className="flex items-center">
                <CalendarCheck2 className="w-3.5 h-3.5 mr-1.5 text-red-600 dark:text-red-400 flex-shrink-0" />{" "}
                Deadline: {formatDateSafe(task.deadline, "dd MMM yyyy, HH:mm")}
                {deadlinePassed && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Lewat Tenggat
                  </Badge>
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Deskripsi Tugas:
            </h3>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{
                __html:
                  task.description.replace(/\n/g, "<br />") ||
                  "<p>Tidak ada deskripsi.</p>",
              }}
            />
          </CardContent>
        </Card>

        {user?.role === "STUDENT" && (
          <Card className="shadow-lg border-border rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary">
                Pengumpulan Tugas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.currentUserSubmission ? (
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
                  <div className="flex items-center text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-6 w-6 mr-3 flex-shrink-0" />
                    <h3 className="text-lg font-semibold">
                      Anda Telah Mengumpulkan Tugas Ini
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dikumpulkan pada:{" "}
                    {formatDateSafe(
                      task.currentUserSubmission.submittedAt,
                      "dd MMM yyyy, HH:mm"
                    )}
                  </p>
                  {task.currentUserSubmission.fileUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`${
                          process.env.NEXT_PUBLIC_API_BASE_URL ||
                          "http://localhost:3001"
                        }${task.currentUserSubmission.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4 mr-2" /> Lihat File
                        Terkirim
                      </a>
                    </Button>
                  )}
                  {typeof task.currentUserSubmission.grade === "number" && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                      <p className="text-sm font-semibold">
                        Nilai:{" "}
                        <Badge variant="default" className="text-base">
                          {task.currentUserSubmission.grade}
                        </Badge>
                      </p>
                    </div>
                  )}
                  {task.currentUserSubmission.feedback && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold mb-1">
                        Feedback dari Mentor:
                      </p>
                      <p className="text-xs p-2 bg-background rounded border text-muted-foreground">
                        {task.currentUserSubmission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ) : deadlinePassed ? (
                <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-700">
                  <div className="flex items-center text-red-700 dark:text-red-300">
                    <XCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                    <h3 className="text-lg font-semibold">
                      Tenggat Waktu Terlewat
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anda tidak dapat lagi mengumpulkan tugas ini karena tenggat
                    waktu telah berakhir.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAssignment} className="space-y-4">
                  <div>
                    <Label
                      htmlFor="submissionFile"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Pilih File Tugas (PDF, DOCX, ZIP, dll.)
                    </Label>
                    <Input
                      id="submissionFile"
                      type="file"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      disabled={isSubmitting}
                    />
                    {selectedFile && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        File dipilih: {selectedFile.name} (
                        {(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting || !selectedFile || !canSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" /> Kumpulkan Tugas
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {(user?.role === "ADMIN" || user?.role === "MENTOR") &&
          task &&
          task.currentUserSubmission && (
            <Card className="shadow-lg border-border rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary">
                  Detail Pengumpulan (Siswa Terkait)
                </CardTitle>
                <CardDescription>
                  Dikumpulkan pada:{" "}
                  {formatDateSafe(
                    task.currentUserSubmission.submittedAt,
                    "dd MMM yyyy, HH:mm"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.currentUserSubmission.fileUrl && (
                  <Button variant="outline" asChild>
                    <a
                      href={`${
                        process.env.NEXT_PUBLIC_API_BASE_URL ||
                        "http://localhost:3001"
                      }${task.currentUserSubmission.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-4 w-4 mr-2" /> Lihat File Jawaban
                    </a>
                  </Button>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast({
                      title: "Fitur Penilaian",
                      description: "Logika penilaian belum diimplementasikan.",
                    });
                  }}
                  className="space-y-3 pt-4 border-t"
                >
                  <div>
                    <Label htmlFor="grade">Nilai (0-100)</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={task.currentUserSubmission.grade}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedback">Feedback/Catatan</Label>
                    <Textarea
                      id="feedback"
                      rows={3}
                      defaultValue={task.currentUserSubmission.feedback}
                    />
                  </div>
                  <Button type="submit">Simpan Penilaian</Button>
                </form>
              </CardContent>
            </Card>
          )}
      </div>
    </ProtectedRoute>
  );
}
