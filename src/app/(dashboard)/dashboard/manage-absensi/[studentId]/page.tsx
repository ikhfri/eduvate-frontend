/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface StudentInfo {
  id: string;
  name: string | null;
  email: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "HADIR" | "IZIN" | "ALFA";
  notes: string | null;
}

// --- KOMPONEN KECIL (Bisa diimpor dari file lain jika sudah ada) ---
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
export default function StudentHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<
    AttendanceRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/attendance/student/${studentId}`
      );
      const { student, history } = response.data.data;
      setStudentInfo(student);
      setAttendanceHistory(history);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat riwayat siswa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleExportHistory = async () => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get(
        `/attendance/student/${studentId}/export`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `riwayat-absensi-${studentInfo?.name || studentId}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch?.length > 1) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Sukses", description: "File riwayat berhasil diunduh." });
    } catch (error) {
      toast({
        title: "Gagal Mengekspor",
        description: "Tidak dapat mengunduh file riwayat.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Riwayat Absensi
              </h1>
              <p className="text-muted-foreground">
                {studentInfo?.name || "Memuat..."}
              </p>
            </div>
          </div>
          <Button onClick={handleExportHistory} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Ekspor Riwayat
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Riwayat Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceHistory.length > 0 ? (
                  attendanceHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.date), "EEEE, dd MMMM yyyy", {
                          locale: LocaleID,
                        })}
                      </TableCell>
                      <TableCell>
                        <AttendanceStatusBadge status={record.status} />
                      </TableCell>
                      <TableCell>{record.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Belum ada riwayat absensi untuk siswa ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
