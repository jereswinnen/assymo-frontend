import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except login page)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
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
