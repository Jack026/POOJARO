'use client';

import { useState } from 'react';
import { BadgeCheck, Star, PenLine, X, Check, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Product, Review } from '@/lib/data/types';
import { Rating } from '@/components/ui/Rating';
import { toast } from '@/components/ui/toast-store';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [city, setCity] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = reviews.length;
  const dist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => Math.round(r.rating) === stars).length,
  }));
  const hasDemo = reviews.some((r) => r.isDemo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !body.trim()) {
      setError('Please provide your name and review comments.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating,
          authorName: authorName.trim(),
          city: city.trim(),
          title: title.trim(),
          body: body.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSubmitted(true);
      toast.success('Review Submitted', {
        description: 'Thank you! Your review will appear after quick moderation.',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setSubmitted(false);
    setError(null);
    setAuthorName('');
    setCity('');
    setTitle('');
    setBody('');
    setRating(5);
  };

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="pt-4">
      {/* Header & Write Review Button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
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

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-deep hover:bg-gold-dark text-white rounded-lg text-xs font-semibold transition shadow-xs self-start sm:self-auto"
        >
          <PenLine className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {total === 0 ? (
        <div className="p-10 rounded-2xl bg-sand-soft/30 border border-sand-deep/30 text-center space-y-3">
          <p className="font-display text-lg text-brown">Be the first to review this ritual offering</p>
          <p className="text-xs text-brown-soft max-w-md mx-auto">
            Share your ceremony experience and thoughts on the samagri purity with fellow devotees.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-deep hover:underline mt-2"
          >
            <span>Click here to share your review</span>
          </button>
        </div>
      ) : (
        <>
          {/* Aggregate Stats */}
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

          {/* Individual Reviews */}
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

                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {review.photos.map((src, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg border border-sand-deep/40"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {/* Review Submission Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-card relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DDCF]">
              <div>
                <h3 className="font-display text-xl text-brown font-medium">Write a Review</h3>
                <p className="text-xs text-brown-muted mt-0.5">{product.name}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-brown-muted hover:text-brown transition-colors p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-display text-lg text-brown">Review Submitted!</h4>
                <p className="text-xs text-brown-soft max-w-sm mx-auto leading-relaxed">
                  Thank you for your review. It has been received and will be published on the product page following standard moderation.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-3 px-5 py-2 bg-gold-deep text-white rounded-lg text-xs font-semibold hover:bg-gold-dark transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Interactive Star Rating */}
                <div>
                  <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-2">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-gold-deep transition-transform hover:scale-110 focus:outline-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (hoverRating || rating) >= star
                              ? 'fill-gold-deep text-gold-deep'
                              : 'text-sand-deep stroke-[1.5]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-medium text-brown ml-2">
                      {hoverRating || rating} out of 5 stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Meera Joshi"
                      className="w-full bg-white border border-[#D9CBB9] rounded-lg px-3 py-2 text-xs text-brown focus:outline-none focus:border-gold-deep"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1">
                      City / State
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune, Maharashtra"
                      className="w-full bg-white border border-[#D9CBB9] rounded-lg px-3 py-2 text-xs text-brown focus:outline-none focus:border-gold-deep"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Divine fragrance and complete samagri"
                    className="w-full bg-white border border-[#D9CBB9] rounded-lg px-3 py-2 text-xs text-brown focus:outline-none focus:border-gold-deep"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1">
                    Detailed Experience *
                  </label>
                  <textarea
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Share how the kit performed during your puja, packaging quality, and fragrance..."
                    className="w-full bg-white border border-[#D9CBB9] rounded-lg px-3 py-2 text-xs text-brown focus:outline-none focus:border-gold-deep leading-relaxed"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E8DDCF]">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-medium text-brown-muted hover:text-brown transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-gold-deep hover:bg-gold-dark text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
