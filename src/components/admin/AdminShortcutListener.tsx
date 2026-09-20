'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast-store';

/**
 * Global Keyboard Shortcut Listener: Ctrl + Shift + S (or Cmd + Shift + S on Mac)
 *
 * Provides instant access to the POOJARO Admin Portal from any public page.
 * Checks active session:
 * - Authenticated admin -> redirects to /admin
 * - Unauthenticated -> redirects to /admin/login
 */
export function AdminShortcutListener() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Check for Ctrl + Shift + S or Cmd + Shift + S
      const isModifier = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isS = e.key === 'S' || e.key === 's' || e.code === 'KeyS';

      if (isModifier && isShift && isS) {
        e.preventDefault();
        e.stopPropagation();

        toast.info('Admin shortcut triggered', {
          description: 'Opening POOJARO Admin Portal…',
        });

        // Verify active admin session
        fetch('/api/admin/auth/me')
          .then((res) => {
            if (res.ok) {
              router.push('/admin');
            } else {
              router.push('/admin/login');
            }
          })
          .catch(() => {
            router.push('/admin/login');
          });
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [router]);

  return null;
}
