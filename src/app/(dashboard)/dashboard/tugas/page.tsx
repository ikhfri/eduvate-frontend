/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  format,
  parseISO,
  isPast,
  differenceInDays,
  formatDistanceToNow,
  isValid as isValidDate,
} from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  BookText,
  CalendarClock,
  UserCircle2,
  Info,
  Award,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/fetchApi";

interface MySubmission {
  grade?: number | null;
  submittedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  submissionStartDate: string;
  deadline: string;
  author?: {
    name: string;
    email?: string;
  };
  mySubmission?: MySubmission | null;
}

// Komponen Kartu Tugas dengan Animasi Dinamis
const TaskCard = ({
  task,
  statusBadge,
  ctaButton,
}: {
  task: Task;
  statusBadge: JSX.Element;
  ctaButton: JSX.Element;
}) => (
  <div className="bg-card text-card-foreground rounded-xl shadow-lg border border-border flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 animate-bounce-in relative">
  
    {/* Header dengan Gradient dan Animasi */}
    <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative animate-fade-in">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10 animate-pulse-slow"></div>
      <div className="relative z-10">
        <h3 className="text-lg font-bold line-clamp-2 leading-tight drop-shadow-sm animate-text-pop">
          {task.title}
        </h3>
        <div className="flex items-center text-xs text-white/80 pt-2">
          <UserCircle2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 animate-wiggle" />
          Dibuat oleh: {task.author?.name || "N/A"}
        </div>
      </div>
    </div>

    {/* Konten dengan Efek Bersih dan Animasi */}
    <div className="p-5 flex-grow">
      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 animate-slide-in">
        {task.description || "Tidak ada deskripsi."}
      </p>
      <div className="space-y-2 text-sm text-foreground">
        <div className="flex items-center gap-2.5 animate-slide-in [animation-delay:0.1s]">
          <CalendarClock className="w-4 h-4 text-green-500 flex-shrink-0 animate-bounce-slow" />
          <span className="font-medium">Mulai:</span>
          <span className="text-muted-foreground">
            {formatDateSafe(task.submissionStartDate, "dd MMM yyyy, HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-2.5 animate-slide-in [animation-delay:0.2s]">
          <CalendarClock className="w-4 h-4 text-red-500 flex-shrink-0 animate-bounce-slow" />
          <span className="font-medium">Deadline:</span>
          <span className="text-muted-foreground">
            {formatDateSafe(task.deadline, "dd MMM yyyy, HH:mm")}
          </span>
        </div>
      </div>
    </div>

    {/* Footer dengan Interaksi */}
    <div className="flex justify-between items-center border-t border-border p-4 bg-secondary/20 mt-auto">
      {statusBadge}
      {ctaButton}
    </div>
  </div>
);

const formatDateSafe = (dateString: string, formatPattern: string) => {
  if (!dateString || !isValidDate(parseISO(dateString))) return "N/A";
  return format(parseISO(dateString), formatPattern, { locale: LocaleID });
};

export default function StudentTaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchApi("/tasks", { token });
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      } catch (err: any) {
        console.error("Gagal mengambil daftar tugas:", err);
        const errorMessage =
          err.message || "Gagal mengambil data tugas dari server.";
        setError(errorMessage);
        toast({
          title: "Error Mengambil Tugas",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading) {
      if (user) {
        fetchTasks();
      } else {
        router.push("/login");
      }
    }
  }, [user, authLoading, toast, token, router]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDeadline = parseISO(a.deadline);
      const bDeadline = parseISO(b.deadline);
      const aIsPast = isPast(aDeadline);
      const bIsPast = isPast(bDeadline);
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      return aDeadline.getTime() - bDeadline.getTime();
    });
  }, [tasks]);

  const getTaskStatusBadge = (task: Task) => {
    const baseClasses =
      "text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse-slow";
    if (user?.role === "STUDENT" && task.mySubmission) {
      if (typeof task.mySubmission.grade === "number") {
        const grade = task.mySubmission.grade;
        if (grade >= 80)
          return (
            <div
              className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300`}
            >
              <Award className="h-3.5 w-3.5 animate-wiggle" /> Nilai: {grade}
            </div>
          );
        if (grade >= 70)
          return (
            <div
              className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300`}
            >
              <Award className="h-3.5 w-3.5 animate-wiggle" /> Nilai: {grade}
            </div>
          );
        return (
          <div
            className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300`}
          >
            <Award className="h-3.5 w-3.5 animate-wiggle" /> Nilai: {grade}
          </div>
        );
      }
      return (
        <div
          className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300`}
        >
          <Sparkles className="h-3.5 w-3.5 animate-twinkle" /> Sudah Dikumpulkan
        </div>
      );
    }
    if (!task.deadline || !isValidDate(parseISO(task.deadline)))
      return (
        <div
          className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}
        >
          N/A
        </div>
      );
    const deadlineDate = parseISO(task.deadline);
    const timeLeftText = formatDistanceToNow(deadlineDate, {
      addSuffix: true,
      locale: LocaleID,
    });
    if (isPast(deadlineDate))
      return (
        <div
          className={`${baseClasses} bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400`}
        >
          Lewat Tenggat
        </div>
      );
    const daysLeft = differenceInDays(deadlineDate, new Date());
    if (daysLeft <= 1)
      return (
        <div
          className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300`}
        >
          {timeLeftText}
        </div>
      );
    if (daysLeft <= 3)
      return (
        <div
          className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300`}
        >
          {timeLeftText}
        </div>
      );
    if (daysLeft <= 7)
      return (
        <div
          className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300`}
        >
          {timeLeftText}
        </div>
      );
    return (
      <div
        className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}
      >
        {timeLeftText}
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ADMIN", "MENTOR"]}>
      <div className="space-y-8 relative">
        {/* Animated Background Bubbles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-4 h-4 bg-blue-300 rounded-full animate-bubble bubble-1" />
          <div className="absolute w-6 h-6 bg-pink-300 rounded-full animate-bubble bubble-2" />
          <div className="absolute w-5 h-5 bg-yellow-300 rounded-full animate-bubble bubble-3" />
          <div className="absolute w-3 h-3 bg-green-300 rounded-full animate-bubble bubble-4" />
        </div>

        {/* Header dengan Animasi */}
        <div className="relative p-8 rounded-2xl shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden animate-bounce-in">
          <BookText className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10 animate-pulse-slow" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold animate-text-glow">
                Daftar Tugas
              </h1>
              <p className="mt-2 text-white/80 animate-fade-in">
                Jelajahi dan selesaikan tugas seru di sini!
              </p>
            </div>
            {(user?.role === "ADMIN" || user?.role === "MENTOR") && (
              <Link
                href="/dashboard/manage-tugas/new"
                className="inline-flex items-center gap-2 px-4 py-2 font-semibold bg-white/90 text-primary rounded-lg shadow-sm hover:bg-white transition-colors flex-shrink-0 animate-pulse-slow"
              >
                <PlusCircle className="w-5 h-5 animate-wiggle" />
                Tambah Tugas Baru
              </Link>
            )}
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in relative overflow-hidden">
         
          <Sparkles className="h-6 w-6 animate-bounce-slow" />
          <p className="text-sm font-medium animate-text-glow">
            Setiap tugas adalah petualangan baru menuju kesuksesan!
          </p>
        </div>

        {isLoading ? (
          <div className="text-center p-16 bg-card rounded-xl border-2 border-dashed border-border animate-pulse">
            <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
            <h3 className="text-2xl font-semibold text-foreground mt-4">
              Memuat Tugas...
            </h3>
          </div>
        ) : error ? (
          <div className="text-center p-16 bg-card rounded-xl border-2 border-dashed border-border animate-pulse">
            <Info className="mx-auto h-16 w-16 text-primary/50 mb-4" />
            <h3 className="text-2xl font-semibold text-foreground">
              Gagal Memuat Tugas
            </h3>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center p-16 bg-card rounded-xl border-2 border-dashed border-border animate-bounce-in">
            <Info className="mx-auto h-16 w-16 text-primary/50 mb-4 animate-wiggle" />
            <h3 className="text-2xl font-semibold text-foreground animate-text-pop">
              Belum Ada Tugas
            </h3>
            <p className="mt-2 text-muted-foreground animate-fade-in">
              Saat ini belum ada tugas yang tersedia. Ayo tunggu petualangan
              berikutnya!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {sortedTasks.map((task) => {
              const ctaButton = (
                <Link
                  href={`/dashboard/tugas/${task.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors animate-pulse-slow"
                >
                  <span>
                    {user?.role === "STUDENT" &&
                    task.mySubmission &&
                    typeof task.mySubmission.grade === "number"
                      ? "Lihat Penilaian"
                      : user?.role === "STUDENT" && task.mySubmission
                      ? "Lihat Status"
                      : user?.role === "STUDENT"
                      ? "Kerjakan Sekarang"
                      : "Lihat Detail"}
                  </span>
                  <ArrowRight className="h-4 w-4 animate-bounce-slow" />
                </Link>
              );
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  statusBadge={getTaskStatusBadge(task)}
                  ctaButton={ctaButton}
                />
              );
            })}
          </div>
        )}
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
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
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
        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }
        @keyframes bounceSlow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
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

        .animate-bounce-in {
          animation: bounceIn 0.8s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.8s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
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
        .animate-wiggle {
          animation: wiggle 1.5s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
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
      `}</style>
    </ProtectedRoute>
  );
}
