/* eslint-disable react-hooks/exhaustive-deps */
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
  Sparkles,
  Cloud,
} from "lucide-react";

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
  color: "blue" | "green" | "purple" | "pink";
  description: string;
}) => {
  const colorVariants = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    pink: "from-pink-500 to-pink-600",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colorVariants[color]} text-white p-6 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-2xl animate-bounce-in`}
    >
      <Icon className="absolute -right-4 -bottom-4 h-28 w-28 text-white/20 animate-pulse-slow" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg animate-wiggle">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold animate-text-pop">{title}</h3>
        </div>
        <div className="mt-4">
          <p className="text-5xl font-bold animate-count-up">
            {loading ? <Loader2 className="animate-spin h-10 w-10" /> : value}
          </p>
          <p className="text-sm opacity-80 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

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
  color: "blue" | "green" | "yellow";
}) => {
  const colorVariants = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
  };
  return (
    <div
      onClick={onClick}
      className={`${colorVariants[color]} text-white p-6 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-3 group relative overflow-hidden animate-slide-in`}
    >
      <Icon className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:animate-spin-slow" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 p-2 rounded-lg group-hover:animate-bounce">
            <Icon className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold animate-text-pop">{title}</h4>
        </div>
        <p className="text-sm text-white/80">{description}</p>
        <div className="absolute top-4 right-4 bg-white/20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

const MotivationalQuote = () => {
  const quotes = [
    "Belajar adalah petualangan seru setiap hari!",
    "Langkah kecil hari ini menuju kesuksesan besar!",
    "Ilmu adalah kunci untuk membuka mimpimu!",
    "Terus berusaha, kamu pasti bisa!",
    "Setiap tantangan adalah kesempatan belajar!",
  ];
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in relative overflow-hidden">
      <Sparkles className="h-6 w-6 animate-bounce-slow" />
      <p className="text-sm font-medium animate-text-glow">{quote}</p>
    </div>
  );
};

const ProgressTracker = ({
  completedTasks,
  totalTasks,
  completedQuizzes,
  totalQuizzes,
}: {
  completedTasks: number;
  totalTasks: number;
  completedQuizzes: number;
  totalQuizzes: number;
}) => {
  const totalItems = totalTasks + totalQuizzes;
  const completedItems = completedTasks + completedQuizzes;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg animate-bounce-in">
      <div className="flex items-center gap-3 mb-4">
        <Award className="h-6 w-6 text-yellow-500 animate-wiggle" />
        <h3 className="text-xl font-semibold animate-text-pop">
          Progres Belajar
        </h3>
      </div>
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 transition-all duration-1000 animate-pulse-slow"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {completedItems} dari {totalItems} tugas dan kuis selesai (
        {Math.round(progress)}%)
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<any>({});
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      const response = await axiosInstance.get("/stats");
      setStats(response.data?.data || {});
    } catch (error) {
      console.error("Gagal memuat statistik dashboard:", error);
      setStats({});
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchStats();
    } else if (!user && !authLoading) {
      setLoadingStats(false);
    }
  }, [user, authLoading, fetchStats]);

  const getTimeBasedInfo = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return {
        text: "Selamat Pagi",
        Icon: Sun,
        gradient: "from-yellow-400 via-orange-400 to-pink-500",
        animationClass: "animate-sunrise",
        skyObject: "sun",
      };
    }
    if (hour >= 11 && hour < 15) {
      return {
        text: "Selamat Siang",
        Icon: CloudSun,
        gradient: "from-cyan-400 via-sky-400 to-blue-500",
        animationClass: "animate-day",
        skyObject: "sun",
      };
    }
    if (hour >= 15 && hour < 18) {
      return {
        text: "Selamat Sore",
        Icon: Sunset,
        gradient: "from-orange-500 via-red-400 to-purple-500",
        animationClass: "animate-sunset",
        skyObject: "sun",
      };
    }
    return {
      text: "Selamat Malam",
      Icon: Moon,
      gradient: "from-indigo-800 via-purple-800 to-black",
      animationClass: "animate-moon",
      skyObject: "moon",
    };
  };

  const {
    text: greeting,
    Icon: GreetingIcon,
    gradient: greetingGradient,
    animationClass,
    skyObject,
  } = getTimeBasedInfo();

  const renderStudentDashboard = () => (
    <>
      <MotivationalQuote />
      <ProgressTracker
        completedTasks={stats.completedTasks ?? 0}
        totalTasks={(stats.activeTasks ?? 0) + (stats.completedTasks ?? 0)}
        completedQuizzes={stats.completedQuizzes ?? 0}
        totalQuizzes={
          (stats.availableQuizzes ?? 0) + (stats.completedQuizzes ?? 0)
        }
      />
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-foreground flex items-center gap-2 animate-text-pop">
          <GraduationCap className="h-6 w-6 text-blue-500 animate-wiggle" />
          Aktivitas Belajar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            title="Tugas Harian"
            description="Jelajahi tugas seru dari mentor!"
            icon={ClipboardList}
            onClick={() => router.push("/dashboard/tugas")}
            color="blue"
          />
          <ActionCard
            title="Kuis & Latihan"
            description="Tantang dirimu dengan kuis asyik!"
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
          description="Tugas seru yang menunggumu!"
        />
        <StatCard
          title="Kuis Tersedia"
          value={stats.availableQuizzes ?? 0}
          icon={BookCheck}
          loading={loadingStats}
          color="green"
          description="Kuis asyik untuk diuji!"
        />
        <StatCard
          title="Tugas Selesai"
          value={stats.completedTasks ?? 0}
          icon={Award}
          loading={loadingStats}
          color="pink"
          description="Tugas yang telah kamu taklukkan!"
        />
      </div>
    </>
  );

  const renderAdminMentorDashboard = () => (
    <>
      <MotivationalQuote />
      <div className="bg-card border border-border rounded-xl overflow-hidden animate-bounce-in">
        <div className="p-4 bg-primary/10 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 animate-text-pop">
            <UserCog className="h-6 w-6 text-purple-500 animate-wiggle" />
            Admin Panel
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-4 text-muted-foreground">
            <li className="flex items-center gap-3 hover:text-primary transition-colors animate-slide-in">
              <FilePenLine className="h-5 w-5 text-primary animate-bounce-slow" />
              <span>Buat tugas seru dan materi belajar.</span>
            </li>
            <li className="flex items-center gap-3 hover:text-primary transition-colors animate-slide-in [animation-delay:0.2s]">
              <ListChecks className="h-5 w-5 text-primary animate-bounce-slow" />
              <span>Kelola kuis dan lihat progres siswa.</span>
            </li>
            {user?.role === "ADMIN" && (
              <li className="flex items-center gap-3 hover:text-primary transition-colors animate-slide-in [animation-delay:0.4s]">
                <UserCog className="h-5 w-5 text-primary animate-bounce-slow" />
                <span>Atur pengguna dan peran sistem.</span>
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
          title="Pengguna Aktif"
          value={stats.users ?? 0}
          icon={Users}
          loading={loadingStats}
          color="purple"
          description="Pengguna yang aktif di sistem."
        />
      </div>
    </>
  );

  return (
    <ProtectedRoute>
      <div className="space-y-8 relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-4 h-4 bg-blue-300 rounded-full animate-bubble bubble-1" />
          <div className="absolute w-6 h-6 bg-pink-300 rounded-full animate-bubble bubble-2" />
          <div className="absolute w-5 h-5 bg-yellow-300 rounded-full animate-bubble bubble-3" />
          <div className="absolute w-3 h-3 bg-green-300 rounded-full animate-bubble bubble-4" />
        </div>
        {user && (
          <div
            className={`relative p-8 rounded-2xl shadow-2xl text-white overflow-hidden bg-gradient-to-br ${greetingGradient} animate-bounce-in`}
          >
            {/* Animated Clouds */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <Cloud
                className="absolute w-24 h-24 text-white/30 animate-cloud-1"
                style={{ top: "20%", left: "-10%" }}
              />
              <Cloud
                className="absolute w-16 h-16 text-white/20 animate-cloud-2"
                style={{ top: "40%", left: "-15%" }}
              />
              <Cloud
                className="absolute w-20 h-20 text-white/25 animate-cloud-3"
                style={{ top: "60%", left: "-20%" }}
              />
            </div>
            <div
              className={`absolute w-24 h-24 rounded-full ${animationClass} z-10`}
            >
              {skyObject === "sun" && (
                <div className="w-full h-full bg-yellow-300 rounded-full shadow-[0_0_40px_15px_rgba(253,224,71,0.8)] animate-pulse-slow" />
              )}
              {skyObject === "moon" && (
                <div className="w-full h-full bg-slate-200 rounded-full shadow-[0_0_30px_10px_rgba(226,232,240,0.7)] animate-pulse-slow" />
              )}
            </div>
            {skyObject === "moon" && (
              <>
                <Sparkles className="absolute top-[15%] left-[10%] h-4 w-4 text-white/70 animate-twinkle" />
                <Sparkles className="absolute top-[25%] left-[75%] h-3 w-3 text-white/70 animate-twinkle [animation-delay:0.3s]" />
                <Sparkles className="absolute top-[50%] left-[40%] h-5 w-5 text-white/70 animate-twinkle [animation-delay:0.6s]" />
                <Sparkles className="absolute top-[70%] left-[20%] h-3 w-3 text-white/70 animate-twinkle [animation-delay:0.9s]" />
              </>
            )}
            <div className="relative z-20">
              <div className="flex items-center gap-4 mb-4">
                <GreetingIcon className="h-10 w-10 animate-wiggle-slow" />
                <div>
                  <p className="text-3xl font-semibold animate-text-pop tracking-wide">
                    {greeting},
                  </p>
                  <h1 className="text-5xl  font-extrabold animate-text-glow leading-tight">
                    {user.name === "Putri Nur'Aini"
                      ? "bangladesh"
                      : user.name?.split(" ")[0] || user.email}
                    !
                  </h1>
                </div>
              </div>
              <p className="text-lg text-white/90 animate-fade-in max-w-md">
                Peran Anda:{" "}
                <span className="font-bold uppercase">{user.role}</span>. Mari
                buat hari ini penuh inspirasi dan prestasi!
              </p>
            </div>
          </div>
        )}
        {user?.role === "STUDENT"
          ? renderStudentDashboard()
          : renderAdminMentorDashboard()}
      </div>
      <style jsx global>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes countUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }
        @keyframes wiggleSlow {
          0%,
          100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }
        @keyframes textPop {
          0% {
            transform: scale(0.9);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes textGlow {
          0%,
          100% {
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.5),
              0 0 15px rgba(255, 255, 255, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.9),
              0 0 30px rgba(255, 255, 255, 0.5);
          }
        }
        @keyframes pulseSlow {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes bubble {
          0% {
            transform: translateY(100vh) scale(0.5);
            opacity: 0.2;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0.8;
          }
        }
        @keyframes sunrise {
          0% {
            transform: translateY(50px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes day {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-10px);
          }
        }
        @keyframes sunset {
          0% {
            transform: translateY(-50px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes moon {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes cloudMove1 {
          0% {
            transform: translateX(-10vw);
            opacity: 0.3;
          }
          100% {
            transform: translateX(110vw);
            opacity: 0.5;
          }
        }
        @keyframes cloudMove2 {
          0% {
            transform: translateX(-15vw);
            opacity: 0.2;
          }
          100% {
            transform: translateX(115vw);
            opacity: 0.4;
          }
        }
        @keyframes cloudMove3 {
          0% {
            transform: translateX(-20vw);
            opacity: 0.25;
          }
          100% {
            transform: translateX(120vw);
            opacity: 0.45;
          }
        }
        .animate-bounce-in {
          animation: bounceIn 0.8s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.8s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-count-up {
          animation: countUp 1s ease-out forwards;
        }
        .animate-wiggle {
          animation: wiggle 1.5s ease-in-out infinite;
        }
        .animate-wiggle-slow {
          animation: wiggleSlow 2s ease-in-out infinite;
        }
        .animate-text-pop {
          animation: textPop 0.5s ease-out forwards;
        }
        .animate-text-glow {
          animation: textGlow 2s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spinSlow 12s linear infinite;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-sunrise {
          animation: sunrise 1.5s ease-out forwards;
          top: 20px;
          left: 20px;
        }
        .animate-day {
          animation: day 6s ease-in-out infinite alternate;
          top: 15px;
          left: 45%;
        }
        .animate-sunset {
          animation: sunset 1.5s ease-in forwards;
          top: 20px;
        }
        .animate-moon {
          animation: moon 2s ease-in-out forwards;
          top: 20px;
          right: 30px;
        }
        .bubble-1 {
          left: 10%;
          animation: bubble 10s linear infinite;
          animation-delay: 0s;
        }
        .bubble-2 {
          left: 30%;
          animation: bubble 14s linear infinite;
          animation-delay: 3s;
        }
        .bubble-3 {
          left: 60%;
          animation: bubble 12s linear infinite;
          animation-delay: 6s;
        }
        .bubble-4 {
          left: 80%;
          animation: bubble 16s linear infinite;
          animation-delay: 9s;
        }
        .animate-cloud-1 {
          animation: cloudMove1 20s linear infinite;
        }
        .animate-cloud-2 {
          animation: cloudMove2 25s linear infinite;
          animation-delay: 5s;
        }
        .animate-cloud-3 {
          animation: cloudMove3 30s linear infinite;
          animation-delay: 10s;
        }
      `}</style>
    </ProtectedRoute>
  );
}
