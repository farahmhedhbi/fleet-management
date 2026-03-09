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

  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  const protectedRoutes = [
    "/dashboard",
    "/drivers",
    "/vehicles",
    "/reports",
    "/settings",
    "/missions",
    "/my-missions",
    "/owner",
    "/change-password",
    "/owner/billing",
    "/admin/payments",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  const adminOnlyRoutes = ["/settings" ,  "/admin/payments"];
  const ownerOrAdminRoutes = ["/drivers", "/vehicles", "/reports", "/missions"];
  const ownerOnlyRoutes = ["/owner"];

  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (token && isProtectedRoute) {
    if (!role) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("token");
      res.cookies.delete("role");
      return res;
    }

    if (adminOnlyRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      if (role !== ROLES.ADMIN) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (ownerOrAdminRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      if (!(role === ROLES.ADMIN || role === ROLES.OWNER)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (ownerOnlyRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
      if (role !== ROLES.OWNER) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};