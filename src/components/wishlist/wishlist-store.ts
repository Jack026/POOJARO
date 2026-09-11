'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from '@/components/ui/toast-store';

export interface WishlistState {
  productIds: string[];
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  toggleWishlist: (productId: string, name?: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      isInWishlist: (productId) => {
        return get().productIds.includes(productId);
      },

      toggleWishlist: (productId, name) => {
        const current = get().productIds;
        const exists = current.includes(productId);

        if (exists) {
          set({ productIds: current.filter((id) => id !== productId) });
          toast.info(name ? `${name} removed` : 'Removed from wishlist', {
            description: 'Item removed from your saved rituals.',
          });
        } else {
          set({ productIds: [...current, productId] });
          toast.success(name ? `${name} saved` : 'Saved to wishlist', {
            description: 'View your saved items anytime.',
            actions: [
              {
                label: 'View Wishlist',
                href: '/account/wishlist',
              },
            ],
          });
        }
      },

      clearWishlist: () => set({ productIds: [] }),
    }),
    {
      name: 'poojaro-wishlist',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
