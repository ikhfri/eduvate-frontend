// app/(dashboard)/dashboard/manage-user/page.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  PlusCircle,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";

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
    if (!isValid(date)) return "Tanggal tidak valid";
    return format(date, "dd MMMM yyyy", { locale: LocaleID });
  } catch (error) {
    return "Error format";
  }
};

export default function ManageUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/users");
      setUsers(response.data?.data || response.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal mengambil daftar pengguna.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === "ADMIN" || currentUser?.role === "MENTOR") {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const getRoleBadgeVariant = (role: UserData["role"]) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MENTOR":
        return "default";
      case "STUDENT":
      default:
        return "secondary";
    }
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNewUserRoleChange = (value: UserRole) => {
    setNewUser((prev) => ({ ...prev, role: value }));
  };

  const handleAddUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Nama, email, dan password wajib diisi.",
        variant: "destructive",
      });
      return;
    }
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
    setSelectedRole(userToEdit.role);
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setIsUpdatingRole(true);
    try {
      await axiosInstance.put(`/users/${editingUser.id}/role`, {
        role: selectedRole,
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

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Aksi Ditolak",
        description: "Anda tidak dapat menghapus akun Anda sendiri.",
        variant: "destructive",
      });
      return;
    }
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus pengguna "${
          userName || "Tanpa Nama"
        }"?`
      )
    )
      return;
    try {
      await axiosInstance.delete(`/users/${userId}`);
      toast({
        title: "Pengguna Dihapus",
        description: `Pengguna "${userName || "Tanpa Nama"}" berhasil dihapus.`,
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Gagal Menghapus",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || (isLoading && users.length === 0 && !error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat data pengguna...</p>
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN" && currentUser?.role !== "MENTOR") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">
          Akses Ditolak
        </h2>
        <p className="text-muted-foreground mb-4">
          Hanya Admin dan Mentor yang dapat mengakses halaman ini.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Kelola Pengguna</h1>
            <p className="text-muted-foreground mt-1">
              Lihat, buat, edit peran, dan kelola pengguna dalam sistem.
            </p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna Baru
          </Button>
        </div>

        {error && !isLoading && (
          <div className="p-4 bg-destructive/10 border text-center border-destructive/30 rounded-md text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Card className="shadow-lg border-border rounded-xl">
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>
              Total {users.length} pengguna terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* --- Mobile View: Card List --- */}
            <div className="md:hidden space-y-4">
              {isLoading && users.length === 0 && (
                <div className="text-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {!isLoading && users.length === 0 && (
                <div className="text-center py-16 px-6">
                  <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Belum Ada Pengguna
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Klik tombol di atas untuk menambahkan pengguna baru.
                  </p>
                </div>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="border rounded-lg p-4 space-y-3 bg-secondary/30"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-foreground pr-2">
                      {u.name || (
                        <span className="italic text-muted-foreground">
                          Tanpa Nama
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => openEditModal(u)}
                          disabled={u.id === currentUser?.id}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Ubah Peran
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Email:</span>
                      <span className="text-right truncate">{u.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Peran:</span>
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {u.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Bergabung:</span>
                      <span>{formatDateSafe(u.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* --- Desktop View: Table --- */}
            <div className="hidden md:block overflow-x-auto">
              {isLoading && users.length === 0 && (
                <div className="text-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {!isLoading && users.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Belum Ada Pengguna
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Klik tombol di atas untuk menambahkan pengguna baru.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No.</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Tanggal Bergabung</TableHead>
                      <TableHead className="text-right w-[100px]">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u, index) => (
                      <TableRow key={u.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {u.name || (
                            <span className="italic text-muted-foreground">
                              Tanpa Nama
                            </span>
                          )}
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
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => openEditModal(u)}
                                disabled={u.id === currentUser?.id}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Ubah Peran
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                disabled={u.id === currentUser?.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog for Add User */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Isi detail pengguna di bawah ini untuk membuat akun baru.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUserSubmit}>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newUser.name}
                    onChange={handleNewUserChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
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
                    onChange={handleNewUserChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role-select-add">Peran</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={handleNewUserRoleChange}
                  >
                    <SelectTrigger id="role-select-add">
                      <SelectValue placeholder="Pilih peran..." />
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

        {/* Dialog for Edit Role */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ubah Peran Pengguna</DialogTitle>
              <DialogDescription>
                Ubah peran untuk pengguna{" "}
                <span className="font-semibold">
                  {editingUser?.name || editingUser?.email}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="role-select-edit">Pilih Peran Baru</Label>
              <Select
                value={selectedRole}
                onValueChange={(value: UserRole) => setSelectedRole(value)}
              >
                <SelectTrigger id="role-select-edit">
                  <SelectValue placeholder="Pilih peran..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">STUDENT</SelectItem>
                  <SelectItem value="MENTOR">MENTOR</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
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
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
