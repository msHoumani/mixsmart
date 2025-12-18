import { writable } from "svelte/store";

/**
 * Supported toast variants.
 */
export type ToastVariant = "success" | "error" | "info";

/**
 * Toast data model.
 */
export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  createdAt: number;
  timeoutMs: number;
};

/**
 * Default toast duration in milliseconds.
 */
const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Internal toast store.
 */
const toastStoreInternal = writable<ToastItem[]>([]);

/**
 * Generate a unique ID for a toast.
 *
 * @returns Unique toast ID
 */
const createToastId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `toast-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Add a toast to the store.
 *
 * @param variant - Toast style variant
 * @param title - Primary message
 * @param description - Optional supporting text
 * @param timeoutMs - Optional timeout override
 * @returns Toast ID
 */
const addToast = (
  variant: ToastVariant,
  title: string,
  description?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): string => {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Toast title is required");
  }

  const trimmedDescription = description?.trim() || undefined;
  const id = createToastId();

  const toast: ToastItem = {
    id,
    title: trimmedTitle,
    description: trimmedDescription,
    variant,
    createdAt: Date.now(),
    timeoutMs
  };

  toastStoreInternal.update((items) => [...items, toast]);

  if (timeoutMs > 0) {
    setTimeout(() => {
      removeToast(id);
    }, timeoutMs);
  }

  return id;
};

/**
 * Remove a toast by ID.
 *
 * @param id - Toast ID to remove
 */
export const removeToast = (id: string): void => {
  toastStoreInternal.update((items) => items.filter((item) => item.id !== id));
};

/**
 * Toast actions for components.
 */
export const toast = {
  success: (title: string, description?: string, timeoutMs?: number) =>
    addToast("success", title, description, timeoutMs),
  error: (title: string, description?: string, timeoutMs?: number) => addToast("error", title, description, timeoutMs),
  info: (title: string, description?: string, timeoutMs?: number) => addToast("info", title, description, timeoutMs)
};

/**
 * Subscribe to toast updates.
 */
export const toastStore = {
  subscribe: toastStoreInternal.subscribe
};
