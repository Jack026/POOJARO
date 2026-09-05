'use client';

/**
 * Media query hook.
 *
 * `useSyncExternalStore` rather than `useState` + effect: React reads the
 * current match during render on the client and the SSR snapshot on the server,
 * so there is no flash of the wrong layout and no hydration mismatch warning.
 *
 * The server snapshot is always `false`. Anything that must be correct in the
 * initial HTML belongs in a CSS media query, not here — this hook is for
 * behaviour (which animation, which interaction model), not for layout.
 */
import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True from the `sm` breakpoint up — where dialogs stop being bottom sheets. */
export function useIsDesktopDialog(): boolean {
  return useMediaQuery('(min-width: 640px)');
}

/** True for devices with a precise pointer that can hover. Gates the cursor and magnetics. */
export function useHasFinePointer(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}
