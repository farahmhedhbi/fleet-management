import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROLES } from '@/lib/utils/constants'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Public routes that don't require authentication
  const publicRoutes = [
  "/login",
  "/register",
  "/",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Protected routes
  const protectedRoutes = ['/dashboard', '/drivers', '/vehicles', '/reports', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Check if route requires specific role
  const adminRoutes = ['/drivers', '/vehicles', '/settings']
  const ownerRoutes = ['/drivers', '/vehicles', '/reports']
  
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isOwnerRoute = ownerRoutes.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login/register, redirect to dashboard
  if (token && isPublicRoute && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check role-based access for authenticated users
  if (token && isProtectedRoute) {
    try {
      // In a real app, you would decode the JWT to get user info
      // For now, we'll check a cookie or header
      const userRole = request.cookies.get('role')?.value
      
      if (isAdminRoute && userRole !== ROLES.ADMIN) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      if (isOwnerRoute && !(userRole === ROLES.ADMIN || userRole === ROLES.OWNER)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      // If token is invalid, clear cookies and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      response.cookies.delete('role')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}