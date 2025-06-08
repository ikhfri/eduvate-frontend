/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast({
        title: "Login Berhasil!",
        description: "Anda akan diarahkan ke dashboard.",
        variant: "default",
      });
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Login gagal. Silakan coba lagi.";
      setError(errorMessage);
      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center w-full justify-center min-h-screen bg-secondary/30 dark:bg-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center space-y-2">
          <Image
            src="/logo.png"
            alt="Nevtik LMS Logo"
            width={80}
            height={80}
            className="mx-auto"
            priority
          />
          <CardTitle className="text-3xl font-bold text-primary">
            {/* <div>Selamat Datang di</div> */}
            <div>NEVTIK LMS</div>
          </CardTitle>
          <CardDescription>
            Masukkan email dan password Anda untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && !isSubmitting && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-center text-sm text-destructive border border-destructive/30">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-md"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mohon tunggu...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="https://wa.me/6281229184336?text=Halo%20saya%20mau%20bertanya"
              target="blank"
              className="font-medium text-primary hover:underline"
            >
              Contact Admin
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
