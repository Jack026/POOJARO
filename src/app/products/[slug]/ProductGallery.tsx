'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product } from '@/lib/data/types';
import { assetForSrc } from '@/components/ui/Photo';
import { cn } from '@/lib/cn';
import { EASE_OUT_SOFT } from '@/lib/motion';

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const images = product.images;
  const current = images[active];

  if (!current) {
    return (
      <div className="aspect-square rounded-2xl bg-sand-soft flex items-center justify-center text-brown-muted text-sm">
        No image
      </div>
    );
  }

  function prev() {
    setActive((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setActive((i) => (i + 1) % images.length);
  }

  const asset = assetForSrc(current.url);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-sand-soft cursor-zoom-in group"
        onClick={() => setZoomed(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_SOFT }}
          >
            <Image
              src={current.url}
              alt={current.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
              {...(asset
                ? { placeholder: 'blur' as const, blurDataURL: asset.blurDataURL }
                : {})}
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-ivory/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4 text-brown" />
        </div>

        {/* Nav arrows when multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-ivory/80 backdrop-blur-sm hover:bg-ivory transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 text-brown" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-ivory/80 backdrop-blur-sm hover:bg-ivory transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 text-brown" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => {
            const thumbAsset = assetForSrc(img.url);
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  'relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                  i === active ? 'border-gold-deep' : 'border-transparent hover:border-sand-deep',
                )}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === active}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="64px"
                  className="object-cover"
                  {...(thumbAsset
                    ? { placeholder: 'blur' as const, blurDataURL: thumbAsset.blurDataURL }
                    : {})}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Zoom lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            className="fixed inset-0 z-50 bg-charcoal/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
          >
            <motion.div
              className="relative max-w-3xl w-full aspect-square"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              transition={{ duration: 0.25, ease: EASE_OUT_SOFT }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-contain"
                {...(asset
                  ? { placeholder: 'blur' as const, blurDataURL: asset.blurDataURL }
                  : {})}
              />
            </motion.div>
            <button
              className="absolute top-4 right-4 text-ivory/70 hover:text-ivory text-sm"
              onClick={() => setZoomed(false)}
              aria-label="Close zoom view"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
