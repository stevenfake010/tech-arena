import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 密码保护已移除，所有路径均可访问

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 清除旧站点密码 cookie，避免遗留
  response.cookies.delete('site_auth')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}
