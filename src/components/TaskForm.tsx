/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// lms-frontend/components/TaskForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import axiosInstance from "@/lib/axiosInstance";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"; // Akan dibuat

// Skema validasi form menggunakan Zod
const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Judul minimal 3 karakter." }).max(100, { message: "Judul maksimal 100 karakter."}),
  description: z.string().min(10, { message: "Deskripsi minimal 10 karakter." }),
  submissionStartDate: z.date({ required_error: "Tanggal mulai pengumpulan wajib diisi." }),
  deadline: z.date({ required_error: "Tanggal deadline wajib diisi." }),
}).refine(data => data.submissionStartDate < data.deadline, {
  message: "Tanggal mulai harus sebelum tanggal deadline.",
  path: ["submissionStartDate"], // Tunjukkan error pada field submissionStartDate
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface Task {
  id: string;
  title: string;
  description: string;
  submissionStartDate: string; // ISO string
  deadline: string; // ISO string
}
interface TaskFormProps {
  onSuccess: () => void;
  existingTask?: Task | null; // Tugas yang ada jika mode edit
}

export default function TaskForm({ onSuccess, existingTask }: TaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: existingTask ? {
      title: existingTask.title,
      description: existingTask.description,
      submissionStartDate: new Date(existingTask.submissionStartDate),
      deadline: new Date(existingTask.deadline),
    } : {
      title: "",
      description: "",
      submissionStartDate: undefined, // Biarkan kosong atau set default
      deadline: undefined, // Biarkan kosong atau set default
    },
  });

  useEffect(() => { // Untuk mereset form jika existingTask berubah (misal saat dialog dibuka ulang untuk task berbeda)
    if (existingTask) {
      form.reset({
        title: existingTask.title,
        description: existingTask.description,
        submissionStartDate: new Date(existingTask.submissionStartDate),
        deadline: new Date(existingTask.deadline),
      });
    } else {
      form.reset({
        title: "",
        description: "",
        submissionStartDate: undefined,
        deadline: undefined,
      });
    }
  }, [existingTask, form]);


  async function onSubmit(data: TaskFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        submissionStartDate: data.submissionStartDate.toISOString(),
        deadline: data.deadline.toISOString(),
      };

      if (existingTask) {
        // Mode Edit
        await axiosInstance.put(`/tasks/${existingTask.id}`, payload);
        toast({
          title: "Sukses!",
          description: "Tugas berhasil diperbarui.",
        });
      } else {
        // Mode Create
        await axiosInstance.post("/tasks", payload);
        toast({
          title: "Sukses!",
          description: "Tugas baru berhasil dibuat.",
        });
      }
      onSuccess(); // Panggil callback sukses (misal: tutup modal, refresh list)
      form.reset(); // Reset form setelah sukses
    } catch (error: any) {
      console.error("Gagal menyimpan tugas:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Terjadi kesalahan saat menyimpan tugas.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Tugas</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Mengerjakan Latihan Soal Bab 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Tugas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan detail tugas, instruksi, dan kriteria penilaian..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="submissionStartDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Tanggal Mulai Pengumpulan</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP HH:mm", { locale: localeID })
                        ) : (
                            <span>Pilih tanggal mulai</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Nonaktifkan tanggal sebelum hari ini
                        initialFocus
                    />
                    {/* Tambahkan input waktu di sini jika perlu */}
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Tanggal Deadline</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP HH:mm", { locale: localeID })
                        ) : (
                            <span>Pilih tanggal deadline</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < (form.getValues("submissionStartDate") || new Date(new Date().setHours(0,0,0,0)))}
                        initialFocus
                    />
                     {/* Tambahkan input waktu di sini jika perlu */}
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (existingTask ? 'Simpan Perubahan' : 'Buat Tugas')}
        </Button>
      </form>
    </Form>
  );
}