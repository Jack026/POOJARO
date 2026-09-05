'use client';

/**
 * Toast queue (§43).
 *
 * A store rather than context so any module — including plain event handlers and
 * server-action callbacks — can raise a toast with `toast.success(...)` without
 * threading a hook through the tree.
 *
 * Toasts carry optional actions because the brief's add-to-cart confirmation is
 * not just a message: it offers "View cart" and "Continue shopping" (§15).
 */
import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Small square image, e.g. the product just added. */
  imageUrl?: string;
  imageAlt?: string;
  actions?: ToastAction[];
  /** Milliseconds on screen. `null` keeps it until dismissed. */
  duration: number | null;
}

export interface ToastInput extends Omit<Partial<Toast>, 'id' | 'title'> {
  title: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

/** At most three at once; older ones drop off rather than filling the screen. */
const MAX_VISIBLE = 3;

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (input) => {
    counter += 1;
    const id = `toast-${counter}`;
    const toast: Toast = {
      id,
      tone: input.tone ?? 'default',
      title: input.title,
      duration: input.duration === undefined ? 4500 : input.duration,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.imageAlt !== undefined ? { imageAlt: input.imageAlt } : {}),
      ...(input.actions !== undefined ? { actions: input.actions } : {}),
    };
    set((state) => ({ toasts: [...state.toasts, toast].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/**
 * Imperative API.
 *
 * `toast.error` stays on screen until dismissed. Something went wrong is exactly
 * the message a shopper must not miss because they looked away for five seconds.
 */
export const toast = {
  show: (input: ToastInput) => useToastStore.getState().push(input),
  success: (title: string, input: Omit<ToastInput, 'title' | 'tone'> = {}) =>
    useToastStore.getState().push({ ...input, title, tone: 'success' }),
  error: (title: string, input: Omit<ToastInput, 'title' | 'tone'> = {}) =>
    useToastStore.getState().push({ duration: null, ...input, title, tone: 'error' }),
  info: (title: string, input: Omit<ToastInput, 'title' | 'tone'> = {}) =>
    useToastStore.getState().push({ ...input, title, tone: 'info' }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
