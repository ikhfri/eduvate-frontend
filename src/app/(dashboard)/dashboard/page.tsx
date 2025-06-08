// app/(dashboard)/dashboard/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import axiosInstance from "@/lib/axiosInstance";
import {
  Loader2,
  BookCheck,
  ClipboardList,
  Users,
  GraduationCap,
  ArrowRight,
  ListChecks,
  FilePenLine,
  UserCog,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Award,
} from "lucide-react";

// Komponen Kartu Statistik Gradien
const StatCard = ({
  title,
  value,
  icon: Icon,
  loading,
  color,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
  color: "blue" | "green" | "purple";
  description: string;
}) => {
  const colorVariants = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colorVariants[color]} text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl`}
    >
      <Icon className="absolute -right-4 -bottom-4 h-28 w-28 text-white/20" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="mt-4">
          <p className="text-5xl font-bold">
            {loading ? <Loader2 className="animate-spin h-10 w-10" /> : value}
          </p>
          <p className="text-sm opacity-80 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Komponen Kartu Aksi Berwarna
const ActionCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  color: "blue" | "green";
}) => {
  const colorVariants = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
  };
  return (
    <div
      onClick={onClick}
      className={`${colorVariants[color]} text-white p-6 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden`}
    >
      <Icon className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 p-2 rounded-lg">
            <Icon className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold">{title}</h4>
        </div>
        <p className="text-sm text-white/80">{description}</p>
        <div className="absolute top-4 right-4 bg-white/20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<any>({}); // Dibuat fleksibel untuk menampung semua jenis stats
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      // Selalu memanggil satu endpoint /stats yang cerdas
      const response = await axiosInstance.get("/stats");
      const statsData = response.data?.data || {};
      setStats(statsData);
    } catch (error) {
      console.error("Gagal memuat statistik dashboard:", error);
      setStats({}); // Reset jika gagal
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchStats();
    else if (!user && !authLoading) setLoadingStats(false);
  }, [user, authLoading, fetchStats]);

  const getTimeBasedInfo = () => {
    const hour = new Date().getHours();
    if (hour < 11)
      return {
        text: "Selamat Pagi",
        Icon: Sun,
        gradient: "from-amber-400 to-orange-500",
      };
    if (hour < 15)
      return {
        text: "Selamat Siang",
        Icon: CloudSun,
        gradient: "from-sky-400 to-cyan-500",
      };
    if (hour < 18)
      return {
        text: "Selamat Sore",
        Icon: Sunset,
        gradient: "from-indigo-500 to-purple-600",
      };
    return {
      text: "Selamat Malam",
      Icon: Moon,
      gradient: "from-gray-800 via-gray-900 to-black",
    };
  };

  const {
    text: greeting,
    Icon: GreetingIcon,
    gradient: greetingGradient,
  } = getTimeBasedInfo();

  const renderStudentDashboard = () => (
    <>
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="h-6 w-6" /> Aktivitas Belajar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            title="Tugas Harian"
            description="Lihat dan selesaikan tugas dari mentor."
            icon={ClipboardList}
            onClick={() => router.push("/dashboard/tugas")}
            color="blue"
          />
          <ActionCard
            title="Kuis & Latihan"
            description="Uji pemahamanmu lewat kuis interaktif."
            icon={BookCheck}
            onClick={() => router.push("/dashboard/kuis")}
            color="green"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Tugas Aktif"
          value={stats.activeTasks ?? 0}
          icon={ClipboardList}
          loading={loadingStats}
          color="blue"
          description="Tugas yang perlu kamu kerjakan."
        />
        <StatCard
          title="Kuis Tersedia"
          value={stats.availableQuizzes ?? 0}
          icon={BookCheck}
          loading={loadingStats}
          color="green"
          description="Kuis yang siap untuk diuji."
        />
        <StatCard
          title="Tugas Selesai"
          value={stats.completedTasks ?? 0}
          icon={Award}
          loading={loadingStats}
          color="purple"
          description="Tugas yang telah kamu kumpulkan."
        />
      </div>
    </>
  );

  const renderAdminMentorDashboard = () => (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 bg-primary/10 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">
            Panel Pengelolaan
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-4 text-muted-foreground">
            <li className="flex items-center gap-3">
              <FilePenLine className="h-5 w-5 text-primary" />
              <span>Kelola tugas dan materi.</span>
            </li>
            <li className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-primary" />
              <span>Kelola kuis dan hasil peserta.</span>
            </li>
            {user?.role === "ADMIN" && (
              <li className="flex items-center gap-3">
                <UserCog className="h-5 w-5 text-primary" />
                <span>Kelola semua pengguna sistem.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Tugas"
          value={stats.tasks ?? 0}
          icon={ClipboardList}
          loading={loadingStats}
          color="blue"
          description="Semua tugas yang telah dibuat."
        />
        <StatCard
          title="Total Kuis"
          value={stats.quizzes ?? 0}
          icon={BookCheck}
          loading={loadingStats}
          color="green"
          description="Kuis interaktif yang tersedia."
        />
        <StatCard
          title="Pengguna Terdaftar"
          value={stats.users ?? 0}
          icon={Users}
          loading={loadingStats}
          color="purple"
          description="Seluruh pengguna dalam sistem."
        />
      </div>
    </>
  );

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {user && (
          <>
            <div
              className={`relative p-8 rounded-2xl shadow-xl text-white overflow-hidden bg-gradient-to-br ${greetingGradient}`}
            >
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-5"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <GreetingIcon className="h-8 w-8" />
                  <p className="text-2xl font-semibold">{greeting},</p>
                </div>
                <h1 className="text-4xl font-bold">
                  {user.name?.split(" ")[0] || user.email}!
                </h1>
                <p className="mt-2 text-white/80">
                  Peran Anda: <span className="font-bold">{user.role}</span>.
                  Semoga harimu menyenangkan!
                </p>
              </div>
            </div>

            {user.role === "STUDENT"
              ? renderStudentDashboard()
              : renderAdminMentorDashboard()}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
