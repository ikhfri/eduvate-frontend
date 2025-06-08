/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/manage-kuis/[quizId]/questions/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  PlusCircle,
  MoreHorizontal,
  Edit3,
  Trash2,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

// Interface untuk data Kuis (detail)
interface QuizDetails {
  id: string;
  title: string;
}

// Structure for individual option object as expected by backend
interface BackendOptionObject {
  text: string;
  isCorrect: boolean;
}

// Interface untuk data Pertanyaan dari backend
interface Question {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
  imageUrl?: string | null;
  options?: BackendOptionObject[] | string;
  createdAt: string;
  updatedAt: string;
}

// Interface untuk form state pertanyaan (frontend-centric)
interface OptionFormData {
  id: string;
  text: string;
}
interface QuestionFormData {
  id?: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
  imageUrl: string;
  options: OptionFormData[];
  correctOptionIndex: number | null;
}

const generateClientSideId = () =>
  `client_${Math.random().toString(36).substr(2, 9)}`;

const initialQuestionFormData: QuestionFormData = {
  text: "",
  type: "MULTIPLE_CHOICE",
  imageUrl: "",
  options: [
    { id: generateClientSideId(), text: "" },
    { id: generateClientSideId(), text: "" },
    { id: generateClientSideId(), text: "" },
    { id: generateClientSideId(), text: "" },
  ],
  correctOptionIndex: null,
};

const TRUE_FALSE_OPTIONS: OptionFormData[] = [
  { id: "tf_true", text: "Benar" },
  { id: "tf_false", text: "Salah" },
];

