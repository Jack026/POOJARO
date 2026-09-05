/**
 * Image primitives (§46).
 *
 * Everything visual on the site goes through one of these three so that width,
 * height, `alt` and a blur placeholder are never optional. Missing dimensions
 * are the single largest source of layout shift, and a missing `alt` is an
 * accessibility failure that is invisible until someone is relying on it.
 *
 * `blurDataURL` comes from the build-time manifest in `lib/photos.ts`, so the
 * placeholder is the real image's own colours rather than a grey box.
 */
import Image, { type ImageProps } from 'next/image';

import { cn } from '@/lib/cn';
import { PHOTOS, photo, type PhotoAsset } from '@/lib/photos';
import type { ProductImage } from '@/lib/data/types';

/** Manifest entries keyed by their served path, so a stored URL can find its blur. */
const BY_SRC = new Map<string, PhotoAsset>(Object.values(PHOTOS).map((asset) => [asset.src, asset]));

export function assetForSrc(src: string): PhotoAsset | null {
  return BY_SRC.get(src) ?? null;
}

export interface PhotoProps extends Omit<ImageProps, 'src' | 'alt' | 'width' | 'height' | 'placeholder' | 'blurDataURL'> {
  /** Key into the photo manifest, e.g. "hero-thali". */
  name: string;
  /** Overrides the manifest's own alt text. Pass "" only for pure decoration. */
  alt?: string;
  className?: string;
}

/**
 * A curated photo from the manifest.
 *
 * Renders nothing if the key is unknown rather than throwing — a missing
 * decorative image should not take a product page down with it.
 */
export function Photo({ name, alt, className, sizes = '100vw', ...rest }: PhotoProps) {
  const asset = photo(name);
  if (!asset) return null;

  return (
    <Image
      src={asset.src}
      alt={alt ?? asset.alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={asset.blurDataURL}
      className={className}
      {...rest}
    />
  );
}

export interface ProductPhotoProps
  extends Omit<ImageProps, 'src' | 'alt' | 'width' | 'height' | 'placeholder' | 'blurDataURL'> {
  image: ProductImage;
  className?: string;
}

/**
 * A product image as stored in the datastore.
 *
 * Dimensions come from the record, so admin-uploaded images reserve space just
 * as reliably as the seeded ones. The blur is looked up by path when the image
 * is one of ours, and quietly skipped when it is not — an uploaded file has no
 * build-time placeholder, and inventing one would mean decoding it per request.
 */
export function ProductPhoto({ image, className, sizes = '(min-width: 768px) 50vw, 100vw', ...rest }: ProductPhotoProps) {
  const asset = assetForSrc(image.url);

  return (
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      {...(asset ? { placeholder: 'blur' as const, blurDataURL: asset.blurDataURL } : {})}
      className={className}
      {...rest}
    />
  );
}

/**
 * A photo that fills its positioned parent and zooms on hover (§13, §42).
 *
 * The zoom lives on the wrapper's `group` hover so a card can trigger it from
 * anywhere, and `motion-reduce` cancels it — a 4% scale is small, but it is
 * still movement someone asked not to see.
 */
export function ZoomPhoto({
  name,
  alt,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  className,
  wrapperClassName,
  priority,
}: {
  name: string;
  alt?: string;
  sizes?: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn('relative overflow-hidden bg-sand-soft', wrapperClassName)}>
      <Photo
        name={name}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          'object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          'group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100',
          className,
        )}
      />
    </div>
  );
}
