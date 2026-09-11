'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/data/types';

export interface QuickViewState {
  product: Product | null;
  isOpen: boolean;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  product: null,
  isOpen: false,
  openQuickView: (product) => set({ product, isOpen: true }),
  closeQuickView: () => set({ isOpen: false, product: null }),
}));
