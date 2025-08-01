/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/manage-absensi/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; // NEW: Added Input component
import { Search } from "lucide-react"; // NEW: Added Search icon

// Icons & Utilities
import {
  Loader2,
  UserCheck,
  UserX,
  FileText,
  Download,
  History,
  QrCode,
  CalendarIcon,
} from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { saveAs } from "file-saver";

// --- INTERFACES & HELPERS ---
interface StudentAttendance {
  id: string;
  name: string | null;
  email: string;
  attendance: {
    status: "HADIR" | "IZIN" | "ALFA";
    notes: string | null;
  } | null;
}

const getInitials = (name: string | null) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "S";

// --- CHILD COMPONENTS ---
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
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
      <div className="flex flex-col">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <p className="text-2xl font-bold">{count}</p>
      </div>
      <div className={cn("p-3 rounded-md", color)}>
        <Icon className="h-5 w-5" />
      </div>
    </CardHeader>
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

const TableSkeleton = () =>
  Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-6 w-16 mx-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-10 ml-auto" />
      </TableCell>
    </TableRow>
  ));

// --- MAIN COMPONENT ---
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
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // NEW: State for search query

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
    if (user && selectedDate) fetchDailyRecap(selectedDate);
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

  // NEW: Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return dailyData;
    return dailyData.filter((student) =>
      student.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dailyData, searchQuery]);

  const handleCellClick = (student: StudentAttendance, date: Date) => {
    setModalContent({
      student,
      date,
      type: student.attendance?.status === "IZIN" ? "view" : "mark",
    });
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
      toast({ title: "Sukses", description: "Kehadiran berhasil ditandai." });
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

  const handleExportWeeklyRecap = async () => {
    if (!selectedDate) return;
    setIsExporting(true);
    try {
      const response = await axiosInstance.get("/attendance/recap/export", {
        params: {
          weekStartDate: format(
            startOfWeek(selectedDate, { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          ),
        },
        responseType: "blob",
      });
      const filename = `rekap-mingguan-${format(
        selectedDate,
        "yyyy-MM-dd"
      )}.xlsx`;
      saveAs(new Blob([response.data]), filename);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kelola Absensi Siswa
            </h1>
            <p className="text-muted-foreground">
              Pilih tanggal untuk melihat dan mengelola kehadiran.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "EEEE, dd MMMM yyyy", {
                      locale: LocaleID,
                    })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleExportWeeklyRecap}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Ekspor
            </Button>
            <Button onClick={() => router.push("/dashboard/qr-scanner")}>
              <QrCode className="mr-2 h-4 w-4" /> Scan QR
            </Button>
          </div>
        </div>

        {/* STATS CARDS (RESPONSIVE) */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <StatCard
              title="Hadir"
              count={stats.hadir}
              icon={UserCheck}
              color="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
            />
          </div>
          <div className="flex-1">
            <StatCard
              title="Izin"
              count={stats.izin}
              icon={FileText}
              color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
            />
          </div>
          <div className="flex-1">
            <StatCard
              title="Alfa"
              count={stats.alfa}
              icon={UserX}
              color="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
            />
          </div>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* STUDENT LIST TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa</CardTitle>
            <CardDescription>
              Status kehadiran untuk tanggal terpilih. Klik status untuk
              mengubah.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Nama Siswa</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Riwayat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : (
                    <AnimatePresence>
                      {filteredData.map(
                        (
                          student // CHANGED: dailyData to filteredData
                        ) => (
                          <motion.tr
                            key={student.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {getInitials(student.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {student.name || "Siswa Tanpa Nama"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {student.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
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
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/manage-absensi/${student.id}`
                                  )
                                }
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        )
                      )}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>
            {!isLoading &&
              filteredData.length === 0 && ( // CHANGED: dailyData to filteredData
                <div className="text-center py-10 text-muted-foreground">
                  {searchQuery
                    ? "Tidak ada siswa yang cocok dengan pencarian."
                    : "Tidak ada data siswa untuk ditampilkan."}
                </div>
              )}
          </CardContent>
        </Card>
      </motion.div>

      {/* MODAL/DIALOG */}
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
                )}{" "}
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
                )}{" "}
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
