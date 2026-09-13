import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/app/lib/auth/token";

const PUBLIC_API_PREFIX = "/api/auth/";

function securityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Public auth API (login/logout) — never block.
  if (pathname.startsWith(PUBLIC_API_PREFIX)) {
    return securityHeaders(NextResponse.next());
  }

  // Protected API: signature + expiry check at the boundary.
  // Route handlers re-verify + check the DB record (user exists, not revoked).
  if (pathname.startsWith("/api/")) {
    if (!session) {
      return securityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }
    return securityHeaders(NextResponse.next());
  }

  // Login page: already logged in → go to app.
  if (pathname === "/login") {
    if (session) {
      return securityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url)),
      );
    }
    return securityHeaders(NextResponse.next());
  }

  // Every other page (/, /dashboard, /sales, ...) needs a session.
  if (!session) {
    const url = new URL("/login", request.url);
    const next = `${pathname}${search}`;
    if (next !== "/") url.searchParams.set("next", next);
    return securityHeaders(NextResponse.redirect(url));
  }
  return securityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|svg|ico|jpg|jpeg|webp)$).*)",
  ],
};
