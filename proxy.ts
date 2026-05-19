import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve the ssbs-admin token
  const token = request.cookies.get("ssbs-admin")?.value;

  // If the user is trying to access a protected route (everything except /login) and is not logged in,
  // redirect them to the /login page.
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the user is logged in and trying to access /login, redirect them to the home page (dashboard).
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Match all routes except standard Next.js assets and API endpoints
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.png (site logo/icon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};