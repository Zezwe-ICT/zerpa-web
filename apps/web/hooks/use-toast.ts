"use client";

import { useState, useCallback } from "react";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastInput = Omit<Toast, "id">;

let toastQueue: ((toast: Toast) => void)[] = [];

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { id, ...input };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
    // Also log to console so it's visible even without a Toaster component
    if (input.variant === "destructive") {
      console.error(`[Toast] ${input.title}: ${input.description}`);
    } else {
      console.log(`[Toast] ${input.title}: ${input.description}`);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toast, toasts, dismiss };
}
