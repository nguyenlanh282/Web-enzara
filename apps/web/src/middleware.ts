import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the admin login page without authentication
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check for auth indicator cookie (UI guard only; API validates JWT separately)
  const authCookie = request.cookies.get("enzara-auth");

  if (!authCookie || authCookie.value !== "1") {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
