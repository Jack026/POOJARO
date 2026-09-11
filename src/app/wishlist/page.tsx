'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '@/components/wishlist/wishlist-store';
import { useCartStore } from '@/components/cart/cart-store';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

const CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Wishlist' },
];

export default function WishlistPage() {
  const { productIds, toggleWishlist, hasHydrated } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  if (!hasHydrated) {
    return (
      <main id="main" className="pt-10 pb-16">
        <div className="container-page max-w-2xl">
          <div className="h-8 w-48 bg-sand-deep/40 rounded animate-pulse mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-sand-deep/30 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="pt-10 pb-16">
      <div className="container-page max-w-2xl">
        <Breadcrumb items={CRUMBS} className="mb-6" />
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-gold-deep" aria-hidden />
          <h1 className="font-display text-display-xl text-brown">Saved Items</h1>
        </div>

        {productIds.length === 0 ? (
          <div className="py-16 text-center">
            <Heart className="w-10 h-10 text-sand-deep mx-auto mb-4" aria-hidden />
            <p className="text-brown font-medium mb-2">Your wishlist is empty</p>
            <p className="text-brown-soft text-sm mb-6">
              Save items you want to buy later using the heart icon on any product.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-brown text-sand-soft px-5 py-2.5 text-sm font-medium hover:bg-brown/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-brown-soft mb-6">
              {productIds.length} {productIds.length === 1 ? 'item' : 'items'} saved
            </p>
            <WishlistItems
              productIds={productIds}
              onRemove={(id, name) => toggleWishlist(id, name)}
              onAddToCart={(productId, name) => addItem({ productId, name, showToast: true })}
            />
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * We only have IDs client-side. The product data must be fetched.
 * Since wishlist is localStorage-only and this is a client component, we
 * display a note directing users to view each product. A future enhancement
 * can add a Server Action to hydrate product data from IDs.
 */
function WishlistItems({
  productIds,
  onRemove,
  onAddToCart,
}: {
  productIds: string[];
  onRemove: (id: string, name?: string) => void;
  onAddToCart: (productId: string, name?: string) => void;
}) {
  return (
    <div className="space-y-3">
      {productIds.map((id) => (
        <div
          key={id}
          className="flex items-center justify-between gap-4 p-4 rounded-xl border border-sand-deep bg-sand-soft/20"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-sand-deep/30 shrink-0 flex items-center justify-center">
              <Heart className="w-5 h-5 text-brown-muted" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-brown-muted truncate font-mono">{id}</p>
              <p className="text-xs text-brown-muted mt-0.5">Saved item</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onAddToCart(id)}
              className="p-2 rounded-lg border border-sand-deep text-brown hover:border-brown/50 hover:bg-sand-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="p-2 rounded-lg border border-sand-deep text-brown-muted hover:text-red-500 hover:border-red-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
              aria-label="Remove from wishlist"
            >
              <Heart className="w-4 h-4 fill-current" aria-hidden />
            </button>
          </div>
        </div>
      ))}
      <p className="text-xs text-brown-muted pt-2">
        Visit each product page to see details and current pricing.{' '}
        <Link href="/shop" className="text-gold-deep underline underline-offset-2">Browse shop</Link>
      </p>
    </div>
  );
}
