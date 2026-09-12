'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface AnnouncementBarProps {
  announcement: {
    text: string;
    href: string;
    isActive: boolean;
  };
}

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!announcement.isActive || !isVisible) return null;

  const displayText = announcement.text || 'FREE SHIPPING ON ORDERS ABOVE ₹999';

  return (
    <div className="bg-[#F6EFE6] border-b border-[#E8DDCF] text-[#422619] relative z-50 select-none">
      <div className="container-page py-2 flex items-center justify-between text-[11px] md:text-xs">
        {/* Left / Center Announcement */}
        <div className="flex items-center justify-center flex-1 md:justify-start lg:justify-center gap-2.5 font-medium tracking-[0.14em] uppercase text-[#3E2215]">
          <span className="text-gold-deep text-xs">❖</span>
          {announcement.href ? (
            <Link href={announcement.href} className="hover:text-gold-deep transition-colors">
              {displayText}
            </Link>
          ) : (
            <span>{displayText}</span>
          )}
          <span className="text-gold-deep text-xs">❖</span>
        </div>

        {/* Right Pillars / Trust Links */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-[#7A5A46] tracking-wider font-normal">
          <span>Sacred Products</span>
          <span className="text-[#C4B2A0]">|</span>
          <span>Authentic Sources</span>
          <span className="text-[#C4B2A0]">|</span>
          <span>Trusted by Devotees</span>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setIsVisible(false)}
          className="ml-3 p-1 text-[#7A5A46] hover:text-[#422619] transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
