/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/manage-kuis/[quizId]/submissions/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Users,
  ChevronLeft,
  Trash2,
  FileSearch,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// FIX: Menambahkan impor untuk format, parseISO, dan isValid
import { format, parseISO, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
// FIX: Menambahkan impor untuk utilitas 'cn'
import { cn } from "@/lib/utils";

interface AttemptData {
  id: string;
  score: number;
  submittedAt: string;
  student: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface SubmissionPageData {
  quizTitle: string;
  attempts: AttemptData[];
}

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    return format(date, "dd MMM yyyy, HH:mm", { locale: LocaleID });
  } catch (error) {
    return "Date format error";
  }
};

export default function ManageSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [pageData, setPageData] = useState<SubmissionPageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!quizId || !user) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/quizzes/${quizId}/submissions`
      );
      setPageData(response.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data.");
    } finally {
      setIsLoading(false);
    }
  }, [quizId, user]);

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "MENTOR") {
      fetchSubmissions();
    }
  }, [user, fetchSubmissions]);

  const handleDeleteAttempt = async (
    attemptId: string,
    studentName: string | null
  ) => {
    if (
      !window.confirm(
        `Yakin ingin mereset percobaan kuis untuk "${
          studentName || "Siswa ini"
        }"? Mereka akan dapat mengerjakan ulang kuis.`
      )
    )
      return;

    try {
      await axiosInstance.delete(`/quizzes/attempts/${attemptId}`);
      toast({
        title: "Berhasil",
        description: "Percobaan kuis telah direset.",
      });
      fetchSubmissions(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Gagal Mereset",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold text-destructive">
          Gagal Memuat Data
        </h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-6">
        <div>
          <Button
            onClick={() => router.push("/dashboard/manage-kuis")}
            variant="outline"
            size="sm"
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Kelola Kuis
          </Button>
          <h1 className="text-3xl font-bold">Pengumpulan Kuis</h1>
          <p className="text-muted-foreground">
            &quot;{pageData?.quizTitle || "Memuat..."}&quot;
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengumpulan</CardTitle>
            <CardDescription>
              {pageData?.attempts.length ?? 0} siswa telah mengerjakan kuis ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pageData && pageData.attempts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Skor</TableHead>
                    <TableHead>Waktu Pengumpulan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        {attempt.student.name || "N/A"}
                      </TableCell>
                      <TableCell>{attempt.student.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            attempt.score >= 70 ? "default" : "destructive"
                          }
                          className={cn(attempt.score >= 70 && "bg-green-600")}
                        >
                          {attempt.score.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateSafe(attempt.submittedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDeleteAttempt(
                              attempt.id,
                              attempt.student.name
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <FileSearch className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Belum ada siswa yang mengumpulkan kuis ini.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
