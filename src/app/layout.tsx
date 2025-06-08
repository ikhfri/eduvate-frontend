// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- LOGIKA TERPUSAT ---

  // Cek apakah ini halaman login atau register
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Cek apakah ini halaman yang memerlukan mode layar penuh (mengerjakan atau hasil kuis)
  const isFullScreenPage =
    /^\/dashboard\/kuis\/[^/]+\/(take|result)(\/.*)?$/.test(pathname);

  // Tampilkan sidebar dan header jika BUKAN halaman auth DAN BUKAN halaman layar penuh
  const showSidebarAndHeader = !isAuthPage && !isFullScreenPage;

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex h-screen">
              {/* Sidebar hanya dirender jika kondisi terpenuhi */}
              {showSidebarAndHeader && (
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
              )}

              <div
                className={cn(
                  "flex flex-col flex-1 transition-all duration-300 ease-in-out",
                  // Terapkan margin kiri jika sidebar dan header ditampilkan
                  showSidebarAndHeader && "sm:ml-72" // Lebar sidebar disesuaikan menjadi 72
                )}
              >
                {/* Header hanya ditampilkan jika kondisi terpenuhi */}
                {showSidebarAndHeader && (
                  <Header onToggleSidebar={toggleSidebar} />
                )}

                <main
                  className={cn(
                    "flex-1 overflow-y-auto",
                    // Tambahkan padding dan margin atas hanya jika header ditampilkan
                    showSidebarAndHeader && "p-4 md:p-6 mt-16"
                  )}
                >
                  {children}
                </main>
                <Toaster />
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
