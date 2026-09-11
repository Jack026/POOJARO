import { BadgeCheck } from 'lucide-react';
import type { Product, Review } from '@/lib/data/types';
import { Rating } from '@/components/ui/Rating';

interface ProductReviewsProps {
  product: Product;
  reviews: Review[];
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs text-brown-muted">
      <span className="w-4 text-right tabular-nums">{stars}</span>
      <div className="flex-1 h-1.5 rounded-full bg-sand-deep/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-gold-deep"
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
      <span className="w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

export function ProductReviews({ product, reviews }: ProductReviewsProps) {
  if (reviews.length === 0) return null;

  const total = reviews.length;
  const dist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => Math.round(r.rating) === stars).length,
  }));
  const hasDemo = reviews.some((r) => r.isDemo);

  return (
    <section id="reviews" aria-labelledby="reviews-heading">
      <div className="mb-8">
        <p className="eyebrow text-gold-deep mb-2 text-xs">Customer Reviews</p>
        <h2 id="reviews-heading" className="font-display text-display-md text-brown">
          What People Are Saying
        </h2>
        {hasDemo && (
          <p className="mt-2 text-xs text-brown-muted">
            Reviews labelled &ldquo;Sample&rdquo; are illustrative — not from real customers.
          </p>
        )}
      </div>

      {/* Aggregate */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 rounded-xl bg-sand-soft/40 border border-sand-deep/30">
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <span className="font-display text-5xl text-brown tabular-nums">
            {product.rating.toFixed(1)}
          </span>
          <Rating value={product.rating} size="sm" />
          <span className="text-xs text-brown-muted">
            {total} review{total === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {dist.map(({ stars, count }) => (
            <RatingBar key={stars} stars={stars} count={count} total={total} />
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-5">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="p-5 rounded-xl bg-sand-soft/40 border border-sand-deep/30"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-brown">{review.authorName}</span>
                  {review.city && (
                    <span className="text-xs text-brown-muted">{review.city}</span>
                  )}
                  {review.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                      <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      Verified purchase
                    </span>
                  )}
                  {review.isDemo && (
                    <span className="text-xs bg-sand-deep/50 text-brown-muted px-1.5 py-0.5 rounded">
                      Sample
                    </span>
                  )}
                </div>
                <Rating value={review.rating} size="sm" />
              </div>
              <time
                className="text-xs text-brown-muted shrink-0 pt-0.5"
                dateTime={review.createdAt}
              >
                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </time>
            </div>

            {review.title && (
              <p className="text-sm font-medium text-brown mb-1.5">{review.title}</p>
            )}
            <p className="text-sm text-brown-soft leading-relaxed">{review.body}</p>

            {review.photos.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {review.photos.map((src, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={src}
                    alt={`Review photo ${i + 1}`}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
