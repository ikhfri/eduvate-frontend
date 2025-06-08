"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, isPast, isFuture } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Hourglass,
  Edit3,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  submissionStartDate: string;
  deadline: string;
  author: {
    name: string;
  };
  // Tambahkan properti lain jika ada, misal status submission
  mySubmission?: {
    // Opsional, jika data submission siswa disertakan
    id: string;
    submittedAt: string;
    grade?: number;
  };
}

interface TaskCardProps {
  task: Task;
  userRole: "STUDENT" | "ADMIN" | "MENTOR";
}

export function TaskCard({ task, userRole }: TaskCardProps) {
  const startDate = new Date(task.submissionStartDate);
  const deadlineDate = new Date(task.deadline);
  const now = new Date();

  const isSubmissionOpen = now >= startDate && now <= deadlineDate;
  const isUpcoming = isFuture(startDate);
  const isPastDeadline = isPast(deadlineDate);

  let statusText = "Belum Dibuka";
  let statusColor = "bg-yellow-500 text-yellow-foreground";
  let StatusIcon = Hourglass;

  if (isSubmissionOpen) {
    statusText = "Dibuka";
    statusColor = "bg-green-500 text-green-foreground";
    StatusIcon = CheckCircle2;
  } else if (isPastDeadline) {
    statusText = "Ditutup";
    statusColor = "bg-destructive text-destructive-foreground";
    StatusIcon = AlertTriangle;
  }

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200 border-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-primary mb-1">
            {task.title}
          </CardTitle>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center",
              statusColor
            )}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusText}
          </span>
        </div>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {task.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <CalendarClock className="h-4 w-4 mr-2 text-primary" />
          <span>
            Mulai:{" "}
            {format(startDate, "dd MMM yyyy, HH:mm", { locale: localeID })}
          </span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <CalendarClock className="h-4 w-4 mr-2 text-destructive" />
          <span>
            Deadline:{" "}
            {format(deadlineDate, "dd MMM yyyy, HH:mm", { locale: localeID })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Dibuat oleh: {task.author.name}
        </p>
        {task.mySubmission && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-primary">
              Submission Anda:
            </p>
            <p className="text-xs text-muted-foreground">
              Dikumpulkan pada:{" "}
              {format(
                new Date(task.mySubmission.submittedAt),
                "dd MMM yyyy, HH:mm",
                { locale: localeID }
              )}
            </p>
            {task.mySubmission.grade !== undefined &&
            task.mySubmission.grade !== null ? (
              <p className="text-xs text-muted-foreground">
                Nilai:{" "}
                <span className="font-bold text-primary">
                  {task.mySubmission.grade}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nilai: Belum dinilai
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {userRole === "STUDENT" && (
          <Link
            href={`/dashboard/tugas/${task.id}`}
            passHref
            className="w-full"
          >
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isUpcoming || (isPastDeadline && !task.mySubmission)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {task.mySubmission
                ? "Lihat Submission"
                : isSubmissionOpen
                ? "Kerjakan Tugas"
                : "Lihat Detail"}
            </Button>
          </Link>
        )}
        {(userRole === "ADMIN" || userRole === "MENTOR") && (
          <Link
            href={`/dashboard/manage-tugas/${task.id}/details`}
            passHref
            className="w-full"
          >
            {" "}
            {/* Arahkan ke halaman detail admin */}
            <Button variant="outline" className="w-full">
              <Edit3 className="mr-2 h-4 w-4" />
              Kelola Tugas
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
