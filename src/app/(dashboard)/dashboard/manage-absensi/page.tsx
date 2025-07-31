/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/manage-absensi/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Loader2,
  UserCheck,
  UserX,
  FileText,
  Download,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface StudentAttendance {
  id: string;
  name: string | null;
  email: string;
  attendance: {
    status: "HADIR" | "IZIN" | "ALFA";
    notes: string | null;
  } | null;
}

// --- KOMPONEN KECIL ---
// (Tidak ada perubahan di komponen StatCard dan AttendanceStatusBadge, jadi saya singkat)
const StatCard = ({
  title,
  count,
  icon: Icon,
  color,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) => (
  <Card className={cn("border-l-4", color)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{count}</div>
    </CardContent>
  </Card>
);

const AttendanceStatusBadge = ({
  status,
}: {
  status: "HADIR" | "IZIN" | "ALFA" | null;
}) => {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const styles = {
    HADIR:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    IZIN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    ALFA: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };
  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-semibold rounded-full",
        styles[status]
      )}
    >
      {status}
    </span>
  );
};

// --- KOMPONEN UTAMA ---
export default function ManageAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [dailyData, setDailyData] = useState<StudentAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    student: StudentAttendance;
    date: Date;
    type: "mark" | "view";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // BARU: State untuk loading saat ekspor
  const [isExporting, setIsExporting] = useState(false);

  const fetchDailyRecap = useCallback(
    async (date: Date) => {
      setIsLoading(true);
      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const response = await axiosInstance.get("/attendance/daily-recap", {
          params: { date: formattedDate },
        });
        setDailyData(response.data.data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat rekap absensi.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (user && selectedDate) {
      fetchDailyRecap(selectedDate);
    }
  }, [user, selectedDate, fetchDailyRecap]);

  const stats = useMemo(() => {
    return dailyData.reduce(
      (acc, student) => {
        if (student.attendance?.status === "HADIR") acc.hadir++;
        else if (student.attendance?.status === "IZIN") acc.izin++;
        else if (student.attendance?.status === "ALFA") acc.alfa++;
        return acc;
      },
      { hadir: 0, izin: 0, alfa: 0 }
    );
  }, [dailyData]);

  const handleCellClick = (student: StudentAttendance, date: Date) => {
    if (student.attendance?.status === "IZIN") {
      setModalContent({ student, date, type: "view" });
    } else {
      setModalContent({ student, date, type: "mark" });
    }
    setIsModalOpen(true);
  };

  const handleMarkAttendance = async (status: "HADIR" | "ALFA") => {
    if (!modalContent) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/attendance/mark", {
        studentId: modalContent.student.id,
        date: format(modalContent.date, "yyyy-MM-dd"),
        status,
      });
      toast({ title: "Sukses", description: `Kehadiran berhasil ditandai.` });
      setIsModalOpen(false);
      if (selectedDate) fetchDailyRecap(selectedDate);
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // BARU: Fungsi untuk menangani ekspor rekap mingguan
  const handleExportWeeklyRecap = async () => {
    if (!selectedDate) {
      toast({
        title: "Peringatan",
        description: "Silakan pilih tanggal terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      const response = await axiosInstance.get("/attendance/recap/export", {
        params: {
          weekStartDate: format(selectedDate, "yyyy-MM-dd"),
        },
        // DIUBAH: Respons yang diharapkan adalah blob (file), bukan JSON
        responseType: "blob",
      });

      // Membuat link sementara untuk mengunduh file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Mendapatkan nama file dari header 'Content-Disposition'
      const contentDisposition = response.headers["content-disposition"];
      let filename = `rekap-mingguan-${format(
        selectedDate,
        "yyyy-MM-dd"
      )}.xlsx`; // Nama default
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Membersihkan link setelah diunduh
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Sukses", description: "File rekap berhasil diunduh." });
    } catch (error) {
      toast({
        title: "Gagal Mengekspor",
        description: "Tidak dapat mengunduh file rekap.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Kelola Absensi Siswa</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Pilih Tanggal</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="p-0"
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Hadir"
                count={stats.hadir}
                icon={UserCheck}
                color="border-green-500"
              />
              <StatCard
                title="Izin"
                count={stats.izin}
                icon={FileText}
                color="border-yellow-500"
              />
              <StatCard
                title="Alfa"
                count={stats.alfa}
                icon={UserX}
                color="border-red-500"
              />
            </div>
            <Card>
              {/* DIUBAH: Menambahkan tombol ekspor di header card */}
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Daftar Siswa</CardTitle>
                  <CardDescription>
                    Status kehadiran untuk tanggal{" "}
                    {selectedDate
                      ? format(selectedDate, "dd MMMM yyyy", {
                          locale: LocaleID,
                        })
                      : ""}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleExportWeeklyRecap}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Ekspor Mingguan
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Riwayat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyData.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.name || "Siswa Tanpa Nama"}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              className="h-auto p-1"
                              onClick={() =>
                                handleCellClick(student, selectedDate!)
                              }
                            >
                              <AttendanceStatusBadge
                                status={student.attendance?.status || null}
                              />
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/manage-absensi/${student.id}`
                                )
                              }
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalContent?.type === "mark"
                ? "Tandai Kehadiran"
                : "Catatan Izin"}
            </DialogTitle>
            <DialogDescription>
              {modalContent?.student.name} -{" "}
              {modalContent
                ? format(modalContent.date, "EEEE, dd MMMM yyyy", {
                    locale: LocaleID,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          {modalContent?.type === "mark" ? (
            <div className="flex justify-center gap-4 py-4">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleMarkAttendance("HADIR")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Hadir
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => handleMarkAttendance("ALFA")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="mr-2 h-4 w-4" />
                )}
                Alfa
              </Button>
            </div>
          ) : (
            <div className="py-4">
              <blockquote className="mt-2 border-l-2 pl-6 italic text-muted-foreground">
                {modalContent?.student.attendance?.notes ||
                  "Tidak ada catatan yang diberikan."}
              </blockquote>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
