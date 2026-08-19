import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}

/** Id corto y legible para campañas y prompts. */
export function id(prefijo: string): string {
  return `${prefijo}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}
