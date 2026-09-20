import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// In-memory rate limiting map for brute-force protection
// Map<IP, { count: number; resetAt: number }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Clean up old rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  // 1. Brute-Force & Credential Stuffing Protection on Auth Routes
  if (pathname.startsWith('/api/admin/auth/login')) {
    // 5 attempts per 60 seconds for admin
    if (!checkRateLimit(`admin-login:${ip}`, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many admin login attempts. Please wait 1 minute before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  } else if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    // 10 attempts per 60 seconds for customer auth
    if (!checkRateLimit(`customer-auth:${ip}`, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please wait 1 minute before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Supabase Session Refresh (if configured)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      // Refreshes the auth token if needed
      await supabase.auth.getUser();
    } catch {
      // Session refresh errors should not crash the request pipeline
    }
  }

  // 3. Enterprise Zero-Trust HTTP Security Headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset folders (images, peacock, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|peacock/).*)',
  ],
};
