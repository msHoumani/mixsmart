import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conditional support.
 *
 * @param inputs - Class name fragments
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * Remove the `child` prop from a type.
 */
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * Remove the `children` prop from a type.
 */
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;

/**
 * Remove child and children keys from a type.
 */
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

/**
 * Extend a prop type with an element ref.
 */
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U };
