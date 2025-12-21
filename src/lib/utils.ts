import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilitaire pour combiner les classes CSS avec clsx et tailwind-merge
// tailwind-merge résout les conflits entre classes Tailwind (ex: p-4 et p-6)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

