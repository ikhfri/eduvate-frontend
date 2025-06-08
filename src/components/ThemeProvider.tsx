"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types"; // Import tipe props

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Tambahkan tipe
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
