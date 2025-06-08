/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { fetchApi } from "@/lib/fetchApi";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid, isPast } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import {
  Loader2,
  AlertTriangle,
  BookCopy,
  PlusCircle,
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  Users,
  X,
} from "lucide-react";

// --- INTERFACE & HELPER ---
interface AdminTask {
  id: string;
  title: string;
  course?: { name: string };
  deadline: string;
  createdAt: string;
  _count?: { submissions: number };
}

const formatDateSafe = (
  dateString: string | undefined | null,
  formatPattern: string
): string => {
  if (!dateString) return "N/A";
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.warn(`Invalid date string received: ${dateString}`);
      return "Tanggal tidak valid";
    }
    return format(date, formatPattern, { locale: LocaleID });
  } catch (error) {
    console.error(`Error formatting date string: ${dateString}`, error);
    return "Error format";
  }
};

// --- KOMPONEN KUSTOM ---
const ActionMenu = ({
  onEdit,
  onDelete,
  onViewSubmissions,
  onViewDetail,
}: {
  task: AdminTask;
  onEdit: () => void;
  onDelete: () => void;
  onViewSubmissions: () => void;
  onViewDetail: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-accent transition-colors"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-10 animate-in fade-in-0 zoom-in-95">
          <div className="p-1">
            <button
              onClick={onViewSubmissions}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <Users className="h-4 w-4" /> Lihat Submissions
            </button>
            <button
              onClick={onViewDetail}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <Eye className="h-4 w-4" /> Lihat Detail
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={onEdit}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
            >
              <Edit3 className="h-4 w-4" /> Edit Tugas
            </button>
            <button
              onClick={onDelete}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Hapus Tugas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ConfirmDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md m-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between p-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              Konfirmasi Penghapusan
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Anda yakin ingin menghapus tugas{" "}
              <span className="font-semibold text-destructive">
                {taskTitle}
              </span>{" "}
              secara permanen? Aksi ini tidak dapat diurungkan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent -mt-2 -mr-2"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-border bg-secondary/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-border hover:bg-accent"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ManageTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<AdminTask | null>(null);

  const fetchAdminTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchApi("/tasks/", { token });
      setTasks(data.tasks || data);
    } catch (err: any) {
      console.error("Gagal mengambil daftar tugas admin:", err);
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
  }, [toast, token]);

  useEffect(() => {
    if (!authLoading) {
      if (user && (user.role === "ADMIN" || user.role === "MENTOR")) {
        fetchAdminTasks();
      } else if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, authLoading, router, fetchAdminTasks]);

  const handleDeleteClick = (task: AdminTask) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await fetchApi(`/tasks/${taskToDelete.id}`, { method: "DELETE", token });
      toast({
        title: "Tugas Dihapus",
        description: `Tugas "${taskToDelete.title}" telah berhasil dihapus.`,
      });
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskToDelete.id)
      );
    } catch (err: any) {
      console.error("Gagal menghapus tugas:", err);
      toast({
        title: "Gagal Menghapus",
        description: err.message || "Terjadi kesalahan saat menghapus tugas.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tasks]);

  if (authLoading || (isLoading && tasks.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          Memuat data kelola tugas...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Oops! Terjadi Kesalahan
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <button
          onClick={fetchAdminTasks}
          className="inline-flex items-center gap-2 px-4 py-2 font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-8">
        <div className="relative p-8 rounded-2xl shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden">
          <BookCopy className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold">Kelola Tugas</h1>
              <p className="mt-2 text-white/80 max-w-lg">
                Buat, edit, dan kelola semua tugas untuk siswa Anda di sini.
              </p>
            </div>
            <Link
              href="/dashboard/manage-tugas/new"
              className="inline-flex items-center gap-2 px-4 py-2 font-semibold bg-white/90 text-blue-700 rounded-lg shadow-sm hover:bg-white transition-colors flex-shrink-0"
            >
              <PlusCircle className="w-5 h-5" /> Tambah Tugas Baru
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg">
          <div className="p-5 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">
              Daftar Semua Tugas
            </h2>
            <p className="text-muted-foreground text-sm">
              Total {tasks.length} tugas ditemukan.
            </p>
          </div>

          {isLoading && tasks.length > 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin inline-block" />
            </div>
          )}

          {!isLoading && tasks.length === 0 && !error ? (
            <div className="text-center py-16 px-6">
              <BookCopy className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">
                Belum Ada Tugas Dibuat
              </h3>
              <p className="text-muted-foreground mt-1">
                Mulai dengan menambahkan tugas baru untuk siswa Anda.
              </p>
            </div>
          ) : sortedTasks.length > 0 ? (
            <div>
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="p-4 text-left font-semibold text-muted-foreground">
                        Judul Tugas
                      </th>
                      <th className="p-4 text-left font-semibold text-muted-foreground">
                        Deadline
                      </th>
                      <th className="p-4 text-left font-semibold text-muted-foreground">
                        Dibuat Pada
                      </th>
                      <th className="p-4 text-center font-semibold text-muted-foreground">
                        Submissions
                      </th>
                      <th className="p-4 text-right font-semibold text-muted-foreground w-20">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-border last:border-b-0 hover:bg-accent transition-colors"
                      >
                        <td className="p-4 font-medium text-foreground">
                          {task.title}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {formatDateSafe(task.deadline, "dd MMM yyyy, HH:mm")}{" "}
                          {task.deadline && isPast(parseISO(task.deadline)) && (
                            <span className="ml-2 text-xs font-semibold text-destructive">
                              (Lewat)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {formatDateSafe(task.createdAt, "dd MMM yyyy")}
                        </td>
                        <td className="p-4 text-center font-medium text-foreground">
                          {task._count?.submissions ?? 0}
                        </td>
                        <td className="p-4 flex justify-end">
                          <ActionMenu
                            task={task}
                            onDelete={() => handleDeleteClick(task)}
                            onEdit={() =>
                              router.push(
                                `/dashboard/manage-tugas/${task.id}/edit`
                              )
                            }
                            onViewDetail={() =>
                              router.push(`/dashboard/tugas/${task.id}`)
                            }
                            onViewSubmissions={() =>
                              router.push(
                                `/dashboard/manage-tugas/${task.id}/submissions`
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-secondary/50 p-4 rounded-lg border border-border space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-foreground pr-4">
                        {task.title}
                      </h3>
                      <ActionMenu
                        task={task}
                        onDelete={() => handleDeleteClick(task)}
                        onEdit={() =>
                          router.push(`/dashboard/manage-tugas/${task.id}/edit`)
                        }
                        onViewDetail={() =>
                          router.push(`/dashboard/tugas/${task.id}`)
                        }
                        onViewSubmissions={() =>
                          router.push(
                            `/dashboard/manage-tugas/${task.id}/submissions`
                          )
                        }
                      />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        <span className="font-semibold w-24 inline-block">
                          Deadline:
                        </span>{" "}
                        {formatDateSafe(task.deadline, "dd MMM, HH:mm")}{" "}
                        {task.deadline && isPast(parseISO(task.deadline)) && (
                          <span className="font-semibold text-destructive">
                            (Lewat)
                          </span>
                        )}
                      </p>
                      <p>
                        <span className="font-semibold w-24 inline-block">
                          Submissions:
                        </span>{" "}
                        <span className="font-medium text-foreground">
                          {task._count?.submissions ?? 0}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        taskTitle={taskToDelete?.title || ""}
      />
    </ProtectedRoute>
  );
}
