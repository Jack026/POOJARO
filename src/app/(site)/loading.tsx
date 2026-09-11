/** A fast, static fallback that keeps navigation feeling intentional (§44). */
export default function Loading() {
  return (
    <main id="main" className="container-page grid min-h-[50vh] place-items-center py-20" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gold-wash" aria-hidden="true">
          <span className="glow-diya absolute inset-2 rounded-full bg-gold/30" />
          <span className="relative text-2xl">🪔</span>
        </span>
        <div>
          <p className="font-display text-2xl tracking-[0.18em] text-brown">POOJARO</p>
          <p className="mt-1 text-sm text-brown-muted">Preparing your ritual essentials…</p>
        </div>
      </div>
    </main>
  );
}
