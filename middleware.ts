import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow entry portal, API routes, and static files
  if (
    pathname === '/' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/uploads/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const userCookie = request.cookies.get('demo_day_user');
  if (!userCookie?.value) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
