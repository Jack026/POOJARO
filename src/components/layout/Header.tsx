'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCartStore } from '@/components/cart/cart-store';
import { useWishlistStore } from '@/components/wishlist/wishlist-store';
import { PeacockMini } from '@/components/peacock';
import { MobileNav } from './MobileNav';
import { SearchOverlay } from './SearchOverlay';

export function Header() {
  const pathname = usePathname();
  const cartItemCount = useCartStore((s) => s.totalItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const cartHydrated = useCartStore((s) => s.hasHydrated);

  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const wishlistHydrated = useWishlistStore((s) => s.hasHydrated);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Scroll effect to compact header
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close overlays on route change
  useEffect(() => {
    setMobileNavOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-out-soft border-b ${
          isScrolled
            ? 'bg-ivory/95 backdrop-blur-sm border-sand-deep shadow-subtle py-2 md:py-3'
            : 'bg-ivory border-transparent py-4 md:py-5'
        }`}
      >
        <div className="container-page flex items-center justify-between">
          {/* Mobile Left: Hamburger & Search */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 -ml-2 text-brown hover:text-gold-deep transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-brown hover:text-gold-deep transition-colors"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Left: Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link href="/shop" className="text-sm font-medium text-brown hover:text-gold-deep transition-colors">
              Shop
            </Link>
            <Link href="/kits" className="text-sm font-medium text-brown hover:text-gold-deep transition-colors">
              Puja Kits
            </Link>
            <div className="relative group">
              <Link href="/occasions" className="text-sm font-medium text-brown hover:text-gold-deep transition-colors pb-4 -mb-4">
                Occasions
              </Link>
              {/* Simple dropdown */}
              <div className="absolute top-full left-0 pt-4 opacity-0 scale-95 origin-top-left invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-200">
                <div className="bg-ivory border border-sand-deep rounded-md shadow-card py-2 w-48 flex flex-col">
                  {['griha-pravesh', 'satyanarayan', 'lakshmi-puja', 'ganesh-puja'].map((slug) => (
                    <Link
                      key={slug}
                      href={`/occasions/${slug}`}
                      className="px-4 py-2 text-sm text-brown hover:bg-gold-wash hover:text-gold-deep transition-colors capitalize"
                    >
                      {slug.replace('-', ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/festivals" className="text-sm font-medium text-brown hover:text-gold-deep transition-colors">
              Festivals
            </Link>
          </nav>

          {/* Center: Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="POOJARO Home">
              <PeacockMini
                variant="henna-on-light"
                size={isScrolled ? 22 : 26}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shrink-0"
              />
              <div className="flex flex-col items-center">
                <span className={`font-display text-brown tracking-[0.14em] font-normal transition-all ${isScrolled ? 'text-xl' : 'text-2xl'}`}>
                  POOJARO
                </span>
                <span className="h-[1.5px] w-6 bg-gold/40 rounded-full transition-all duration-300 group-hover:w-full group-hover:bg-gold-deep" />
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 text-sm text-brown-muted hover:text-brown transition-colors group"
              aria-label="Search"
            >
              <Search className="w-4 h-4 group-hover:text-gold-deep transition-colors" />
              <span className="hidden lg:inline">Search</span>
            </button>

            <Link
              href="/account"
              className="hidden md:flex p-2 text-brown hover:text-gold-deep transition-colors"
              aria-label="My Account"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link
              href="/wishlist"
              className="hidden md:flex p-2 text-brown hover:text-gold-deep transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistHydrated && wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-danger text-ivory text-[10px] tabular font-bold rounded-full w-4 h-4 flex items-center justify-center border border-ivory">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={openCart}
              className="p-2 -mr-2 md:mr-0 text-brown hover:text-gold-deep transition-colors relative group"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartHydrated && cartItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-gold text-white text-[10px] tabular font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-subtle group-hover:bg-gold-deep transition-colors border border-ivory">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
