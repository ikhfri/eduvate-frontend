/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, isValid as isValidDate } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { useAuth} from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Edit2,
  Award,
  Send,
  Info,
} from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/fetchApi"; 

interface SubmissionStudent {
  id: string;
  name?: string;
  email: string;
}

interface Submission {
  id: string;
  submittedAt: string;
  fileUrl: string;
  grade?: number | null;
  feedback?: string | null; 
  student: SubmissionStudent;
}

interface TaskForSubmissions {
  id: string;
  title: string;
  deadline: string;
  submissions: Submission[];
}

const formatDateSafe = (
  dateString: string | undefined | null,
  formatPattern: string
) => {
  if (!dateString) return "N/A";
  try {
    const date = parseISO(dateString);
    if (!isValidDate(date)) {
      console.warn(`Invalid date string for submission page: ${dateString}`);
      return "Tanggal tidak valid";
    }
    return format(date, formatPattern, { locale: LocaleID });
  } catch (error) {
    console.error(
      `Error parsing/formatting date for submission page: ${dateString}`,
      error
    );
    return "Error format tanggal";
  }
};

export default function ManageSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, token } = useAuth();
  const taskId = params.taskId as string;

  const [taskInfo, setTaskInfo] = useState<TaskForSubmissions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [grade, setGrade] = useState<string>("");
  const [feedbackText, setFeedbackText] = useState<string>(""); 
  const [isGradingLoading, setIsGradingLoading] = useState<boolean>(false);
  const [isGradingDialogOpen, setIsGradingDialogOpen] =
    useState<boolean>(false);

  const fetchTaskDetailsAndSubmissions = useCallback(async () => {
    if (!taskId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const taskDetailResponse = await fetchApi(`/tasks/${taskId}`, { token });
      const taskDetails = taskDetailResponse.task || taskDetailResponse;

      if (!taskDetails || !taskDetails.id) {
        setError("Gagal memuat detail tugas.");
        setTaskInfo(null);
        setIsLoading(false);
        return;
      }

      const submissionsResponse = await fetchApi(
        `/tasks/${taskId}/submissions`,
        { token }
      );
      const submissionsArray = Array.isArray(submissionsResponse)
        ? submissionsResponse
        : submissionsResponse.submissions || [];

      setTaskInfo({
        id: taskDetails.id,
        title: taskDetails.title,
        deadline: taskDetails.deadline,
        submissions: submissionsArray,
      });
    } catch (err: any) {
      const errorMessage =
        err.message || "Gagal memuat data pengumpulan tugas.";
      setError(errorMessage);
      toast({
        title: "Error Memuat Data",
        description: errorMessage,
        variant: "destructive",
      });
      setTaskInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, toast, token]);

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      (user.role === "ADMIN" || user.role === "MENTOR")
    ) {
      fetchTaskDetailsAndSubmissions();
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
        description: "Anda tidak memiliki izin untuk melihat halaman ini.",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [authLoading, user, router, fetchTaskDetailsAndSubmissions, toast]);

  const handleGradeClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || "");
    setFeedbackText(submission.feedback || ""); 
    setIsGradingDialogOpen(true);
  };

  const handleGradeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      toast({
        title: "Nilai Tidak Valid",
        description: "Nilai harus antara 0 dan 100.",
        variant: "destructive",
      });
      return;
    }

    setIsGradingLoading(true);
    try {
      await fetchApi(`/tasks/submissions/${selectedSubmission.id}/grade`, {
        method: "PUT", 
        token,
        body: {
          grade: numericGrade,
          comment: feedbackText, 
        },
      });
      toast({
        title: "Penilaian Disimpan",
        description: "Nilai dan feedback telah berhasil disimpan.",
        variant: "default",
      });
      setIsGradingDialogOpen(false);
      fetchTaskDetailsAndSubmissions();
    } catch (err: any) {
      console.error("Gagal menyimpan penilaian:", err);
      const errorMessage =
        err.message || "Terjadi kesalahan saat menyimpan penilaian.";
      toast({
        title: "Gagal Menyimpan",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGradingLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          Memuat data pengumpulan...
        </p>
      </div>
    );
  }

  if (error) {
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
        <Button onClick={fetchTaskDetailsAndSubmissions}>Coba Lagi</Button>
      </div>
    );
  }

  if (!taskInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
          Informasi Tugas Tidak Ditemukan
        </h2>
        <p className="text-muted-foreground mb-2">
          Tidak dapat memuat detail tugas atau tugas tidak ada.
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
      <div className="space-y-6">
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
            <CardTitle className="text-2xl font-bold text-primary">
              {taskInfo.title}
            </CardTitle>
            <CardDescription>
              Deadline:{" "}
              {formatDateSafe(taskInfo.deadline, "dd MMM enim, HH:mm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3">
              Daftar Pengumpulan Tugas
            </h3>
            {taskInfo.submissions && taskInfo.submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Waktu Kumpul
                    </TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskInfo.submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.student.name || "Siswa Tanpa Nama"}
                      </TableCell>
                      <TableCell>{sub.student.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDateSafe(sub.submittedAt, "dd MMM yy, HH:mm")}
                      </TableCell>
                      <TableCell>
                        {sub.grade !== null &&
                        typeof sub.grade !== "undefined" ? (
                          <Badge
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {sub.grade}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Belum Dinilai</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {sub.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`${sub.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Lihat File"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Lihat File</span>
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGradeClick(sub)}
                          title="Beri Nilai/Feedback"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Beri Nilai</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="mx-auto h-10 w-10 mb-2" />
                Belum ada siswa yang mengumpulkan tugas ini.
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isGradingDialogOpen}
          onOpenChange={setIsGradingDialogOpen}
        >
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary" /> Beri Penilaian
                untuk {selectedSubmission?.student.name}
              </DialogTitle>
              <DialogDescription>Tugas: {taskInfo.title}</DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
              <form onSubmit={handleGradeSubmit} className="space-y-4 py-2">
                {selectedSubmission.fileUrl && (
                  <div className="mb-4">
                   
                  </div>
                )}
                <div>
                  <Label htmlFor="grade" className="text-right">
                    Nilai (0-100)
                  </Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div>
                  <Label htmlFor="feedbackText" className="text-right">
                    {" "}
                    Feedback/Catatan
                  </Label>
                  <Textarea
                    id="feedbackText" 
                    value={feedbackText} 
                    onChange={(e) => setFeedbackText(e.target.value)} 
                    rows={4}
                    placeholder="Berikan feedback konstruktif untuk siswa..."
                    className="col-span-3"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isGradingLoading}>
                    {isGradingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Simpan Penilaian
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
