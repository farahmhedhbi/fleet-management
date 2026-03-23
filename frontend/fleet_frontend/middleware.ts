// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLES = {
  ADMIN: "ROLE_ADMIN",
  OWNER: "ROLE_OWNER",
  DRIVER: "ROLE_DRIVER",
} as const;

function matches(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
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

  // Routes publiques
  const publicRoutes = [
    "/",
    "/login",
    "/forgot-password",
    "/reset-password",
  ];

  // Routes protégées
  const protectedRoutes = [
    "/dashboard",
    "/drivers",
    "/vehicles",
    "/reports",
    "/settings",
    "/missions",
    "/my-missions",
    "/my-profile",
    "/owner",
    "/change-password",
    "/owner/billing",

    // admin
    "/admin/owners",
    "/admin/users",
    "/admin/subscriptions",
    "/admin/payments",

    // communes
    "/schedule",
    "/documents",
  ];

  // Routes admin seulement
  const adminOnlyRoutes = [
    "/settings",
    "/admin/owners",
    "/admin/users",
    "/admin/subscriptions",
    "/admin/payments",
  ];

  // Owner ou admin
  const ownerOrAdminRoutes = [
    "/drivers",
    "/vehicles",
    "/reports",
    "/missions",
    "/owner/billing",
  ];

  // Owner seulement
  const ownerOnlyRoutes = [
    "/owner",
  ];

  // Driver seulement
  const driverOnlyRoutes = [
    "/my-missions",
    "/my-profile",
  ];

  // Routes partagées authentifiées
  const sharedAuthenticatedRoutes = [
    "/dashboard",
    "/change-password",
    "/schedule",
    "/documents",
  ];

  const isPublicRoute = matches(pathname, publicRoutes);
  const isProtectedRoute = matches(pathname, protectedRoutes);

  // Non connecté + route protégée
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Connecté + route publique
  if (token && isPublicRoute) {
    return NextResponse.redirect(
      new URL(getDefaultDashboardByRole(role), request.url)
    );
  }

  // Token présent mais rôle absent
  if (token && isProtectedRoute && !role) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("token");
    res.cookies.delete("role");
    return res;
  }

  // Contrôle d’accès
  if (token && isProtectedRoute) {
    if (matches(pathname, sharedAuthenticatedRoutes)) {
      return NextResponse.next();
    }

    if (matches(pathname, adminOnlyRoutes)) {
      if (role !== ROLES.ADMIN) {
        return NextResponse.redirect(
          new URL(getDefaultDashboardByRole(role), request.url)
        );
      }
      return NextResponse.next();
    }

    if (matches(pathname, ownerOrAdminRoutes)) {
      if (!(role === ROLES.OWNER || role === ROLES.ADMIN)) {
        return NextResponse.redirect(
          new URL(getDefaultDashboardByRole(role), request.url)
        );
      }
      return NextResponse.next();
    }

    if (matches(pathname, ownerOnlyRoutes)) {
      if (role !== ROLES.OWNER) {
        return NextResponse.redirect(
          new URL(getDefaultDashboardByRole(role), request.url)
        );
      }
      return NextResponse.next();
    }

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