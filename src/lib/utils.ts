// lms-frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx"; // Import ClassValue
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  // Tambahkan tipe ClassValue
  return twMerge(clsx(inputs));
}
