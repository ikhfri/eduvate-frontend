/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/manage-user/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  PlusCircle,
  Users,
  Search,
} from "lucide-react";

// --- Type Definitions & Helpers ---
type UserRole = "ADMIN" | "MENTOR" | "STUDENT";
interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
}

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = parseISO(dateString);
    return isValid(date)
      ? format(date, "dd MMMM yyyy", { locale: LocaleID })
      : "Invalid Date";
  } catch (error) {
    return "Error";
  }
};

const getInitials = (name: string | null) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

// --- Child Components ---
const SkeletonLoader = () => (
  <>
    {/* Mobile Skeleton */}
    <div className="md:hidden space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
    {/* Desktop Skeleton */}
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Peran</TableHead>
            <TableHead>Bergabung</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </>
);

// --- Main Page Component ---
export default function ManageUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as UserRole,
  });
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/users");
      setUsers(response.data?.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Gagal mengambil daftar pengguna."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "ADMIN" || currentUser?.role === "MENTOR") {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(lowercasedFilter) ||
        u.email.toLowerCase().includes(lowercasedFilter)
    );
  }, [users, searchTerm]);

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MENTOR":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleAddUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      await axiosInstance.post("/users/add", newUser);
      toast({
        title: "Pengguna Ditambahkan",
        description: `Pengguna baru "${newUser.name}" berhasil dibuat.`,
      });
      setIsAddModalOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "STUDENT" });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Gagal Menambah Pengguna",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const openEditModal = (userToEdit: UserData) => {
    setEditingUser(userToEdit);
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setIsUpdatingRole(true);
    try {
      await axiosInstance.put(`/users/${editingUser.id}/role`, {
        role: editingUser.role,
      });
      toast({
        title: "Peran Diperbarui",
        description: `Peran untuk ${
          editingUser.name || editingUser.email
        } berhasil diubah.`,
      });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Gagal Memperbarui Peran",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axiosInstance.delete(`/users/${userToDelete.id}`);
      toast({
        title: "Pengguna Dihapus",
        description: `Pengguna "${
          userToDelete.name || "Tanpa Nama"
        }" berhasil dihapus.`,
      });
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Gagal Menghapus",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (isLoading) return <SkeletonLoader />;
    if (error)
      return (
        <div className="text-center py-16 px-6 text-destructive">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold">Gagal Memuat Data</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    if (users.length === 0)
      return (
        <div className="text-center py-16 px-6">
          <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold">Belum Ada Pengguna</h3>
          <p className="text-muted-foreground mt-1">
            Klik tombol di atas untuk menambahkan pengguna baru.
          </p>
        </div>
      );
    if (filteredUsers.length === 0)
      return (
        <div className="text-center py-16 px-6">
          <p className="text-muted-foreground">
            Tidak ada pengguna yang cocok dengan pencarian{" "}
            <span className="font-medium text-foreground">&quot;{searchTerm}&quot;</span>.
          </p>
        </div>
      );

    return (
      <>
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
          <AnimatePresence>
            {filteredUsers.map((u) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border rounded-lg p-4 space-y-3 bg-card"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground">
                        {u.name || (
                          <span className="italic text-muted-foreground">
                            Tanpa Nama
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openEditModal(u)}
                        disabled={u.id === currentUser?.id}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Ubah Peran
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setUserToDelete(u)}
                        className="text-destructive focus:text-destructive"
                        disabled={u.id === currentUser?.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-sm text-muted-foreground space-y-2 border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span>Peran:</span>
                    <Badge variant={getRoleBadgeVariant(u.role)}>
                      {u.role}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bergabung:</span>
                    <span>{formatDateSafe(u.createdAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Tanggal Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredUsers.map((u) => (
                  <motion.tr
                    key={u.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {u.name || (
                            <span className="italic text-muted-foreground">
                              Tanpa Nama
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateSafe(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditModal(u)}
                            disabled={u.id === currentUser?.id}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Ubah Peran
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setUserToDelete(u)}
                            className="text-destructive focus:text-destructive"
                            disabled={u.id === currentUser?.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kelola Pengguna
            </h1>
            <p className="text-muted-foreground">
              Lihat, buat, dan kelola semua pengguna dalam sistem.
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Daftar Pengguna</CardTitle>
                <CardDescription>
                  Total {filteredUsers.length} dari {users.length} pengguna
                  ditampilkan.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama atau email..."
                  className="pl-8 sm:w-[300px] w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Isi detail untuk membuat akun baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUserSubmit} className="py-4 space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                name="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, email: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((p) => ({ ...p, password: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Peran</Label>
              <Select
                value={newUser.role}
                onValueChange={(v: UserRole) =>
                  setNewUser((p) => ({ ...p, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">STUDENT</SelectItem>
                  <SelectItem value="MENTOR">MENTOR</SelectItem>
                  {currentUser?.role === "ADMIN" && (
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isAddingUser}>
                {isAddingUser && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Buat Pengguna
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Peran Pengguna</DialogTitle>
            <DialogDescription>
              Ubah peran untuk{" "}
              <span className="font-semibold">
                {editingUser?.name || editingUser?.email}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Pilih Peran Baru</Label>
            <Select
              value={editingUser?.role}
              onValueChange={(v: UserRole) =>
                setEditingUser((p) => (p ? { ...p, role: v } : null))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">STUDENT</SelectItem>
                <SelectItem value="MENTOR">MENTOR</SelectItem>
                {currentUser?.role === "ADMIN" && (
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleUpdateRole} disabled={isUpdatingRole}>
              {isUpdatingRole && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengguna &quot;{userToDelete?.name}&quot; akan dihapus permanen. Aksi ini
              tidak dapat diurungkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
