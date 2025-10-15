/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetchApi";
import axiosInstance from "@/lib/axiosInstance";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "STUDENT" | "ADMIN" | "MENTOR";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User | undefined>;
  logout: () => void;
  register: (userData: any) => Promise<any>;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  setToken: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const loadUserFromStorage = useCallback(() => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("authUser");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error("Gagal memuat user dari storage:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (
    email: string,
    password: string
  ): Promise<User | undefined> => {
    setLoading(true);
    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const { token: newToken, user: userData } = data;

      localStorage.setItem("authToken", newToken);
      localStorage.setItem("authUser", JSON.stringify(userData));

      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(userData as User);
      setLoading(false);
      return userData as User;
    } catch (error: any) {
      console.error("Login gagal:", error.data ? error.data : error.message);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData: any): Promise<any> => {
    setLoading(true);
    try {
      const data = await fetchApi("/auth/register", {
        method: "POST",
        body: userData,
      });
      setLoading(false);
      return data;
    } catch (error: any) {
      console.error(
        "Registrasi gagal:",
        error.data ? error.data : error.message
      );
      setLoading(false);
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    delete axiosInstance.defaults.headers.common["Authorization"];
    router.push("/login");
  }, [router]);

  const refetchUser = useCallback(async () => {
    const currentToken = localStorage.getItem("authToken");
    if (!currentToken) {
      console.log("Tidak ada token untuk memuat ulang data pengguna.");
      return;
    }
    try {
      const response = await axiosInstance.get("/auth/me");
      const userData = response.data.user || response.data;

      setUser(userData);
      localStorage.setItem("authUser", JSON.stringify(userData)); 
    } catch (error) {
      console.error(
        "Gagal mengambil ulang data pengguna (token mungkin tidak valid):",
        error
      );
      logout();
    }
  }, [logout]); 

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "authToken" && !event.newValue) {
        logout();
      }
      if (event.key === "authUser" && !event.newValue) {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        register,
        loading,
        setUser,
        setToken,
        setLoading,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
