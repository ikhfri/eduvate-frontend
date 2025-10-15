/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import axiosInstance from "@/lib/axiosInstance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Book, ArrowRight, FileText } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { id as LocaleID } from "date-fns/locale";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface Material {
  id: string;
  title: string;
  description: string | null;
  driveUrl: string;
  thumbnailUrl?: string | null;
  createdAt: string;
  author: {
    name: string | null;
  };
}

const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return isValid(date)
      ? format(date, "dd MMMM yyyy", { locale: LocaleID })
      : "Tanggal tidak valid";
  } catch {
    return "Tanggal tidak valid";
  }
};

export default function MaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/materials");
      setMaterials(response.data?.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal memuat materi.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Memuat materi...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="relative p-8 rounded-2xl shadow-xl text-white overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700">
          <Book className="absolute -right-10 -bottom-10 h-48 w-48 text-white/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold">Materi Pembelajaran</h1>
            <p className="mt-2 text-white/80 max-w-lg">
              Jelajahi semua materi yang telah disiapkan untuk mendukung proses
              belajarmu.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="inline-block mr-2" />
            {error}
          </div>
        )}

        {materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card
                key={material.id}
                className="flex flex-col hover:shadow-lg transition-shadow overflow-hidden group bg-card"
              >
                <div className="relative w-full h-40 bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={
                      material.thumbnailUrl ||
                      "https://placehold.co/600x400/e2e8f0/e2e8f0?text=."
                    } 
                    alt={`Thumbnail untuk ${material.title}`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src =
                        "https://placehold.co/600x400/f87171/ffffff?text=Gambar+Rusak";
                    }}
                  />
                  {!material.thumbnailUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-grow p-4">
                  <CardHeader className="p-0">
                    <CardTitle>{material.title}</CardTitle>
                    <CardDescription>
                      Oleh {material.author?.name || "Mentor"} •{" "}
                      {formatDate(material.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow p-0 mt-2">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {material.description || "Tidak ada deskripsi."}
                    </p>
                  </CardContent>
                  <CardFooter className="p-0 mt-4">
                    <a
                      href={material.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button className="w-full">
                        Lihat Materi <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl">
            <Book className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">
              Belum Ada Materi
            </h3>
            <p className="text-muted-foreground mt-1">
              Saat ini belum ada materi yang tersedia. Silakan periksa kembali
              nanti.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
