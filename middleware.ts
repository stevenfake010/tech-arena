import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要密码保护的路径
const PUBLIC_PATHS = ['/password', '/api/auth/verify-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否是公开路径
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 检查是否已验证（通过 cookie）
  const isAuthenticated = request.cookies.get('site_auth')?.value === 'true'

  if (!isAuthenticated) {
    // 未验证，重定向到密码页
    return NextResponse.redirect(new URL('/password', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}
