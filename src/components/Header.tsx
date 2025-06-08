// components/Header.tsx (atau di mana pun file Anda berada)
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LogOut,
  User,
  Menu,
  Settings as SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Hook untuk menutup dropdown saat klik di luar area menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    logout();
    router.push("/login");
    setIsMenuOpen(false);
  };

  // Jangan tampilkan header di halaman login/register
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-72 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Tombol Hamburger di mobile (kini di dalam header) */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-full"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Buka menu</span>
          </button>

          {/* Spacer untuk mendorong item ke kanan */}
          <div className="flex-grow hidden md:block" />

          {/* Item di sebelah kanan */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <ThemeToggle />

            {user && (
              // --- DROPDOWN MENU KUSTOM ---
              <div className="relative" ref={dropdownRef}>
                {/* Tombol Pemicu dengan Avatar */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative h-9 w-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  {/* Tampilkan inisial nama jika ada, jika tidak, ikon User */}
                  {user.name ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="sr-only">Buka menu pengguna</span>
                </button>

                {/* Konten Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden transition-all duration-200 ease-in-out origin-top-right animate-in fade-in-0 zoom-in-95">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-semibold leading-none text-foreground truncate">
                        {user.name || "Pengguna"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                        {user.email} ({user.role})
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center w-full px-3 py-2 text-sm rounded-md text-foreground hover:bg-accent"
                      >
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>Pengaturan</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
