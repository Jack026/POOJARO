import { fontVariables } from '@/lib/fonts';
import '../globals.css';

export const metadata = {
  title: 'POOJARO Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
