// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLES = {
  ADMIN: "ROLE_ADMIN",
  OWNER: "ROLE_OWNER",
  DRIVER: "ROLE_DRIVER",
} as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // ✅ Public routes
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // ✅ Protected (tu peux ajouter/enlever selon ton app)
  const protectedRoutes = ["/dashboard", "/drivers", "/vehicles", "/reports", "/settings"];
  const isProtectedRoute = protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // ✅ Admin-only
  const adminOnlyRoutes = ["/settings"]; // + "/admin" si tu as

  // ✅ Owner OR Admin
  const ownerOrAdminRoutes = ["/drivers", "/vehicles", "/reports"];

  // Redirect unauthenticated users
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/register => dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role checks
  if (token && isProtectedRoute) {
    // token existe mais role manquant -> force re-login
    if (!role) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("token");
      res.cookies.delete("role");
      return res;
    }

    if (adminOnlyRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      if (role !== ROLES.ADMIN) return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (ownerOrAdminRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      if (!(role === ROLES.ADMIN || role === ROLES.OWNER)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Exemple : driver-only page
    // if (pathname.startsWith("/driver-area") && role !== ROLES.DRIVER) {
    //   return NextResponse.redirect(new URL("/dashboard", request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};