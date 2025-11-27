import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'session_token';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');

export async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;
  const protectedPaths = ['/gallery', '/request', '/admin'];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = new URL('/login', origin);
    url.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(url);
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    const isAdmin = Boolean(payload.isAdmin);
    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/gallery', origin));
    }
    return NextResponse.next();
  } catch {
    const url = new URL('/login', origin);
    url.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/gallery/:path*', '/request/:path*', '/admin/:path*', '/my/:path*']
};


