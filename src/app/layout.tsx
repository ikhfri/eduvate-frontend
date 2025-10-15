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


  const isAuthPage = pathname === "/login" || pathname === "/register";

  const isFullScreenPage =
    /^\/dashboard\/kuis\/[^/]+\/(take|result)(\/.*)?$/.test(pathname);

  const showSidebarAndHeader = !isAuthPage && !isFullScreenPage;

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" />
        <title>Eduvate | Learning Platform</title>
      </head>
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
              {showSidebarAndHeader && (
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
              )}

              <div
                className={cn(
                  "flex flex-col flex-1 transition-all duration-300 ease-in-out",
                  showSidebarAndHeader && "sm:ml-72" 
                )}
              >
                {showSidebarAndHeader && (
                  <Header onToggleSidebar={toggleSidebar} />
                )}

                <main
                  className={cn(
                    "flex-1 overflow-y-auto",
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
