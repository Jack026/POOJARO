'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Heart, ShoppingBag, Check } from 'lucide-react';
import { Photo } from '@/components/ui/Photo';
import { Price } from '@/components/ui/Price';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/button-styles';
import { useCartStore } from '@/components/cart/cart-store';
import { useWishlistStore } from '@/components/wishlist/wishlist-store';
import { useQuickViewStore } from '@/components/quick-view/quick-view-store';
import { productPricing, stockState } from '@/lib/domain/product';
import { isKnownPhoto } from '@/lib/photos';
import type { Product } from '@/lib/data/types';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const openQuickView = useQuickViewStore((s) => s.openQuickView);

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const pricing = productPricing(product);
  const stock = stockState(product);
  const isWishlisted = isInWishlist(product.id);

  const primaryPhotoKey = product.images[0]?.url.replace(/^\/images\//, '').replace(/\.webp$/, '') ?? '';
  const hasPhoto = isKnownPhoto(primaryPhotoKey);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock === 'out_of_stock' || isAdding) return;

    setIsAdding(true);
    await addItem({
      productId: product.id,
      quantity: 1,
      name: product.name,
      openDrawer: false,
      showToast: true,
    });
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
  };

  return (
    <div className="group relative bg-ivory rounded-lg border border-sand-deep/50 hover:border-sand-deep hover:shadow-card transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Image Container */}
        <div className="relative aspect-square bg-sand-soft/40 overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block w-full h-full">
            {hasPhoto ? (
              <Photo
                name={primaryPhotoKey as any}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                priority={priority}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out-soft"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brown-muted">
                <ShoppingBag className="w-8 h-8 text-gold" />
              </div>
            )}
          </Link>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
            {product.isFeatured && <Badge tone="gold">Featured</Badge>}
            {pricing.discountPercent > 0 && (
              <Badge tone="solid">{pricing.discountPercent}% OFF</Badge>
            )}
          </div>

          {/* Top-right overlay actions */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id, product.name);
              }}
              className="p-2 rounded-full bg-ivory/90 backdrop-blur text-brown hover:text-danger shadow-subtle transition-transform hover:scale-110"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-danger text-danger' : 'text-brown'}`} />
            </button>
            <button
              type="button"
              onClick={handleQuickViewClick}
              className="p-2 rounded-full bg-ivory/90 backdrop-blur text-brown hover:text-gold-deep shadow-subtle transition-transform hover:scale-110 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Category */}
          <p className="text-[11px] text-brown-muted uppercase tracking-wider font-medium">
            {product.categoryName}
          </p>

          {/* Title */}
          <h3 className="text-base font-display text-brown line-clamp-1 font-medium group-hover:text-gold-deep transition-colors">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Rating */}
          <Rating value={product.rating} count={product.reviewCount} size="sm" />

          {/* Price */}
          <div className="pt-1">
            <Price pricing={pricing} size="md" />
          </div>
        </div>
      </div>

      {/* Quick Add Footer Action */}
      <div className="p-4 pt-0">
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={stock === 'out_of_stock' || isAdding}
          className={buttonClasses({
            variant: justAdded ? 'gold' : 'secondary',
            size: 'sm',
            fullWidth: true,
          })}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1" /> Added
            </>
          ) : stock === 'out_of_stock' ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Quick Add
            </>
          )}
        </button>
      </div>
    </div>
  );
}
