"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function MyQrPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div className="flex justify-center items-center h-full">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">QR Code Absensi Anda</CardTitle>
            <CardDescription>
              Tunjukkan kode ini pada kamera saat akan melakukan absensi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            {user ? (
              <>
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeCanvas
                    value={user.id}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
