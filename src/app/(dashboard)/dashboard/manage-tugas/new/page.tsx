/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 
import {
  Loader2,
  AlertTriangle,
  BookPlus,
  ArrowLeft,
  CalendarPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatISO, parse, isValid } from "date-fns"; // Import isValid

// Misalkan ada daftar mata kuliah (bisa diambil dari API atau statis)
const availableCourses = [
  { id: "course2", name: "Linux" },
  { id: "course3", name: "Jaringan Komputer" },
  { id: "course4", name: "Mikrotik" },
];

// Definisikan nilai khusus untuk "Tidak ada/Umum"
const NO_COURSE_SELECTED_VALUE = "__NONE__";

interface CreateTaskFormData {
  title: string;
  description: string;
  courseId?: string;
  submissionStartDate: string;
  deadline: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {  loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<CreateTaskFormData>({
    title: "",
    description: "",
    courseId: NO_COURSE_SELECTED_VALUE, // Default ke nilai khusus
    submissionStartDate: "",
    deadline: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e : any) {
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
        ...formData,
        submissionStartDate: formatISO(startDate),
        deadline: formatISO(deadlineDate),
        courseId:
          formData.courseId === NO_COURSE_SELECTED_VALUE
            ? undefined
            : formData.courseId, // Kirim undefined jika tidak ada course
        // authorId: user?.id // Jika backend memerlukan ID pembuat tugas
      };

      await axiosInstance.post("/tasks", payload);

      toast({
        title: "Tugas Berhasil Dibuat",
        description: `Tugas "${formData.title}" telah ditambahkan.`,
        variant: "default",
      });
      // Reset form setelah berhasil
      setFormData({
        title: "",
        description: "",
        courseId: NO_COURSE_SELECTED_VALUE,
        submissionStartDate: "",
        deadline: "",
      });
      // Arahkan ke halaman daftar tugas admin (opsional, bisa juga tetap di halaman ini)
      // router.push('/dashboard/manage-tugas');
    } catch (err: any) {
      console.error("Gagal membuat tugas:", err);
      const errorMessage =
        err.response?.data?.message || "Terjadi kesalahan saat membuat tugas.";
      setError(errorMessage);
      toast({
        title: "Pembuatan Tugas Gagal",
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
              <BookPlus className="w-7 h-7 mr-3 text-primary" />
              Buat Tugas Baru
            </CardTitle>
            <CardDescription>
              Isi detail tugas yang akan diberikan kepada siswa.
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
                  Judul Tugas <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Contoh: Tugas Nevacad Week 1"
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
                  placeholder="Jelaskan detail tugas, kriteria penilaian, dll."
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
                  Materi (Opsional)
                </Label>
                <Select
                  onValueChange={handleCourseChange}
                  value={formData.courseId}
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
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="mr-2 h-4 w-4" /> Buat Tugas
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
