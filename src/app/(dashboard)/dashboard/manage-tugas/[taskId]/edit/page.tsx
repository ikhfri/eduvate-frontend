/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lms-frontend/app/(dashboard)/dashboard/manage-tugas/[taskId]/edit/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useCallback } from "react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, Edit, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatISO, parse, isValid, format as formatDateFns, parseISO } from "date-fns";

// Misalkan ada daftar mata kuliah (bisa diambil dari API atau statis)
const availableCourses = [
  { id: "course1", name: "Pemrograman Web Dasar" },
  { id: "course2", name: "Basis Data Lanjut" },
  { id: "course3", name: "Jaringan Komputer" },
];

const NO_COURSE_SELECTED_VALUE = "__NONE__";

interface TaskData {
  // Digunakan untuk form dan data dari API
  title: string;
  description: string;
  courseId?: string;
  submissionStartDate: string; // ISO string from API, datetime-local string for input
  deadline: string; // ISO string from API, datetime-local string for input
}

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<TaskData>({
    title: "",
    description: "",
    courseId: NO_COURSE_SELECTED_VALUE,
    submissionStartDate: "",
    deadline: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false); // Untuk loading submit form
  const [isFetching, setIsFetching] = useState<boolean>(true); // Untuk loading data awal
  const [error, setError] = useState<string | null>(null);

  const fetchTaskData = useCallback(async () => {
    if (!taskId) return;
    setIsFetching(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/tasks/${taskId}`); // Endpoint GET /api/tasks/:taskId
      const task = response.data.task || response.data;

      // Format tanggal dari ISO string (dari backend) ke format datetime-local (untuk input)
      const formattedStartDate =
        task.submissionStartDate && isValid(parseISO(task.submissionStartDate))
          ? formatDateFns(
              parseISO(task.submissionStartDate),
              "yyyy-MM-dd'T'HH:mm"
            )
          : "";
      const formattedDeadline =
        task.deadline && isValid(parseISO(task.deadline))
          ? formatDateFns(parseISO(task.deadline), "yyyy-MM-dd'T'HH:mm")
          : "";

      setFormData({
        title: task.title || "",
        description: task.description || "",
        courseId: task.courseId || task.course?.id || NO_COURSE_SELECTED_VALUE,
        submissionStartDate: formattedStartDate,
        deadline: formattedDeadline,
      });
    } catch (err: any) {
      console.error("Gagal mengambil data tugas:", err);
      const errorMessage =
        err.response?.data?.message || "Gagal memuat data tugas untuk diedit.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  }, [taskId, toast]);

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      (user.role === "ADMIN" || user.role === "MENTOR")
    ) {
      fetchTaskData();
    } else if (!authLoading && !user) {
      router.push("/login");
    } else if (
      !authLoading &&
      user &&
      user.role !== "ADMIN" &&
      user.role !== "MENTOR"
    ) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengedit tugas.",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [authLoading, user, router, fetchTaskData, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (
    name: "submissionStartDate" | "deadline",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseChange = (value: string) => {
    setFormData((prev) => ({ ...prev, courseId: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (
      !formData.title ||
      !formData.description ||
      !formData.submissionStartDate ||
      !formData.deadline
    ) {
      setError("Semua field wajib diisi.");
      toast({
        title: "Input Tidak Lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    let startDate: Date | null = null;
    let deadlineDate: Date | null = null;

    try {
      startDate = parse(
        formData.submissionStartDate,
        "yyyy-MM-dd'T'HH:mm",
        new Date()
      );
      deadlineDate = parse(formData.deadline, "yyyy-MM-dd'T'HH:mm", new Date());
      if (!isValid(startDate) || !isValid(deadlineDate)) {
        throw new Error("Format tanggal tidak valid.");
      }
    } catch (e) {
      setError("Format tanggal atau waktu tidak valid. Harap periksa kembali.");
      toast({
        title: "Tanggal Tidak Valid",
        description: "Format tanggal atau waktu tidak valid.",
        variant: "destructive",
      });
      return;
    }

    if (deadlineDate <= startDate) {
      setError("Tanggal deadline harus setelah tanggal mulai pengumpulan.");
      toast({
        title: "Tanggal Tidak Valid",
        description: "Deadline harus setelah tanggal mulai.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        submissionStartDate: formatISO(startDate),
        deadline: formatISO(deadlineDate),
        courseId:
          formData.courseId === NO_COURSE_SELECTED_VALUE
            ? null
            : formData.courseId, // Kirim null jika tidak ada course
      };

      await axiosInstance.put(`/tasks/${taskId}`, payload); // Endpoint PUT /api/tasks/:taskId

      toast({
        title: "Tugas Berhasil Diperbarui",
        description: `Perubahan pada tugas "${formData.title}" telah disimpan.`,
        variant: "default",
      });
      router.push("/dashboard/manage-tugas");
    } catch (err: any) {
      console.error("Gagal memperbarui tugas:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Terjadi kesalahan saat memperbarui tugas.";
      setError(errorMessage);
      toast({
        title: "Update Tugas Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat data tugas...</p>
      </div>
    );
  }

  if (error && !isFetching) {
    // Tampilkan error spesifik fetch jika ada
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button
          onClick={() => router.push("/dashboard/manage-tugas")}
          variant="outline"
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Kelola Tugas
        </Button>
        <Button onClick={fetchTaskData}>Coba Lagi</Button>
      </div>
    );
  }

  if (!formData.title && !isFetching) {
    // Jika data tidak ada setelah fetch selesai
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
          Tugas Tidak Ditemukan
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Data untuk tugas ini tidak dapat ditemukan atau Anda tidak memiliki
          akses.
        </p>
        <Button
          onClick={() => router.push("/dashboard/manage-tugas")}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Kelola Tugas
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button
          onClick={() => router.push("/dashboard/manage-tugas")}
          variant="outline"
          size="sm"
          className="inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Kelola Tugas
        </Button>

        <Card className="shadow-lg border-border rounded-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Edit className="w-7 h-7 mr-3 text-primary" />
              Edit Tugas
            </CardTitle>
            <CardDescription>Ubah detail tugas yang sudah ada.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error &&
                !isLoading && ( // Tampilkan error submit form jika ada dan tidak sedang loading
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
                  Judul Tugas <span className="text-destructive">*</span>
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
                  Deskripsi Tugas <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="rounded-md"
                />
              </div>
              <div>
                <Label
                  htmlFor="courseId"
                  className="block text-sm font-medium mb-1"
                >
                  Mata Kuliah (Opsional)
                </Label>
                <Select
                  onValueChange={handleCourseChange}
                  value={formData.courseId || NO_COURSE_SELECTED_VALUE}
                >
                  <SelectTrigger className="w-full rounded-md">
                    <SelectValue placeholder="Pilih mata kuliah jika ada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_COURSE_SELECTED_VALUE}>
                      Tidak ada/Umum
                    </SelectItem>
                    {availableCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="submissionStartDate"
                    className="block text-sm font-medium mb-1"
                  >
                    Tanggal Mulai Pengumpulan{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="submissionStartDate"
                    name="submissionStartDate"
                    type="datetime-local"
                    value={formData.submissionStartDate}
                    onChange={(e) =>
                      handleDateChange("submissionStartDate", e.target.value)
                    }
                    required
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
              <CardFooter className="px-0 pt-6 flex justify-end">
                <Button
                  type="submit"
                  className="w-full sm:w-auto rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Memperbarui...
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
