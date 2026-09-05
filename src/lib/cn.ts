/**
 * `cn` — merge conditional class names, last-wins on conflicts.
 *
 * `clsx` handles the conditionals; `twMerge` resolves Tailwind collisions so a
 * caller's `px-8` beats a component's default `px-4` instead of both landing in
 * the class list and letting stylesheet order decide.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
