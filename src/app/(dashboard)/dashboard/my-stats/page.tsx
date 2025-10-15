/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import {
  Loader2,
  AlertCircle,
  Award,
  BookOpen,
  ClipboardCheck,
  Star,
  LineChart,
} from "lucide-react";
import {
  BarChart,
  Bar,

  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";

interface StudentStatsData {
  taskStats: {
    completedCount: number;
    averageGrade: number | null;
  };
  quizStats: {
    completedCount: number;
    averageScore: number | null;
  };
}

const StatItem = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) => (
  <div
    className="p-4 bg-card border-l-4 rounded-r-lg flex items-center gap-4"
    style={{ borderColor: color }}
  >
    <div className="p-3 rounded-full" style={{ backgroundColor: `${color}1A` }}>
      <Icon className="h-6 w-6" style={{ color: color }} />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

export default function MyStatisticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [statsData, setStatsData] = useState<StudentStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentStats = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/stats/my-stats");
      setStatsData(response.data?.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal mengambil statistik Anda.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      fetchStudentStats();
    }
  }, [user, fetchStudentStats]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          Memuat statistik pribadimu...
        </p>
      </div>
    );
  }

  if (user?.role !== "STUDENT") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Akses Ditolak
        </h2>
        <p className="text-muted-foreground mb-4">
          Hanya Siswa yang dapat mengakses halaman ini.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchStudentStats}>Coba Lagi</Button>
      </div>
    );
  }

  const performanceData = [
    { name: "Tugas", "Rata-rata Nilai": statsData.taskStats.averageGrade ?? 0 },
    { name: "Kuis", "Rata-rata Nilai": statsData.quizStats.averageScore ?? 0 },
  ];

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div className="space-y-8">
        <div className="relative p-8 rounded-2xl shadow-xl text-white overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
          <Award className="absolute -right-10 -bottom-10 h-48 w-48 text-white/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold">Performa Belajarku</h1>
            <p className="mt-2 text-white/80 max-w-lg">
              Lihat progres dan pencapaianmu di sini. Terus tingkatkan!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatItem
            label="Tugas Selesai"
            value={statsData.taskStats.completedCount}
            icon={ClipboardCheck}
            color="#3b82f6"
          />
          <StatItem
            label="Rata-rata Nilai Tugas"
            value={statsData.taskStats.averageGrade?.toFixed(1) ?? "N/A"}
            icon={Star}
            color="#3b82f6"
          />
          <StatItem
            label="Kuis Dikerjakan"
            value={statsData.quizStats.completedCount}
            icon={BookOpen}
            color="#22c55e"
          />
          <StatItem
            label="Rata-rata Skor Kuis"
            value={statsData.quizStats.averageScore?.toFixed(1) ?? "N/A"}
            icon={Star}
            color="#22c55e"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Perbandingan Rata-rata
            </CardTitle>
            <CardDescription>
              Perbandingan rata-rata nilai antara tugas dan kuis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={performanceData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend />
                <Bar dataKey="Rata-rata Nilai" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
