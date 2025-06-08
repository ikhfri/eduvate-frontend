"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<"STUDENT" | "ADMIN" | "MENTOR">; // Opsional, untuk proteksi berbasis peran
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !token) {
        router.replace("/login"); // Jika tidak login, arahkan ke login
      } else if (
        allowedRoles &&
        allowedRoles.length > 0 &&
        !allowedRoles.includes(user.role)
      ) {
        // Jika ada role yang diizinkan dan user tidak memiliki role tersebut
        console.warn(
          `Akses ditolak untuk role: ${
            user.role
          } ke rute yang memerlukan: ${allowedRoles.join(", ")}`
        );
        router.replace("/dashboard"); // Arahkan ke dashboard (atau halaman unauthorized)
      }
    }
  }, [user, loading, token, router, allowedRoles]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        {" "}
        {/* Sesuaikan tinggi */}
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">Memverifikasi sesi Anda...</p>
      </div>
    );
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    // Tampilkan pesan akses ditolak jika peran tidak sesuai, sebelum redirect terjadi
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="ml-4 text-lg mt-4 text-destructive">Akses Ditolak</p>
        <p className="text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
