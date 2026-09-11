'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, TrendingUp, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { EASE_OUT_SOFT, DURATION } from '@/lib/motion';
import { formatMoney } from '@/lib/format';
import { isKnownPhoto, photo, normalizePhotoKey, resolveImageUrl } from '@/lib/photos';
import Image from 'next/image';

const POPULAR_SEARCHES = [
  'Ganesh Puja Kit',
  'Griha Pravesh Samagri',
  'Diwali Puja Kit',
  'Camphor Tablets',
  'Havan Samagri',
  'Lakshmi Puja',
  'Satyanarayan',
  'Agarbatti',
];

interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  imageUrl: string | null;
  isKit: boolean;
}

async function fetchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
    if (!res.ok) return [];
    return (await res.json()) as SearchSuggestion[];
  } catch {
    return [];
  }
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('poojaro-recent-searches');
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  // Autofocus
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setSuggestions([]);
    }
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(query);
      setSuggestions(results);
      setIsSearching(false);
    }, 260);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const saveAndNavigate = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const stored = JSON.parse(localStorage.getItem('poojaro-recent-searches') ?? '[]') as string[];
      const updated = [trimmed, ...stored.filter((s) => s !== trimmed)].slice(0, 5);
      localStorage.setItem('poojaro-recent-searches', JSON.stringify(updated));
    } catch { /* ignore */ }
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [router, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAndNavigate(query);
  };

  const clearRecent = () => {
    localStorage.removeItem('poojaro-recent-searches');
    setRecentSearches([]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT_SOFT }}
            className="fixed inset-0 z-[80] bg-charcoal/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT_SOFT }}
            className="fixed top-0 inset-x-0 z-[81] bg-ivory border-b border-sand-deep shadow-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
          >
            <div className="container-page py-4 md:py-6">
              {/* Search input row */}
              <form onSubmit={handleSubmit} className="flex items-center gap-3 md:gap-4">
                <Search className="w-5 h-5 text-gold-deep shrink-0" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search puja kits, samagri, occasions…"
                  className="flex-1 text-base md:text-lg text-brown bg-transparent focus:outline-none placeholder:text-brown-muted/60"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1.5 text-brown-muted hover:text-brown transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs text-brown-muted hover:text-brown border border-sand-deep rounded-md transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ESC</span>
                </button>
              </form>

              {/* Divider */}
              <div className="rule-fade mt-4" />

              {/* Results pane */}
              <div className="mt-5 pb-2 min-h-[160px]">
                {/* Live suggestions */}
                {query.trim().length >= 2 && (
                  <div className="space-y-1">
                    {isSearching ? (
                      <p className="text-sm text-brown-muted py-2 animate-pulse">Searching…</p>
                    ) : suggestions.length > 0 ? (
                      <>
                        <p className="text-xs eyebrow pb-2">Products</p>
                        <ul role="listbox" className="space-y-1">
                          {suggestions.map((s) => {
                            const photoKey = s.imageUrl ? normalizePhotoKey(s.imageUrl) : '';
                            const asset = isKnownPhoto(photoKey) ? photo(photoKey) : null;
                            return (
                              <li key={s.id} role="option" aria-selected={false}>
                                <Link
                                  href={`/products/${s.slug}`}
                                  onClick={() => {
                                    saveAndNavigate(s.name);
                                  }}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-sand-soft/60 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-md bg-sand-soft/80 border border-sand-deep/40 shrink-0 overflow-hidden flex items-center justify-center">
                                    {asset ? (
                                      <Image
                                        src={asset.src}
                                        alt={asset.alt}
                                        width={40}
                                        height={40}
                                        className="object-cover w-full h-full"
                                        placeholder="blur"
                                        blurDataURL={asset.blurDataURL}
                                      />
                                    ) : s.imageUrl ? (
                                      <Image
                                        src={resolveImageUrl(s.imageUrl)}
                                        alt={s.name}
                                        width={40}
                                        height={40}
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <ShoppingBag className="w-4 h-4 text-gold" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-brown group-hover:text-gold-deep transition-colors truncate">
                                      {s.name}
                                    </p>
                                    {s.isKit && (
                                      <p className="text-[11px] text-gold-deep">Complete Puja Kit</p>
                                    )}
                                  </div>
                                  <div className="tabular text-sm font-medium text-brown shrink-0">
                                    {formatMoney(s.price)}
                                    {s.mrp > s.price && (
                                      <span className="text-brown-muted line-through text-xs ml-1">
                                        {formatMoney(s.mrp)}
                                      </span>
                                    )}
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-brown-muted group-hover:text-gold-deep transition-colors" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={() => saveAndNavigate(query)}
                            className="text-xs text-gold-deep font-medium hover:underline flex items-center gap-1"
                          >
                            <Search className="w-3.5 h-3.5" />
                            See all results for &quot;{query}&quot;
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <p className="text-sm text-brown-soft mb-3">
                          We couldn&apos;t find &quot;{query}&quot;. Try a different ritual or look below.
                        </p>
                        <p className="text-xs eyebrow pb-2">Popular Searches</p>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_SEARCHES.slice(0, 5).map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => saveAndNavigate(term)}
                              className="px-3 py-1.5 text-xs text-brown bg-sand-soft/80 hover:bg-sand-deep/60 border border-sand-deep/50 rounded-full transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Idle state: recent + popular */}
                {query.trim().length < 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Recent */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs eyebrow flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Recent
                          </p>
                          <button
                            onClick={clearRecent}
                            className="text-[11px] text-brown-muted hover:text-brown transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {recentSearches.map((term) => (
                            <li key={term}>
                              <button
                                type="button"
                                onClick={() => saveAndNavigate(term)}
                                className="text-sm text-brown hover:text-gold-deep transition-colors flex items-center gap-2 w-full text-left py-1"
                              >
                                <Clock className="w-3.5 h-3.5 text-brown-muted shrink-0" />
                                {term}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Popular */}
                    <div>
                      <p className="text-xs eyebrow flex items-center gap-1.5 mb-3">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Popular Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => saveAndNavigate(term)}
                            className="px-3 py-1.5 text-xs text-brown bg-sand-soft/60 hover:bg-sand-deep/60 border border-sand-deep/40 rounded-full transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
