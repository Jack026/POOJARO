'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { syncCartAction } from './actions';
import { toast } from '@/components/ui/toast-store';
import type { CartItem, PricedCart } from '@/lib/data/types';
import type { CouponEvaluation } from '@/lib/data/store';

export interface CartStoreState {
  items: CartItem[];
  couponCode: string | null;
  isOpen: boolean;
  pricedCart: PricedCart | null;
  couponEvaluation: CouponEvaluation | null;
  isSyncing: boolean;
  hasHydrated: boolean;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setHasHydrated: (state: boolean) => void;
  addItem: (item: {
    productId: string;
    variantId?: string | null;
    quantity?: number;
    name?: string;
    openDrawer?: boolean;
    showToast?: boolean;
  }) => Promise<void>;
  updateQty: (productId: string, variantId: string | null | undefined, quantity: number) => Promise<void>;
  removeItem: (productId: string, variantId?: string | null) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ valid: boolean; message?: string }>;
  removeCoupon: () => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  totalItemCount: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      isOpen: false,
      pricedCart: null,
      couponEvaluation: null,
      isSyncing: false,
      hasHydrated: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),

      totalItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },

      syncCart: async () => {
        const { items, couponCode } = get();
        if (items.length === 0) {
          set({ pricedCart: null, couponEvaluation: null });
          return;
        }

        set({ isSyncing: true });
        try {
          // Use fetch to /api/cart/sync to avoid Next.js "Router action dispatched before initialization"
          const res = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, couponCode }),
          });

          if (res.ok) {
            const result = await res.json();
            set({
              pricedCart: result.pricedCart,
              couponEvaluation: result.couponEvaluation,
              isSyncing: false,
            });
          } else {
            // Fallback to server action if needed
            const result = await syncCartAction({ items, couponCode });
            set({
              pricedCart: result.pricedCart,
              couponEvaluation: result.couponEvaluation,
              isSyncing: false,
            });
          }
        } catch (error) {
          console.error('[CartStore] Failed to sync cart:', error);
          set({ isSyncing: false });
        }
      },

      addItem: async ({
        productId,
        variantId = null,
        quantity = 1,
        name,
        openDrawer = false,
        showToast = true,
      }) => {
        const currentItems = [...get().items];
        const existingIndex = currentItems.findIndex(
          (item) => item.productId === productId && (item.variantId ?? null) === (variantId ?? null),
        );

        if (existingIndex >= 0 && currentItems[existingIndex]) {
          const newQty = Math.min(20, currentItems[existingIndex].qty + quantity);
          currentItems[existingIndex] = {
            ...currentItems[existingIndex],
            qty: newQty,
          };
        } else {
          currentItems.push({
            productId,
            variantId: variantId ?? null,
            qty: Math.min(20, Math.max(1, quantity)),
          });
        }

        set({ items: currentItems });

        if (showToast) {
          toast.success(name ? `${name} added to your cart` : 'Added to your cart', {
            description: 'Your ritual box has been updated.',
            actions: [
              {
                label: 'View Cart',
                onClick: () => get().openCart(),
              },
              {
                label: 'Checkout',
                href: '/checkout',
              },
            ],
          });
        }

        if (openDrawer) {
          set({ isOpen: true });
        }

        await get().syncCart();
      },

      updateQty: async (productId, variantId = null, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId, variantId);
          return;
        }

        const currentItems = get().items.map((item) => {
          if (item.productId === productId && (item.variantId ?? null) === (variantId ?? null)) {
            return { ...item, qty: Math.min(20, Math.max(1, quantity)) };
          }
          return item;
        });

        set({ items: currentItems });
        await get().syncCart();
      },

      removeItem: async (productId, variantId = null) => {
        const currentItems = get().items.filter(
          (item) => !(item.productId === productId && (item.variantId ?? null) === (variantId ?? null)),
        );
        set({ items: currentItems });
        await get().syncCart();
      },

      applyCoupon: async (code: string) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
          return { valid: false, message: 'Please enter a coupon code.' };
        }

        set({ couponCode: trimmed, isSyncing: true });
        try {
          const result = await syncCartAction({ items: get().items, couponCode: trimmed });
          set({
            pricedCart: result.pricedCart,
            couponEvaluation: result.couponEvaluation,
            isSyncing: false,
          });

          if (result.couponEvaluation && !result.couponEvaluation.ok) {
            set({ couponCode: null });
            return { valid: false, message: result.couponEvaluation.message ?? 'Coupon cannot be applied to this cart.' };
          }

          if (result.couponEvaluation?.ok) {
            toast.success(`Coupon ${trimmed} applied!`, {
              description: 'Discount has been applied to your order total.',
            });
            return { valid: true };
          }

          set({ couponCode: null });
          return { valid: false, message: 'Invalid coupon code.' };
        } catch (error) {
          console.error('[CartStore] Failed to apply coupon:', error);
          set({ isSyncing: false, couponCode: null });
          return { valid: false, message: 'Failed to apply coupon. Please try again.' };
        }
      },

      removeCoupon: async () => {
        set({ couponCode: null });
        await get().syncCart();
        toast.info('Coupon removed', {
          description: 'Cart totals updated.',
        });
      },

      clearCart: () => {
        set({
          items: [],
          couponCode: null,
          pricedCart: null,
          couponEvaluation: null,
        });
      },
    }),
    {
      name: 'poojaro-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state && state.items.length > 0) {
          // Defer to next tick so window/router is fully initialized
          setTimeout(() => {
            void state.syncCart();
          }, 0);
        }
      },
    },
  ),
);
