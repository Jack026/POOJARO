export const metadata = {
  title: 'POOJARO Admin',
};

/**
 * Admin shell wrapper. Admin lives outside the (site) route group, so it never
 * inherits the storefront header/footer/cart — only the bare <html>/<body> from
 * the root layout (which already carries the fonts). The per-page <AdminShell>
 * supplies the sidebar and top bar; this layout just paints the admin's own
 * white canvas over the root's ivory.
 *
 * It must NOT render <html>/<body>: doing so nests a second document inside the
 * root layout's, which is the hydration error this structure removes.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-charcoal antialiased">{children}</div>
  );
}