export default function ManageQuizQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const { toast } = useToast();
  const { user } = useAuth();

  const [quizDetails, setQuizDetails] = useState<QuizDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] =
    useState<QuestionFormData | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const fetchQuizData = useCallback(async () => {
    if (!quizId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const quizResponse = await axiosInstance.get(`/quizzes/${quizId}`);
      const fetchedQuizDetails = quizResponse.data?.data || quizResponse.data;
      if (!fetchedQuizDetails) throw new Error("Detail kuis tidak ditemukan.");
      setQuizDetails(fetchedQuizDetails);

      const questionsResponse = await axiosInstance.get(
        `/quizzes/${quizId}/questions`
      );
      setQuestions(
        questionsResponse.data?.data || questionsResponse.data || []
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal mengambil data.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [quizId, user]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  const handleAddQuestion = () => {
    setFormMode("add");
    const newQuestionForm = JSON.parse(JSON.stringify(initialQuestionFormData));
    newQuestionForm.options = newQuestionForm.options.map(
      (opt: OptionFormData) => ({ ...opt, id: generateClientSideId() })
    );
    setCurrentQuestion(newQuestionForm);
    setIsFormModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setFormMode("edit");
    let formOptions: OptionFormData[] = [];
    let correctIdx: number | null = null;

    let parsedBackendOptions: BackendOptionObject[] = [];
    if (typeof question.options === "string") {
      try {
        parsedBackendOptions = JSON.parse(question.options);
        if (!Array.isArray(parsedBackendOptions)) parsedBackendOptions = [];
      } catch {
        parsedBackendOptions = [];
      }
    } else if (Array.isArray(question.options)) {
      parsedBackendOptions = question.options;
    }

    if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      const validBackendOptions = parsedBackendOptions.filter(
        (opt) =>
          typeof opt === "object" &&
          opt !== null &&
          typeof opt.text === "string" &&
          typeof opt.isCorrect === "boolean"
      );

      if (validBackendOptions.length > 0) {
        formOptions = validBackendOptions.map((opt) => ({
          id: generateClientSideId(),
          text: opt.text,
        }));
        correctIdx = validBackendOptions.findIndex((opt) => opt.isCorrect);
        if (correctIdx === -1) correctIdx = null;
      } else {
        formOptions =
          question.type === "MULTIPLE_CHOICE"
            ? initialQuestionFormData.options.map((o) => ({
                ...o,
                id: generateClientSideId(),
                text: "",
              }))
            : TRUE_FALSE_OPTIONS.map((o) => ({
                ...o,
                id: generateClientSideId(),
              }));
      }
    }

    setCurrentQuestion({
      id: question.id,
      text: question.text,
      type: question.type,
      imageUrl: question.imageUrl || "",
      options: formOptions,
      correctOptionIndex: correctIdx,
    });
    setIsFormModalOpen(true);
  };

  const handleDeleteQuestion = async (
    questionId: string,
    questionText: string
  ) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus pertanyaan "${questionText}"?`
      )
    ) {
      return;
    }
    try {
      await axiosInstance.delete(`/quizzes/${quizId}/questions/${questionId}`);
      toast({
        title: "Sukses",
        description: `Pertanyaan "${questionText}" berhasil dihapus.`,
      });
      fetchQuizData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Gagal menghapus pertanyaan.",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentQuestion) return;
    setIsSubmittingForm(true);

    if (!currentQuestion.text.trim() || !currentQuestion.type) {
      toast({
        title: "Error Validasi",
        description: "Teks pertanyaan dan tipe wajib diisi.",
        variant: "destructive",
      });
      setIsSubmittingForm(false);
      return;
    }

    let backendOptions: BackendOptionObject[] = [];
    if (
      currentQuestion.type === "MULTIPLE_CHOICE" ||
      currentQuestion.type === "TRUE_FALSE"
    ) {
      if (
        currentQuestion.correctOptionIndex === null ||
        currentQuestion.correctOptionIndex < 0
      ) {
        toast({
          title: "Error Validasi",
          description: `Jawaban benar wajib dipilih.`,
          variant: "destructive",
        });
        setIsSubmittingForm(false);
        return;
      }

      const correctOptionFormId =
        currentQuestion.options[currentQuestion.correctOptionIndex]?.id;
      backendOptions = currentQuestion.options
        .filter((opt) => opt.text.trim() !== "")
        .map((opt) => ({
          text: opt.text,
          isCorrect: opt.id === correctOptionFormId,
        }));

      if (!backendOptions.some((opt) => opt.isCorrect)) {
        toast({
          title: "Error Validasi",
          description: "Pilihan jawaban benar tidak valid atau kosong.",
          variant: "destructive",
        });
        setIsSubmittingForm(false);
        return;
      }
    }

    try {
      const payload: any = {
        text: currentQuestion.text.trim(),
        type: currentQuestion.type,
        imageUrl: currentQuestion.imageUrl || null,
      };
      if (currentQuestion.type !== "ESSAY") {
        payload.options = backendOptions;
      }

      if (formMode === "add") {
        await axiosInstance.post(`/quizzes/${quizId}/questions`, payload);
        toast({
          title: "Sukses",
          description: "Pertanyaan baru berhasil ditambahkan.",
        });
      } else if (formMode === "edit" && currentQuestion.id) {
        await axiosInstance.put(
          `/quizzes/${quizId}/questions/${currentQuestion.id}`,
          payload
        );
        toast({
          title: "Sukses",
          description: "Pertanyaan berhasil diperbarui.",
        });
      }
      setIsFormModalOpen(false);
      setCurrentQuestion(null);
      fetchQuizData();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Gagal menyimpan pertanyaan.";
      toast({
        title: "Error Menyimpan",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleFormInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!currentQuestion) return;
    const { name, value } = e.target;
    setCurrentQuestion((prev) => ({ ...prev!, [name]: value }));
  };

  const handleQuestionTypeChange = (value: QuestionFormData["type"]) => {
    if (!currentQuestion) return;
    setCurrentQuestion((prev) => ({
      ...prev!,
      type: value,
      options:
        value === "MULTIPLE_CHOICE"
          ? initialQuestionFormData.options.map((o) => ({
              id: generateClientSideId(),
              text: "",
            }))
          : value === "TRUE_FALSE"
          ? TRUE_FALSE_OPTIONS.map((o) => ({
              ...o,
              id: generateClientSideId(),
            }))
          : [],
      correctOptionIndex: null,
    }));
  };

  const handleOptionTextChange = (index: number, text: string) => {
    if (!currentQuestion) return;
    const newOptions = [...currentQuestion.options];
    newOptions[index] = { ...newOptions[index], text };
    setCurrentQuestion((prev) => ({ ...prev!, options: newOptions }));
  };

  const handleCorrectOptionChange = (index: number | string) => {
    if (!currentQuestion) return;
    setCurrentQuestion((prev) => ({
      ...prev!,
      correctOptionIndex: Number(index),
    }));
  };

  const addOptionField = () => {
    if (!currentQuestion || currentQuestion.options.length >= 6) return;
    setCurrentQuestion((prev) => ({
      ...prev!,
      options: [...prev!.options, { id: generateClientSideId(), text: "" }],
    }));
  };

  const removeOptionField = (indexToRemove: number) => {
    if (!currentQuestion || currentQuestion.options.length <= 2) return;
    const newOptions = currentQuestion.options.filter(
      (_, i) => i !== indexToRemove
    );
    let newCorrectIndex = currentQuestion.correctOptionIndex;

    const correctOptionIdBeforeRemove =
      currentQuestion.correctOptionIndex !== null
        ? currentQuestion.options[currentQuestion.correctOptionIndex]?.id
        : null;

    if (newOptions.every((opt) => opt.id !== correctOptionIdBeforeRemove)) {
      newCorrectIndex = null;
    } else if (correctOptionIdBeforeRemove !== null) {
      newCorrectIndex = newOptions.findIndex(
        (opt) => opt.id === correctOptionIdBeforeRemove
      );
    }

    setCurrentQuestion((prev) => ({
      ...prev!,
      options: newOptions,
      correctOptionIndex: newCorrectIndex,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          Memuat data pertanyaan...
        </p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MENTOR"]}>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Button
          onClick={() => router.push("/dashboard/manage-kuis")}
          variant="outline"
          size="sm"
          className="mb-4 inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Kelola Kuis
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Kelola Pertanyaan Kuis
            </h1>
            {quizDetails && (
              <p className="text-muted-foreground">
                Kuis: <span className="font-semibold">{quizDetails.title}</span>
              </p>
            )}
          </div>
          <Button onClick={handleAddQuestion} className="flex items-center">
            <PlusCircle className="h-5 w-5 mr-2" />
            Tambah Pertanyaan
          </Button>
        </div>
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <Card className="shadow-lg border-border rounded-lg">
          <CardHeader>
            <CardTitle>Daftar Pertanyaan</CardTitle>
            <CardDescription>
              Total {questions.length} pertanyaan untuk kuis ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoading && questions.length === 0 && !error && (
              <div className="text-center py-10">
                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  Belum ada pertanyaan untuk kuis ini.
                </p>
                <p className="text-sm text-muted-foreground">
                  Klik tombol Tambah Pertanyaan untuk memulai.
                </p>
              </div>
            )}
            {questions.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No.</TableHead>
                      <TableHead>Teks Pertanyaan</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-right w-[100px]">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question, index) => (
                      <TableRow key={question.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium max-w-xs md:max-w-md truncate">
                          {question.text}
                        </TableCell>
                        <TableCell>{question.type.replace("_", " ")}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditQuestion(question)}
                              >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteQuestion(
                                    question.id,
                                    question.text
                                  )
                                }
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isFormModalOpen}
          onOpenChange={(isOpen) => {
            setIsFormModalOpen(isOpen);
            if (!isOpen) setCurrentQuestion(null);
          }}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formMode === "add"
                  ? "Tambah Pertanyaan Baru"
                  : "Edit Pertanyaan"}
              </DialogTitle>
              <DialogDescription>
                Isi detail pertanyaan di bawah ini.
              </DialogDescription>
            </DialogHeader>
            {currentQuestion && (
              <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="text">
                    Teks Pertanyaan <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="text"
                    name="text"
                    value={currentQuestion.text}
                    onChange={handleFormInputChange}
                    required
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type">
                    Tipe Pertanyaan <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={currentQuestion.type}
                    onValueChange={handleQuestionTypeChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih tipe pertanyaan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">
                        Pilihan Ganda
                      </SelectItem>
                      <SelectItem value="ESSAY">Esai</SelectItem>
                      <SelectItem value="TRUE_FALSE">Benar/Salah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="imageUrl">URL Gambar (Opsional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      placeholder="https://contoh.com/gambar.jpg"
                      value={currentQuestion.imageUrl}
                      onChange={handleFormInputChange}
                    />
                  </div>
                  {currentQuestion.imageUrl && (
                    <div className="mt-2">
                      <Image
                        src={currentQuestion.imageUrl}
                        alt="Pratinjau Gambar"
                        width={500} // Contoh lebar
                        height={300} // Contoh tinggi
                        className="rounded-md max-h-40 object-contain border p-1"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                {currentQuestion.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-3 border p-4 rounded-md">
                    <Label className="font-semibold">
                      Opsi Jawaban <span className="text-destructive">*</span>
                    </Label>
                    <RadioGroup
                      value={
                        currentQuestion.correctOptionIndex !== null
                          ? currentQuestion.options[
                              currentQuestion.correctOptionIndex
                            ]?.id
                          : undefined
                      }
                      onValueChange={(selectedOptionId) => {
                        const selectedIndex = currentQuestion.options.findIndex(
                          (opt) => opt.id === selectedOptionId
                        );
                        if (selectedIndex !== -1)
                          handleCorrectOptionChange(selectedIndex);
                      }}
                    >
                      {currentQuestion.options.map((option, index) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="sr-only">
                            Pilih opsi {index + 1} sebagai jawaban benar
                          </Label>
                          <Input
                            type="text"
                            value={option.text}
                            onChange={(e) =>
                              handleOptionTextChange(index, e.target.value)
                            }
                            placeholder={`Opsi ${index + 1}`}
                            required
                            className="flex-grow"
                          />
                          {currentQuestion.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOptionField(index)}
                              className="text-destructive hover:text-destructive flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                    {currentQuestion.options.length < 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOptionField}
                        className="mt-2"
                      >
                        Tambah Opsi
                      </Button>
                    )}
                    {(currentQuestion.correctOptionIndex === null ||
                      currentQuestion.correctOptionIndex >=
                        currentQuestion.options.length ||
                      currentQuestion.options[
                        currentQuestion.correctOptionIndex
                      ]?.text.trim() === "") && (
                      <p className="text-xs text-destructive pt-1">
                        Pilih salah satu jawaban yang valid sebagai jawaban yang
                        benar.
                      </p>
                    )}
                  </div>
                )}
                {currentQuestion.type === "TRUE_FALSE" && (
                  <div className="space-y-3 border p-4 rounded-md">
                    <Label className="font-semibold">
                      Jawaban Benar <span className="text-destructive">*</span>
                    </Label>
                    <RadioGroup
                      value={
                        currentQuestion.correctOptionIndex !== null
                          ? String(currentQuestion.correctOptionIndex)
                          : undefined
                      }
                      onValueChange={(value) =>
                        handleCorrectOptionChange(Number(value))
                      }
                      className="mt-1"
                    >
                      {TRUE_FALSE_OPTIONS.map((option, index) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={String(index)}
                            id={`tf_opt_${index}_${option.id}`}
                          />
                          <Label htmlFor={`tf_opt_${index}_${option.id}`}>
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {currentQuestion.correctOptionIndex === null && (
                      <p className="text-xs text-destructive pt-1">
                        Pilih jawaban yang benar.
                      </p>
                    )}
                  </div>
                )}
                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingForm}>
                    {isSubmittingForm && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {formMode === "add"
                      ? "Tambah Pertanyaan"
                      : "Simpan Perubahan"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
