// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLES = {
  ADMIN: "ROLE_ADMIN",
  OWNER: "ROLE_OWNER",
  DRIVER: "ROLE_DRIVER",
} as const;

function matches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function getDefaultDashboardByRole(role?: string) {
  switch (role) {
    case ROLES.ADMIN:
    case ROLES.OWNER:
    case ROLES.DRIVER:
      return "/dashboard";
    default:
      return "/login";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // ✅ Routes publiques
  const publicRoutes = [
    "/",
    "/login",
    "/forgot-password",
    "/reset-password",
  ];

  // ✅ Routes protégées
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

  // ✅ Routes par rôle
  const adminOnlyRoutes = [
    "/settings",
    "/admin/payments",
  ];

  const ownerOrAdminRoutes = [
    "/drivers",
    "/vehicles",
    "/reports",
    "/missions",
    "/owner/billing",
  ];

  const ownerOnlyRoutes = [
    "/owner",
  ];

  const driverOnlyRoutes = [
    "/my-missions",
  ];

  const sharedAuthenticatedRoutes = [
    "/dashboard",
    "/change-password",
  ];

  const isPublicRoute = matches(pathname, publicRoutes);
  const isProtectedRoute = matches(pathname, protectedRoutes);

  // ✅ Si pas connecté et essaie d’entrer dans une route protégée
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Si connecté et ouvre une route publique => rediriger selon rôle
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL(getDefaultDashboardByRole(role), request.url));
  }

  // ✅ Si connecté mais rôle absent/corrompu
  if (token && isProtectedRoute && !role) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("token");
    res.cookies.delete("role");
    return res;
  }

  // ✅ Contrôle d’accès par rôle
  if (token && isProtectedRoute) {
    // Routes partagées pour tout utilisateur authentifié
    if (matches(pathname, sharedAuthenticatedRoutes)) {
      return NextResponse.next();
    }

    // Admin only
    if (matches(pathname, adminOnlyRoutes)) {
      if (role !== ROLES.ADMIN) {
        return NextResponse.redirect(
          new URL(getDefaultDashboardByRole(role), request.url)
        );
      }
      return NextResponse.next();
    }

    // Owner ou Admin
    if (matches(pathname, ownerOrAdminRoutes)) {
      if (!(role === ROLES.OWNER || role === ROLES.ADMIN)) {
        return NextResponse.redirect(
          new URL(getDefaultDashboardByRole(role), request.url)
        );
      }
      return NextResponse.next();
    }

    // Owner only
    if (matches(pathname, ownerOnlyRoutes)) {
      if (role !== ROLES.OWNER) {
        return NextResponse.redirect(
          new URL(getDefaultDashboardByRole(role), request.url)
        );
      }
      return NextResponse.next();
    }

    // Driver only
    if (matches(pathname, driverOnlyRoutes)) {
      if (role !== ROLES.DRIVER) {
        return NextResponse.redirect(
          new URL(getDefaultDashboardByRole(role), request.url)
        );
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};