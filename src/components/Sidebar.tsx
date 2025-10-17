"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  CheckSquare,
  Users,
  Settings,
  BarChart3,
  LogOut,
  LucideIcon,
  ClipboardCheck,
  Trophy,
  Book,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";

interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
  activePaths?: string[];
}

interface NavGroup {
  title: string;
  links: NavLinkItem[];
}

const NavLink = ({
  link,
  pathname,
  onClick,
  notificationCount,
}: {
  link: NavLinkItem;
  pathname: string;
  onClick: () => void;
  notificationCount?: number;
}) => {
  const isActive =
    pathname === link.href ||
    (link.href !== "/dashboard" && pathname.startsWith(link.href)) ||
    link.activePaths?.some((path) => pathname.startsWith(path));

  return (
    <li>
      <Link
        href={link.href}
        onClick={onClick}
        className={cn(
          "flex items-center p-3 my-1 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 group relative"
        )}
      >
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 bg-primary rounded-r-full transition-all duration-200",
            isActive && "h-2/3"
          )}
        />
        <link.icon
          className={cn(
            "w-5 h-5 transition-all duration-200 group-hover:scale-110",
            isActive && "text-primary scale-110"
          )}
        />
        <span className="ms-4 font-semibold">{link.label}</span>
        {typeof notificationCount === "number" && notificationCount > 0 && (
          <span className="ms-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white animate-pulse">
            {notificationCount}
          </span>
        )}
      </Link>
    </li>
  );
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [pendingCounts, setPendingCounts] = useState({ tasks: 0, quizzes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.role === "STUDENT") {
        try {
          const res = await axiosInstance.get("/stats");
          const stats = res.data?.data || {};
          setPendingCounts({
            tasks: stats.activeTasks || 0,
            quizzes: stats.availableQuizzes || 0,
          });
        } catch (err) {
          console.error("Gagal mengambil stats:", err);
        }
      }
    };
    fetchStats();
  }, [user]);

  const navGroups: NavGroup[] = [
    {
      title: "Menu Utama",
      links: [{ href: "/dashboard", label: "Dashboard", icon: Home }],
    },
  ];

  if (user) {
    if (user.role === "STUDENT") {
      navGroups[0].links.push(
        { href: "/dashboard/materi", label: "Materi Belajar", icon: Book },
        { href: "/dashboard/tugas", label: "Tugas Saya", icon: BookOpen },
        {
          href: "/dashboard/kuis",
          label: "Kuis Saya",
          icon: CheckSquare,
          activePaths: ["/dashboard/kuis/[quizId]/result"],
        },
        {
          href: "/dashboard/absensi",
          label: "Absensi",
          icon: ClipboardCheck,
        },
        {
          href: "/dashboard/my-stats",
          label: "Statistik Saya",
          icon: BarChart3,
        },
        {
          href: "/dashboard/ranking",
          label: "Peringkat",
          icon: Trophy,
        }
      );
    } else if (user.role === "ADMIN" || user.role === "MENTOR") {
      navGroups.push({
        title: "Pengelolaan",
        links: [
          
          {
            href: "/dashboard/manage-materi",
            label: "Kelola Materi",
            icon: Book,
          },

          {
            href: "/dashboard/manage-tugas",
            label: "Kelola Tugas",
            icon: BookOpen,
          },
          {
            href: "/dashboard/manage-kuis",
            label: "Kelola Kuis",
            icon: CheckSquare,
          },
          ...(user.role === "ADMIN"
            ? [
                {
                  href: "/dashboard/manage-user",
                  label: "Kelola Pengguna",
                  icon: Users,
                },
              ]
            : []),
          {
            href: "/dashboard/manage-absensi",
            label: "Kelola Absensi",
            icon: ClipboardCheck,
          },
          { href: "/dashboard/stats", label: "Statistik", icon: BarChart3 },
          {
            href: "/dashboard/ranking",
            label: "Peringkat",
            icon: Trophy,
          },
        ],
      });
    }
  }

  navGroups.push({
    title: "Akun",
    links: [
      { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
    ],
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-72 h-screen transition-transform duration-300 ease-in-out",
          "bg-card dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border-r border-border dark:border-slate-800",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-6 pb-4 px-4 flex-shrink-0">
          <Link href="/dashboard" className="flex flex-row items-center gap-2">
            <Image height={90} width={90} src="/icon.png" alt="logo" />
          
          </Link>
        </div>

        <nav className="flex-grow px-4 overflow-y-auto no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              <h3 className="px-3 mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.links.map((link) => {
                  let count = 0;
                  if (user?.role === "STUDENT") {
                    if (link.href === "/dashboard/tugas") {
                      count = pendingCounts.tasks;
                    } else if (link.href === "/dashboard/kuis") {
                      count = pendingCounts.quizzes;
                    }
                  }

                  return (
                    <NavLink
                      key={link.href}
                      link={link}
                      pathname={pathname}
                      onClick={() => setIsOpen(false)}
                      notificationCount={count}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 mt-auto border-t border-border dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : <Users />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || "Pengguna"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-md text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-3 pt-3 border-t border-border/50 dark:border-slate-800/50">
            <p className="text-xs text-muted-foreground/80">
              LMS v1.0.0 - © {new Date().getFullYear()} Eduvate
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
