import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES } from '@/config/routes';

// The backend's httpOnly session cookie. Middleware reads it server-side,
// so httpOnly is not a barrier here. Presence-only check — validity is
// confirmed downstream by AuthContext's /protected probe and apiClient's
// 401 handler.
const SESSION_COOKIE = 'token';

const PUBLIC_PATHS = new Set<string>([
  ROUTES.home,
  ROUTES.login,
  ROUTES.register,
  ROUTES.wiki,
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = ROUTES.login;
  loginUrl.search = '';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
