'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '@/components/wishlist/wishlist-store';
import { useCartStore } from '@/components/cart/cart-store';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Photo } from '@/components/ui/Photo';
import { isKnownPhoto, normalizePhotoKey, resolveImageUrl } from '@/lib/photos';
import { formatMoney } from '@/lib/format';
import { PeacockMini } from '@/components/peacock';

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
            <PeacockMini size={64} className="mx-auto mb-4" />
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

function WishlistItems({
  productIds,
  onRemove,
  onAddToCart,
}: {
  productIds: string[];
  onRemove: (id: string, name?: string) => void;
  onAddToCart: (productId: string, name?: string) => void;
}) {
  const [products, setProducts] = useState<Record<string, any>>({});

  useEffect(() => {
    if (productIds.length === 0) return;
    fetch(`/api/products?ids=${encodeURIComponent(productIds.join(','))}`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) {
          const map: Record<string, any> = {};
          for (const p of list) {
            map[p.id] = p;
          }
          setProducts(map);
        }
      })
      .catch((e) => console.error('Failed to load wishlist products', e));
  }, [productIds]);

  return (
    <div className="space-y-3">
      {productIds.map((id) => {
        const product = products[id];
        const image = product?.images?.[0];
        const photoKey = image?.url ? normalizePhotoKey(image.url) : '';
        const hasPhoto = isKnownPhoto(photoKey);

        return (
          <div
            key={id}
            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-sand-deep bg-sand-soft/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-16 h-16 rounded-lg bg-sand-deep/30 shrink-0 overflow-hidden relative border border-sand-deep/50 flex items-center justify-center">
                {hasPhoto ? (
                  <Photo name={photoKey} sizes="64px" className="w-full h-full object-cover" />
                ) : image?.url ? (
                  <Image
                    src={resolveImageUrl(image.url)}
                    alt={image.alt || product?.name || ''}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Heart className="w-5 h-5 text-brown-muted" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                {product ? (
                  <>
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm font-medium text-brown hover:text-gold-deep transition-colors truncate block"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs font-semibold text-gold-deep mt-0.5">
                      {formatMoney(product.price)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-brown-muted truncate font-mono">{id}</p>
                    <p className="text-xs text-brown-muted mt-0.5">Saved item</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onAddToCart(id, product?.name)}
                className="p-2 rounded-lg border border-sand-deep text-brown hover:border-brown/50 hover:bg-sand-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onRemove(id, product?.name)}
                className="p-2 rounded-lg border border-sand-deep text-brown-muted hover:text-red-500 hover:border-red-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
                aria-label="Remove from wishlist"
              >
                <Heart className="w-4 h-4 fill-current" aria-hidden />
              </button>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-brown-muted pt-2">
        Visit each product page to see details and current pricing.{' '}
        <Link href="/shop" className="text-gold-deep underline underline-offset-2">Browse shop</Link>
      </p>
    </div>
  );
}

