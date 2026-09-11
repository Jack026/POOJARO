'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useQuickViewStore } from './quick-view-store';
import { useCartStore } from '@/components/cart/cart-store';
import { useWishlistStore } from '@/components/wishlist/wishlist-store';
import { Modal } from '@/components/ui/Modal';
import { Photo } from '@/components/ui/Photo';
import { Price } from '@/components/ui/Price';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { buttonClasses } from '@/components/ui/button-styles';
import { productPricing, stockState } from '@/lib/domain/product';
import { isKnownPhoto } from '@/lib/photos';
import type { Product, ProductVariant } from '@/lib/data/types';

export function QuickViewModal() {
  const router = useRouter();
  const { product, isOpen, closeQuickView } = useQuickViewStore();
  const addItem = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Sync default variant when product changes
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0] ?? null);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const pricing = productPricing(product, selectedVariant);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const stock = stockState(product, selectedVariant);
  const isWishlisted = isInWishlist(product.id);

  const primaryPhotoKey = product.images[0]?.url.replace(/^\/images\//, '').replace(/\.webp$/, '') ?? '';
  const hasPhoto = isKnownPhoto(primaryPhotoKey);

  const handleAddToCart = async (openDrawer = false) => {
    setIsAdding(true);
    await addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? undefined,
      quantity,
      name: product.name,
      openDrawer,
    });
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    await handleAddToCart(false);
    closeQuickView();
    router.push('/checkout');
  };

  return (
    <Modal
      open={isOpen}
      onClose={closeQuickView}
      title={product.name}
      hideTitle
      size="lg"
      className="p-0 overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Left: Image */}
        <div className="relative aspect-square bg-sand-soft/50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-sand-deep/40">
          <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
            {hasPhoto ? (
              <Photo
                name={primaryPhotoKey as any}
                sizes="(min-width: 768px) 360px, 90vw"
                className="object-contain w-full h-full rounded-lg"
              />
            ) : (
              <div className="text-center text-brown-muted p-8">
                <ShoppingBag className="w-12 h-12 mx-auto text-gold mb-2" />
                <p className="text-xs">Authentic Puja Samagri</p>
              </div>
            )}
          </div>

          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {product.isFeatured && (
              <Badge tone="gold">Featured Kit</Badge>
            )}
            {pricing.discountPercent > 0 && (
              <Badge tone="solid">{pricing.discountPercent}% OFF</Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product.id, product.name)}
            className="absolute top-4 right-4 p-2 rounded-full bg-ivory/90 backdrop-blur shadow-sm text-brown hover:text-danger transition-colors"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-danger text-danger' : 'text-brown'}`}
            />
          </button>
        </div>

        {/* Right: Details */}
        <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            {/* Category / Occasion */}
            <div className="flex items-center gap-2 text-xs text-brown-muted">
              <span>{product.categoryName}</span>
              {product.isKit && (
                <>
                  <span>•</span>
                  <span className="text-gold-deep font-medium">Complete Puja Kit</span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="text-display-sm text-brown font-display leading-snug">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <Rating value={product.rating} count={product.reviewCount} size="sm" />
            </div>

            {/* Price */}
            <div className="pt-1">
              <Price pricing={pricing} size="lg" />
            </div>

            {/* Short Description */}
            <p className="text-xs text-brown-soft leading-relaxed pt-1">
              {product.shortDescription}
            </p>

            {/* Variants if any */}
            {product.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-sand-deep/40">
                <label className="text-xs font-medium text-brown">Select Option</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          isSelected
                            ? 'border-brown bg-brown text-ivory font-medium'
                            : 'border-sand-deep bg-ivory text-brown hover:border-gold-deep'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock indicator */}
            <div className="pt-2">
              {stock === 'in_stock' && (
                <p className="text-xs text-success flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  In Stock & Ready for Dispatch
                </p>
              )}
              {stock === 'low_stock' && (
                <p className="text-xs text-gold-deep flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Only {currentStock} remaining in stock
                </p>
              )}
              {stock === 'out_of_stock' && (
                <p className="text-xs text-danger font-medium">
                  Currently Out of Stock
                </p>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-3 pt-4 border-t border-sand-deep/60">
            <div className="flex items-center gap-3">
              <QtyStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={Math.min(20, currentStock || 20)}
                disabled={stock === 'out_of_stock' || isAdding}
                size="md"
                itemLabel={product.name}
              />

              <button
                type="button"
                onClick={() => void handleAddToCart(true)}
                disabled={stock === 'out_of_stock' || isAdding}
                className={buttonClasses({
                  variant: 'primary',
                  size: 'md',
                  className: 'flex-1',
                })}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleBuyNow()}
                disabled={stock === 'out_of_stock' || isAdding}
                className={buttonClasses({
                  variant: 'gold',
                  size: 'md',
                  fullWidth: true,
                })}
              >
                <span>Buy Now with 1-Click</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>

            {/* Link to Full PDP */}
            <div className="text-center pt-1">
              <Link
                href={`/products/${product.slug}`}
                onClick={closeQuickView}
                className="text-xs text-gold-deep hover:text-brown font-medium transition-colors"
              >
                View Full Kit Specifications & Preparation Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}