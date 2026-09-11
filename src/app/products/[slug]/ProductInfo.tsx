'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Share2, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import type { Product } from '@/lib/data/types';
import { productPricing, stockState, stockLabel, defaultVariant, isPurchasable } from '@/lib/domain/product';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { useCartStore } from '@/components/cart/cart-store';
import { useWishlistStore } from '@/components/wishlist/wishlist-store';
import { cn } from '@/lib/cn';

export function ProductInfo({ product }: { product: Product }) {
  const defaultV = defaultVariant(product);
  const [selectedVariant, setSelectedVariant] = useState(defaultV);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  const pricing = productPricing(product, selectedVariant);
  const stock = stockState(product, selectedVariant);
  const stockMsg = stockLabel(product, selectedVariant);
  const purchasable = isPurchasable(product, selectedVariant);
  const wishlisted = isInWishlist(product.id);

  async function handleAddToCart() {
    if (!purchasable) return;
    setIsAdding(true);
    await addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? undefined,
      quantity,
      name: product.name,
    });
    setIsAdding(false);
    openCart();
  }

  async function handleBuyNow() {
    if (!purchasable) return;
    setIsAdding(true);
    await addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? undefined,
      quantity,
      name: product.name,
    });
    setIsAdding(false);
    window.location.href = '/checkout';
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {}).catch(() => {});
    }
  }

  return (
    <div className="space-y-6">
      {/* Category eyebrow */}
      {product.categoryName && (
        <p className="text-xs eyebrow text-gold-deep">{product.categoryName}</p>
      )}

      {/* Name */}
      <h1 className="font-display text-display-lg md:text-display-xl text-brown leading-tight">
        {product.name}
      </h1>

      {/* Rating */}
      {product.reviewCount > 0 && (
        <div className="flex items-center gap-3">
          <Rating value={product.rating} count={product.reviewCount} showCount size="sm" />
          <a href="#reviews" className="text-xs text-brown-muted underline underline-offset-2">
            {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}
          </a>
        </div>
      )}

      {/* Price */}
      <Price pricing={pricing} size="lg" />

      {/* Stock */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            stock === 'in_stock' && 'bg-emerald-500',
            stock === 'low_stock' && 'bg-amber-500',
            stock === 'out_of_stock' && 'bg-red-400',
          )}
        />
        <span
          className={cn(
            'text-sm',
            stock === 'in_stock' && 'text-brown-soft',
            stock === 'low_stock' && 'text-amber-700 font-medium',
            stock === 'out_of_stock' && 'text-red-600',
          )}
        >
          {stock === 'out_of_stock' ? 'This ritual essential is currently unavailable.' : stockMsg}
        </span>
      </div>

      {/* Variant chips */}
      {product.variants.length > 0 && (
        <div>
          <p className="text-xs font-medium text-brown-muted mb-2">
            {selectedVariant?.label ?? 'Options'}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                  selectedVariant?.id === v.id
                    ? 'border-gold-deep bg-gold-wash text-brown font-medium'
                    : 'border-sand-deep text-brown-soft hover:border-brown',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      {purchasable && (
        <div className="flex items-center gap-4">
          <p className="text-xs text-brown-muted">Qty</p>
          <QtyStepper
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={10}
            itemLabel={product.name}
          />
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isAdding}
          loadingLabel="Adding…"
          disabled={!purchasable}
          onClick={handleAddToCart}
        >
          {purchasable ? 'Add to Cart' : 'Currently Unavailable'}
        </Button>
        {purchasable && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={isAdding}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        )}
      </div>

      {/* Wishlist + Share */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => toggleWishlist(product.id, product.name)}
          className="flex items-center gap-1.5 text-sm text-brown-muted hover:text-brown transition-colors"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-all',
              wishlisted ? 'fill-rose-400 text-rose-400' : '',
            )}
          />
          {wishlisted ? 'Saved' : 'Wishlist'}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-brown-muted hover:text-brown transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Delivery note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-sand-soft/40 border border-sand-deep/30">
        <Truck className="w-4 h-4 text-gold-deep mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-brown">Pan-India Delivery</p>
          <p className="text-xs text-brown-muted mt-0.5">
            Typically delivered within 3–6 business days. Express options available at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
