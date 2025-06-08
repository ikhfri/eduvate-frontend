// app/(dashboard)/dashboard/statistik/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useCallback } from "react";
// FIX: Hapus useRouter karena tidak digunakan
// import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Loader2,
  AlertCircle,
  Users,
  ClipboardList,
  BookCheck,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Interface untuk data statistik
interface DetailedStatsData {
  userStats: { role: string; count: number }[];
  taskStats: {
    totalTasks: number;
    totalSubmissions: number;
    averageGrade: number | null;
  };
  quizStats: {
    totalQuizzes: number;
    totalAttempts: number;
    averageScore: number | null;
  };
}

// Palet warna baru yang lebih modern untuk chart
const CHART_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899"];

// Tooltip kustom untuk Recharts agar sesuai tema
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-card border border-border rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-foreground">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// Kartu Induk untuk setiap seksi statistik
const StatSectionCard = ({ title, icon: Icon, children, color }: any) => (
  <div className="bg-card text-card-foreground rounded-xl shadow-lg border border-border flex flex-col overflow-hidden">
    <div
      className={`flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r ${color}`}
    >
      <Icon className="h-6 w-6 text-white" />
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    <div className="p-6 flex-grow">{children}</div>
  </div>
);

// Komponen untuk menampilkan satu item statistik (angka & label)
const StatItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="p-4 bg-secondary/50 rounded-lg text-center">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-4xl font-bold text-foreground mt-1">{value}</p>
  </div>
);

export default function StatisticsPage() {
  // FIX: Hapus useRouter
  // const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [statsData, setStatsData] = useState<DetailedStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetailedStats = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/stats/detailed");
      setStatsData(response.data?.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal mengambil data statistik.";
      setError(errorMessage);
      toast({
        title: "Gagal Mengambil Statistik",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    // FIX: ESLint warning diabaikan karena dependensi ini memang benar diperlukan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, toast]);

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "MENTOR") {
      fetchDetailedStats();
    }
  }, [user, fetchDetailedStats]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat statistik...</p>
      </div>
    );
  }

  if (user?.role !== "ADMIN" && user?.role !== "MENTOR") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Akses Ditolak
        </h2>
        <p className="text-muted-foreground mb-4">
          Hanya Admin dan Mentor yang dapat mengakses halaman ini.
        </p>
        {/* Tombol kembali ini bisa menggunakan Link atau router.back() jika ada history */}
      </div>
    );
  }

  // FIX: Pengecekan `!statsData` yang kuat sebelum merender
  if (error || !statsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Gagal Memuat Data
        </h2>
        <p className="text-muted-foreground mb-4">
          {error || "Data statistik tidak ditemukan."}
        </p>
        <button
          onClick={fetchDetailedStats}
          className="inline-flex items-center gap-2 px-4 py-2 font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const userChartData = statsData.userStats.map((stat) => ({
    name: stat.role.charAt(0).toUpperCase() + stat.role.slice(1).toLowerCase(),
    value: stat.count,
  }));

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-8">
        <div className="relative p-8 rounded-2xl shadow-xl text-white overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800">
          <BarChart3 className="absolute -right-10 -bottom-10 h-48 w-48 text-white/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold">Statistik Platform</h1>
            <p className="mt-2 text-white/80 max-w-lg">
              Analisis mendalam mengenai aktivitas pengguna, tugas, dan kuis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <StatSectionCard
            title="Distribusi Pengguna"
            icon={Users}
            color="from-purple-600 to-indigo-700"
          >
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                  }) => {
                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 1.25;
                    const x =
                      cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y =
                      cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="currentColor"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        className="text-xs font-semibold fill-foreground"
                      >{`${(percent * 100).toFixed(0)}%`}</text>
                    );
                  }}
                >
                  {userChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      className="focus:outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </StatSectionCard>

          <StatSectionCard
            title="Statistik Tugas"
            icon={ClipboardList}
            color="from-blue-600 to-sky-700"
          >
            <div className="grid grid-cols-1 gap-4">
              <StatItem
                label="Total Tugas"
                value={statsData.taskStats.totalTasks}
              />
              <StatItem
                label="Total Pengumpulan"
                value={statsData.taskStats.totalSubmissions}
              />
              <StatItem
                label="Rata-rata Nilai"
                value={statsData.taskStats.averageGrade?.toFixed(1) ?? "N/A"}
              />
            </div>
          </StatSectionCard>

          <StatSectionCard
            title="Statistik Kuis"
            icon={BookCheck}
            color="from-teal-600 to-green-700"
          >
            <div className="grid grid-cols-1 gap-4">
              <StatItem
                label="Total Kuis"
                value={statsData.quizStats.totalQuizzes}
              />
              <StatItem
                label="Total Pengerjaan"
                value={statsData.quizStats.totalAttempts}
              />
              <StatItem
                label="Rata-rata Skor"
                value={statsData.quizStats.averageScore?.toFixed(1) ?? "N/A"}
              />
            </div>
          </StatSectionCard>
        </div>
      </div>
    </ProtectedRoute>
  );
}
