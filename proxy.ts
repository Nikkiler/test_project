import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/session";

const PUBLIC = new Set(["/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals and the login page
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC.has(pathname)
  ) {
    return NextResponse.next();
  }

  // Auth API routes handle their own responses
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Verify session cookie
  const token = request.cookies.get("session")?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    // API calls get 401; page requests get redirected to login
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /admin is restricted to admins
  if (pathname.startsWith("/admin") && !session.isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|svg)$).*)"],
};
