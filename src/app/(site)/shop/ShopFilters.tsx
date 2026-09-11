'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import type { Occasion, Category } from '@/lib/data/types';
import { Checkbox } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

interface ShopFiltersProps {
  occasions: Occasion[];
  categories: Category[];
}

export function ShopFilters({ occasions, categories }: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleFlag(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === '1') {
      params.delete(key);
    } else {
      params.set(key, '1');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const activeOccasion = searchParams.get('occasion');
  const activeCategory = searchParams.get('category');
  const kitsOnly = searchParams.get('kits') === '1';
  const hasFilters = !!(activeOccasion || activeCategory || kitsOnly);

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-brown-muted hover:text-brown transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear all filters
        </button>
      )}

      {/* Kits filter */}
      <div>
        <p className="text-xs font-semibold text-brown uppercase tracking-[0.12em] mb-3">
          Type
        </p>
        <Checkbox
          label="Puja Kits only"
          checked={kitsOnly}
          onChange={() => toggleFlag('kits')}
        />
      </div>

      {/* Occasion */}
      {occasions.filter((o) => o.isActive).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-brown uppercase tracking-[0.12em] mb-3">
            Occasion
          </p>
          <div className="space-y-0.5">
            {occasions
              .filter((o) => o.isActive)
              .map((o) => (
                <button
                  key={o.id}
                  onClick={() => toggle('occasion', o.slug)}
                  className={cn(
                    'w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors',
                    activeOccasion === o.slug
                      ? 'bg-gold-wash text-brown font-medium'
                      : 'text-brown-soft hover:text-brown hover:bg-sand-soft/50',
                  )}
                >
                  {o.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Category */}
      {categories.filter((c) => c.isActive).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-brown uppercase tracking-[0.12em] mb-3">
            Category
          </p>
          <div className="space-y-0.5">
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggle('category', c.slug)}
                  className={cn(
                    'w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors',
                    activeCategory === c.slug
                      ? 'bg-gold-wash text-brown font-medium'
                      : 'text-brown-soft hover:text-brown hover:bg-sand-soft/50',
                  )}
                >
                  {c.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
