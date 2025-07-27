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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Icons & Utilities
import {
  Loader2,
  AlertCircle,
  PlusCircle,
  Trash2,
  BookOpen,
  Edit,
  ExternalLink,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";

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

type MaterialFormData = Omit<Material, "id" | "createdAt" | "author">;

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

// --- Main Page Component ---
export default function ManageMaterialsPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(
    null
  );

  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/materials");
      setMaterials(response.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat materi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (material: Material) => {
    setEditingMaterial(material);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: MaterialFormData) => {
    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        // Update existing material
        await axiosInstance.put(`/materials/${editingMaterial.id}`, formData);
        toast({ title: "Sukses", description: "Materi berhasil diperbarui." });
      } else {
        // Add new material
        await axiosInstance.post("/materials", formData);
        toast({
          title: "Sukses",
          description: "Materi baru berhasil ditambahkan.",
        });
      }
      setIsFormModalOpen(false);
      fetchMaterials(); // Refresh data
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

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      await axiosInstance.delete(`/materials/${materialToDelete.id}`);
      toast({
        title: "Sukses",
        description: `Materi "${materialToDelete.title}" berhasil dihapus.`,
      });
      setMaterials((prev) => prev.filter((m) => m.id !== materialToDelete.id));
    } catch (err: any) {
      toast({
        title: "Gagal",
        description:
          err.response?.data?.message || "Terjadi kesalahan saat menghapus.",
        variant: "destructive",
      });
    } finally {
      setMaterialToDelete(null);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center mt-6">
      <BookOpen className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Belum Ada Materi</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Klik tombol &quot;Tambah Materi&quot; untuk memulai.
      </p>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Kelola Materi</h1>
            <p className="text-muted-foreground mt-1">
              Tambah, edit, atau hapus materi pembelajaran di sini.
            </p>
          </div>
          <Button onClick={handleOpenAddModal} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Materi
          </Button>
        </div>

        {isLoading && <Skeleton className="h-64 w-full" />}

        {error && (
          <div className="p-4 bg-destructive/10 border text-destructive/80 border-destructive/30 rounded-md text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && materials.length === 0 && renderEmptyState()}

        {!isLoading && !error && materials.length > 0 && (
          <>
            {/* Mobile View: Cards */}
            <div className="grid gap-4 md:hidden">
              {materials.map((material) => (
                <Card key={material.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base leading-tight">
                        {material.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEditModal(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setMaterialToDelete(material)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-muted-foreground space-y-2">
                    <p className="line-clamp-2">
                      {material.description || "Tidak ada deskripsi."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Penulis:</span>
                      <span>{material.author.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Dibuat:</span>
                      <span>{formatDate(material.createdAt)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-secondary/50">
                    <a
                      href={material.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" /> Buka Materi
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Judul</TableHead>
                    <TableHead>Penulis</TableHead>
                    <TableHead>Tgl Dibuat</TableHead>
                    <TableHead className="text-center">Link</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        {material.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {material.author.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(material.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <a
                          href={material.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" /> Buka
                          </Button>
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMaterialToDelete(material)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Material Dialog */}
      <MaterialFormDialog
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingMaterial}
      />

      {/* Delete Confirmation Dialog */}
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
                &quot;{materialToDelete?.title}&quot;{" "}
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

// --- Reusable Form Dialog Component ---
interface MaterialFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: MaterialFormData) => void;
  isSubmitting: boolean;
  initialData?: Material | null;
}

function MaterialFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: MaterialFormDialogProps) {
  const [formData, setFormData] = useState<MaterialFormData>({
    title: "",
    description: "",
    driveUrl: "",
    thumbnailUrl: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        driveUrl: initialData.driveUrl,
        thumbnailUrl: initialData.thumbnailUrl || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        driveUrl: "",
        thumbnailUrl: "",
      });
    }
  }, [initialData, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditMode = !!initialData;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Materi" : "Tambah Materi Baru"}
          </DialogTitle>
          <DialogDescription>
            Isi detail materi di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Materi</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driveUrl">Link Google Drive</Label>
              <Input
                id="driveUrl"
                name="driveUrl"
                type="url"
                value={formData.driveUrl}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">URL Thumbnail (Opsional)</Label>
              <Input
                id="thumbnailUrl"
                name="thumbnailUrl"
                type="url"
                value={formData.thumbnailUrl || ""}
                onChange={handleInputChange}
                placeholder="https://..."
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
              {isEditMode ? "Simpan Perubahan" : "Tambah Materi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
