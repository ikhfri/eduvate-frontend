// app/(dashboard)/dashboard/settings/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import axiosInstance from "@/lib/axiosInstance";
import {
  Loader2,
  User,
  KeyRound,
  Save,
  Mail,
  Lock,
  Settings as SettingsIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Komponen Input Kustom dengan Ikon
const FormInput = ({
  id,
  label,
  icon: Icon,
  className = "",
  ...props
}: any) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
      {label}
    </label>
    <div className="relative flex items-center">
      <Icon className="absolute left-3.5 h-5 w-5 text-muted-foreground" />
      <input
        id={id}
        className={`w-full pl-11 pr-4 py-2.5 bg-secondary/30 border-2 border-transparent rounded-lg transition-colors focus:outline-none focus:border-primary focus:bg-card disabled:cursor-not-allowed disabled:bg-muted/40 ${className}`}
        {...props}
      />
    </div>
  </div>
);

// Komponen untuk Form Profil
const ProfileForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) setFormData({ name: user.name || "", email: user.email || "" });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.put("/users/profile", { name: formData.name });

      // --- PERUBAHAN DI SINI ---
      // Memberi notifikasi bahwa perlu login ulang untuk melihat perubahan
      toast({
        title: "Profil Berhasil Disimpan",
        description:
          "Perubahan nama Anda akan terlihat di seluruh aplikasi setelah Anda login kembali.",
        duration: 5000, // Tampilkan pesan sedikit lebih lama
      });
    } catch (err: any) {
      toast({
        title: "Update Profil Gagal",
        description: err.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormInput
        id="name"
        name="name"
        label="Nama Lengkap"
        icon={User}
        value={formData.name}
        onChange={handleChange}
        required
      />
      <FormInput
        id="email"
        name="email"
        label="Alamat Email"
        icon={Mail}
        value={user?.email || ""}
        readOnly
        disabled
        type="email"
      />
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-6 py-2.5 font-semibold text-white bg-primary rounded-lg shadow-lg hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </div>
    </form>
  );
};

// Komponen untuk Form Password
const PasswordForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password baru dan konfirmasi tidak cocok.",
        variant: "destructive",
      });
      return;
    }
    if (formData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password baru minimal 6 karakter.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.put("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast({
        title: "Password Berhasil Diubah",
        description: "Gunakan password baru Anda saat login berikutnya.",
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast({
        title: "Gagal Mengubah Password",
        description:
          err.response?.data?.message || "Password saat ini mungkin salah.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormInput
        id="currentPassword"
        name="currentPassword"
        label="Password Saat Ini"
        icon={Lock}
        value={formData.currentPassword}
        onChange={handleChange}
        required
        type="password"
      />
      <FormInput
        id="newPassword"
        name="newPassword"
        label="Password Baru"
        icon={KeyRound}
        value={formData.newPassword}
        onChange={handleChange}
        required
        type="password"
      />
      <FormInput
        id="confirmPassword"
        name="confirmPassword"
        label="Konfirmasi Password Baru"
        icon={KeyRound}
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        type="password"
      />
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-6 py-2.5 font-semibold text-white bg-primary rounded-lg shadow-lg hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Memperbarui..." : "Perbarui Password"}
        </button>
      </div>
    </form>
  );
};

export default function SettingsPage() {
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* HERO BANNER */}
        <div className="relative p-8 rounded-2xl shadow-xl text-white overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700">
          <SettingsIcon className="absolute -right-10 -bottom-10 h-48 w-48 text-white/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold">Pengaturan Akun</h1>
            <p className="mt-2 text-white/80 max-w-lg">
              Kelola informasi profil dan keamanan akun Anda untuk menjaga data
              tetap aman dan terbaru.
            </p>
          </div>
        </div>

        {/* KONTENER UTAMA DENGAN TAB */}
        <div className="bg-card border border-border rounded-xl shadow-lg">
          {/* Navigasi Tab (Pill-based) */}
          <div className="p-2 bg-secondary/30 rounded-t-xl">
            <div className="flex w-full md:w-auto bg-secondary p-1 rounded-lg space-x-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold transition-colors rounded-md text-sm
                            ${
                              activeTab === "profile"
                                ? "bg-background shadow text-primary"
                                : "text-muted-foreground hover:bg-background/50"
                            }`}
              >
                <User className="h-4 w-4" /> Profil
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold transition-colors rounded-md text-sm
                            ${
                              activeTab === "password"
                                ? "bg-background shadow text-primary"
                                : "text-muted-foreground hover:bg-background/50"
                            }`}
              >
                <KeyRound className="h-4 w-4" /> Keamanan
              </button>
            </div>
          </div>

          {/* Konten Tab */}
          <div className="p-6 md:p-8">
            {activeTab === "profile" && <ProfileForm />}
            {activeTab === "password" && <PasswordForm />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
