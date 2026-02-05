'use client'

import React, { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/authContext'


interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'ROLE_ADMIN' | 'ROLE_OWNER' | 'ROLE_DRIVER'
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login'
}) => {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo)
    }
    
    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      router.push('/dashboard')
    }
  }, [loading, isAuthenticated, requiredRole, user?.role, router, redirectTo])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}