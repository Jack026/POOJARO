'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import type { Occasion, Category } from '@/lib/data/types';
import { Sheet } from '@/components/ui/Sheet';
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  }

  const activeOccasion = searchParams.get('occasion');
  const activeCategory = searchParams.get('category');
  const kitsOnly = searchParams.get('kits') === '1';
  const filterCount = (activeOccasion ? 1 : 0) + (activeCategory ? 1 : 0) + (kitsOnly ? 1 : 0);
  const hasFilters = filterCount > 0;

  const FilterContent = (
    <div className="space-y-6">
      {hasFilters && (
        <div className="flex items-center justify-between pb-3 border-b border-sand-deep/40">
          <span className="text-xs font-semibold text-gold-deep">
            {filterCount} filter{filterCount > 1 ? 's' : ''} applied
          </span>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-danger hover:underline font-medium"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>
      )}

      {/* Kits filter */}
      <div>
        <p className="text-xs font-bold text-brown uppercase tracking-[0.14em] mb-3">
          Type
        </p>
        <div className="bg-sand-soft/40 p-2.5 rounded-lg border border-sand-deep/30">
          <Checkbox
            label="Complete Puja Kits only"
            checked={kitsOnly}
            onChange={() => toggleFlag('kits')}
          />
        </div>
      </div>

      {/* Occasion */}
      {occasions.filter((o) => o.isActive).length > 0 && (
        <div>
          <p className="text-xs font-bold text-brown uppercase tracking-[0.14em] mb-3">
            Shop by Occasion
          </p>
          <div className="space-y-1">
            {occasions
              .filter((o) => o.isActive)
              .map((o) => (
                <button
                  key={o.id}
                  onClick={() => toggle('occasion', o.slug)}
                  className={cn(
                    'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
                    activeOccasion === o.slug
                      ? 'bg-gold-wash text-brown font-semibold border border-gold-deep/30'
                      : 'text-brown-soft hover:text-brown hover:bg-sand-soft/50',
                  )}
                >
                  <span>{o.name}</span>
                  {activeOccasion === o.slug && <Check className="w-4 h-4 text-gold-deep shrink-0" />}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Category */}
      {categories.filter((c) => c.isActive).length > 0 && (
        <div>
          <p className="text-xs font-bold text-brown uppercase tracking-[0.14em] mb-3">
            Samagri Category
          </p>
          <div className="space-y-1">
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggle('category', c.slug)}
                  className={cn(
                    'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
                    activeCategory === c.slug
                      ? 'bg-gold-wash text-brown font-semibold border border-gold-deep/30'
                      : 'text-brown-soft hover:text-brown hover:bg-sand-soft/50',
                  )}
                >
                  <span>{c.name}</span>
                  {activeCategory === c.slug && <Check className="w-4 h-4 text-gold-deep shrink-0" />}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="block lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-sand-deep bg-white text-sm font-medium text-brown hover:bg-sand-soft/40 transition-colors shadow-2xs"
        >
          <SlidersHorizontal className="w-4 h-4 text-gold-deep" />
          <span>Filter Products</span>
          {hasFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-gold text-white">
              {filterCount}
            </span>
          )}
        </button>

        {/* Mobile Filter Sheet */}
        <Sheet
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          side="left"
          title="Filter Products"
          className="max-w-xs w-full"
          footer={
            <div className="pt-2 border-t border-sand-deep/40">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 bg-[#B78332] text-white rounded-lg text-sm font-medium hover:bg-opacity-95 transition-colors"
              >
                View Results
              </button>
            </div>
          }
        >
          <div className="pb-6">{FilterContent}</div>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block sticky top-28">{FilterContent}</div>
    </>
  );
}
