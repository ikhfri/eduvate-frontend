// app/login/page.tsx (atau di mana pun path Anda)
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import confetti from "canvas-confetti";

// Komponen Input Kustom untuk email (tanpa tombol toggle)
const FormInput = ({ id, label, icon: Icon, ...props }: any) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-foreground">
      {label}
    </label>
    <div className="relative flex items-center">
      <Icon className="absolute left-3.5 h-5 w-5 text-muted-foreground" />
      <input
        id={id}
        className="w-full pl-11 pr-4 py-3 bg-background/50 border-2 border-border rounded-lg transition-colors duration-300 focus:outline-none focus:border-primary"
        {...props}
      />
    </div>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false); // State untuk lihat password
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLoginSuccess = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 10000,
    });
    toast({
      title: "Login Berhasil!",
      description: "Selamat datang kembali! Anda akan diarahkan ke dashboard.",
    });
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      handleLoginSuccess();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Email atau password salah. Silakan coba lagi.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* --- PANEL VISUAL (SISI KIRI) --- */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 text-white bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 animated-gradient relative overflow-hidden">
        <div className="absolute top-10 left-10 w-48 h-48 bg-white/10 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full filter blur-3xl opacity-50"></div>
        <div className="relative z-10 text-center">
          <Image
            src="/logo.png"
            alt="Nevtik LMS Logo"
            width={100}
            height={100}
            className="mx-auto mb-6 drop-shadow-lg"
            priority
          />
          {/* --- PERUBAHAN TEKS BANNER --- */}
          <p className="text-3xl font-medium tracking-tight text-white/80">
            Selamat Datang di
          </p>
          <h1 className="text-6xl font-extrabold leading-tight tracking-tighter drop-shadow-md">
            NEVTIK Learning Platform
          </h1>
          <p className="mt-4 text-lg max-w-sm text-white/80">
            Platform pembelajaran Anda untuk meraih masa depan yang lebih cerah.
          </p>
        </div>
      </div>

      {/* --- PANEL FORM (SISI KANAN) --- */}
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.png"
                alt="Nevtik LMS Logo"
                width={70}
                height={70}
              />
            </Link>
            <h2 className="text-3xl font-bold text-foreground">
              Login ke Akun Anda
            </h2>
          </div>

          <div className="text-left hidden lg:block">
            <h2 className="text-3xl font-bold text-foreground">
              Login ke Akun Anda
            </h2>
            <p className="text-muted-foreground mt-2">
              Masukkan kredensial Anda di bawah ini.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && !isSubmitting && (
              <div className="bg-destructive/10 p-3 rounded-lg flex items-center text-sm text-destructive border border-destructive/30">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            <FormInput
              id="email"
              name="email"
              label="Email"
              icon={Mail}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e : React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />

            {/* --- INPUT PASSWORD BARU DENGAN TOMBOL LIHAT/SEMBUNYIKAN --- */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 bg-background/50 border-2 border-border rounded-lg transition-colors duration-300 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 h-full px-4 text-muted-foreground hover:text-primary"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center p-4 text-base font-semibold text-sky-600 bg-primary rounded-lg shadow-lg hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="https://wa.me/6281229184336?text=Halo%20saya%20mau%20bertanya"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Hubungi Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
