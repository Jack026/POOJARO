'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';

interface AnnouncementBarProps {
  announcement: {
    text: string;
    href: string;
    isActive: boolean;
  };
}

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!announcement.isActive || !isVisible || !announcement.text) return null;

  const content = (
    <div className="flex items-center justify-center gap-2 text-[11px] md:text-xs font-medium tracking-wide">
      <Sparkles className="w-3.5 h-3.5 text-gold-soft" />
      <span>{announcement.text}</span>
    </div>
  );

  return (
    <div className="bg-brown text-ivory relative z-50">
      <div className="container-page py-2 md:py-2.5 flex items-center justify-center relative">
        {announcement.href ? (
          <Link href={announcement.href} className="hover:text-gold-soft transition-colors">
            {content}
          </Link>
        ) : (
          content
        )}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-ivory/60 hover:text-ivory transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
