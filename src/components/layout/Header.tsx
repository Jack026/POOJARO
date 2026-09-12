'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, ShoppingBag, Heart, User, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/components/cart/cart-store';
import { useWishlistStore } from '@/components/wishlist/wishlist-store';
import { MobileNav } from './MobileNav';
import { SearchOverlay } from './SearchOverlay';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const cartItemCount = useCartStore((s) => s.totalItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const cartHydrated = useCartStore((s) => s.hasHydrated);

  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const wishlistHydrated = useWishlistStore((s) => s.hasHydrated);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll effect
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchOpen(true);
      return;
    }
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-out-soft border-b ${
          isScrolled
            ? 'bg-[#FAF6F0]/95 backdrop-blur-md border-[#E8DDCF] shadow-subtle py-2.5 md:py-3'
            : 'bg-[#FAF6F0]/90 backdrop-blur-sm border-[#E8DDCF]/60 py-3.5 md:py-4'
        }`}
      >
        <div className="container-page flex items-center justify-between gap-4">
          {/* Mobile Left: Hamburger & Quick Search */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 -ml-2 text-[#422619] hover:text-gold-deep transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-[#422619] hover:text-gold-deep transition-colors"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Left: Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 font-serif uppercase tracking-[0.14em] text-xs font-medium text-[#422619]">
            {/* Shop Dropdown */}
            <div className="relative group">
              <Link
                href="/shop"
                className="flex items-center gap-1 hover:text-gold-deep transition-colors py-2"
              >
                Shop <ChevronDown className="w-3 h-3 text-[#7A5A46] group-hover:text-gold-deep transition-colors" />
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 scale-95 origin-top-left invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-lg shadow-card py-2.5 w-52 flex flex-col capitalize normal-case font-sans">
                  <Link href="/shop" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    All Products
                  </Link>
                  <Link href="/shop?category=puja-samagri" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Puja Samagri
                  </Link>
                  <Link href="/shop?category=diyas" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Diyas & Lighting
                  </Link>
                  <Link href="/shop?category=incense" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Incense & Dhoop
                  </Link>
                  <Link href="/shop?category=idols-murtis" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Idols & Murtis
                  </Link>
                </div>
              </div>
            </div>

            {/* Puja Kits Dropdown */}
            <div className="relative group">
              <Link
                href="/kits"
                className="flex items-center gap-1 hover:text-gold-deep transition-colors py-2"
              >
                Puja Kits <ChevronDown className="w-3 h-3 text-[#7A5A46] group-hover:text-gold-deep transition-colors" />
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 scale-95 origin-top-left invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-lg shadow-card py-2.5 w-56 flex flex-col capitalize normal-case font-sans">
                  <Link href="/kits" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    All Curated Kits
                  </Link>
                  <Link href="/products/griha-pravesh-kit" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Griha Pravesh Kit
                  </Link>
                  <Link href="/products/satyanarayan-puja-kit" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Satyanarayan Puja Kit
                  </Link>
                  <Link href="/products/lakshmi-puja-kit" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Lakshmi Puja Kit
                  </Link>
                  <Link href="/products/ganesh-puja-kit" className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors">
                    Ganesh Puja Kit
                  </Link>
                </div>
              </div>
            </div>

            {/* Occasions Dropdown */}
            <div className="relative group">
              <Link
                href="/occasions"
                className="flex items-center gap-1 hover:text-gold-deep transition-colors py-2"
              >
                Occasions <ChevronDown className="w-3 h-3 text-[#7A5A46] group-hover:text-gold-deep transition-colors" />
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 scale-95 origin-top-left invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-lg shadow-card py-2.5 w-52 flex flex-col capitalize normal-case font-sans">
                  {['griha-pravesh', 'satyanarayan', 'lakshmi-puja', 'ganesh-puja'].map((slug) => (
                    <Link
                      key={slug}
                      href={`/occasions/${slug}`}
                      className="px-4 py-2 text-xs text-[#3E2215] hover:bg-gold-wash hover:text-gold-deep transition-colors"
                    >
                      {slug.replace('-', ' ')}
                    </Link>
                  ))}
                  <Link href="/festivals" className="px-4 py-2 text-xs text-gold-deep font-medium border-t border-[#E8DDCF] mt-1 pt-2 hover:bg-gold-wash">
                    Explore Festivals →
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/about" className="hover:text-gold-deep transition-colors py-2">
              About
            </Link>
          </nav>

          {/* Center: Brand Identity */}
          <div className="flex flex-col items-center justify-center text-center">
            <Link href="/" className="flex flex-col items-center group" aria-label="POOJARO Home">
              {/* Sacred Lotus Bloom */}
              <div className="relative w-7 h-auto mb-0.5 drop-shadow-[0_1px_6px_rgba(183,131,50,0.3)] transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/peacock/footer-lotus-top.png"
                  alt=""
                  width={64}
                  height={60}
                  className="w-full h-auto object-contain"
                  priority
                  unoptimized
                />
              </div>

              {/* Brand Title */}
              <span className={`font-display text-[#3E2215] tracking-[0.22em] font-normal uppercase transition-all duration-300 group-hover:text-gold-deep ${
                isScrolled ? 'text-xl' : 'text-2xl md:text-[1.65rem]'
              }`}>
                POOJARO
              </span>

              {/* Subtitle */}
              <span className="font-serif italic text-[10px] md:text-[11px] text-[#7A5A46] tracking-wider leading-none mt-0.5">
                Sacred Rituals. Beautifully Prepared.
              </span>
            </Link>
          </div>

          {/* Right: Search Pill & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
            {/* Pill Search Form on Desktop */}
            <form
              onSubmit={handleSearchSubmit}
              onClick={() => setSearchOpen(true)}
              className="hidden xl:flex items-center relative w-64 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#8C6D53] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for puja items, kits, gods..."
                className="w-full bg-[#F3EBE0]/80 hover:bg-[#F3EBE0] border border-[#D9CBB9] rounded-full py-1.5 pl-9 pr-3 text-xs text-[#3E2215] placeholder:text-[#8C6D53]/70 focus:outline-none focus:border-gold-deep cursor-pointer transition-colors"
                readOnly
              />
            </form>

            {/* Quick Search Button on Medium screens */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex xl:hidden p-2 text-[#422619] hover:text-gold-deep transition-colors"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account Icon */}
            <Link
              href="/account"
              className="hidden sm:flex p-2 text-[#422619] hover:text-gold-deep transition-colors"
              aria-label="My Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="hidden sm:flex p-2 text-[#422619] hover:text-gold-deep transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistHydrated && wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-danger text-ivory text-[10px] tabular font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#FAF6F0]">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="p-2 -mr-1 text-[#422619] hover:text-gold-deep transition-colors relative group"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartHydrated && cartItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-gold-deep text-white text-[10px] tabular font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-subtle group-hover:bg-gold transition-colors border border-[#FAF6F0]">
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
