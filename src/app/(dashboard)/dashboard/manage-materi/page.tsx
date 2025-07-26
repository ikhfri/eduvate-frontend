// app/(dashboard)/dashboard/manage-materi/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import axiosInstance from "@/lib/axiosInstance";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Icons & Utilities
import {
  Loader2,
  AlertCircle,
  PlusCircle,
  Trash2,
  BookOpen,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

// --- Type Definitions ---
interface Material {
  id: string;
  title: string;
  description: string | null;
  driveUrl: string;
  thumbnailUrl?: string | null;
  createdAt: string;
  author: { name: string | null };
}

// --- Helper Functions ---
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return isValid(date)
      ? format(date, "dd MMMM yyyy", { locale: LocaleID })
      : "N/A";
  } catch {
    return "N/A";
  }
};

// --- Child Components ---

// Skeleton Loading untuk Tabel
const TableSkeleton = () => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-2/5">Judul</TableHead>
          <TableHead className="w-1/5">Penulis</TableHead>
          <TableHead className="w-1/5">Tgl Dibuat</TableHead>
          <TableHead className="w-1/5 text-right">Tindakan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-5 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-3/4" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-2/3" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// --- Main Page Component ---
export default function ManageMaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Modal Tambah Materi
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    driveUrl: "",
    thumbnailUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Dialog Konfirmasi Hapus
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(
    null
  );

  const fetchMaterials = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/materials");
      setMaterials(response.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat materi.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewMaterial((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setNewMaterial({
      title: "",
      description: "",
      driveUrl: "",
      thumbnailUrl: "",
    });
  };

  const handleAddMaterial = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/materials", newMaterial);
      toast({
        title: "Sukses",
        description: "Materi baru berhasil ditambahkan.",
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchMaterials(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Gagal",
        description:
          err.response?.data?.message ||
          "Terjadi kesalahan saat menambahkan materi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;

    try {
      await axiosInstance.delete(`/materials/${materialToDelete.id}`);
      toast({
        title: "Sukses",
        description: `Materi "${materialToDelete.title}" berhasil dihapus.`,
      });
      setMaterialToDelete(null); // Tutup dialog
      fetchMaterials(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Gagal",
        description:
          err.response?.data?.message ||
          "Terjadi kesalahan saat menghapus materi.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <TableSkeleton />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold text-destructive">
            Gagal Memuat Data
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      );
    }

    if (materials.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Belum Ada Materi</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Mulai tambahkan materi pertama Anda.
          </p>
        </div>
      );
    }

    return (
      <motion.div
        className="rounded-md border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">Judul</TableHead>
              <TableHead>Penulis</TableHead>
              <TableHead>Tgl Dibuat</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <AnimatePresence>
            <motion.tbody>
              {materials.map((material) => (
                <motion.tr
                  key={material.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  <TableCell className="font-medium">
                    {material.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {material.author.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(material.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMaterialToDelete(material)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </motion.tbody>
          </AnimatePresence>
        </Table>
      </motion.div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Materi</h1>
            <p className="text-muted-foreground">
              Tambah, edit, atau hapus materi pembelajaran di sini.
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Materi
          </Button>
        </div>

        {renderContent()}
      </div>

      {/* Dialog untuk Tambah Materi */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Materi Baru</DialogTitle>
            <DialogDescription>
              Isi detail materi di bawah ini. Klik tambah jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMaterial}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Judul
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={newMaterial.title}
                  onChange={handleInputChange}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newMaterial.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="driveUrl" className="text-right">
                  Link Drive
                </Label>
                <Input
                  id="driveUrl"
                  name="driveUrl"
                  type="url"
                  value={newMaterial.driveUrl}
                  onChange={handleInputChange}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="thumbnailUrl" className="text-right">
                  URL Thumbnail
                </Label>
                <Input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  type="url"
                  value={newMaterial.thumbnailUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tambah
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog untuk Konfirmasi Hapus */}
      <AlertDialog
        open={!!materialToDelete}
        onOpenChange={() => setMaterialToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin Ingin Menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Materi
              <span className="font-semibold text-foreground">
                {" "}
                {materialToDelete?.title}{" "}
              </span>
              akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMaterial}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
