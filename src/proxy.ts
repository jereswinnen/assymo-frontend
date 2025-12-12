import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth pages that don't require a session
const publicAdminPaths = ["/admin/login", "/admin/reset-password"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except public auth pages)
  if (
    pathname.startsWith("/admin") &&
    !publicAdminPaths.includes(pathname)
  ) {
    // Check for session cookie (Better Auth uses "better-auth.session_token")
    const sessionCookie = request.cookies.get("better-auth.session_token");

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
