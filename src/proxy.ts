import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except /admin/auth/* which handles its own auth)
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/auth")
  ) {
    // Check for session cookie
    // Better Auth uses "__Secure-" prefix on HTTPS (production)
    const sessionCookie =
      request.cookies.get("__Secure-better-auth.session_token") ||
      request.cookies.get("better-auth.session_token");

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/auth", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
