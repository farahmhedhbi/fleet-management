'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/authContext'
import { useRouter } from 'next/navigation'
import DriverForm from '@/components/forms/DriverForm'

export default function CreateDriverPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Vérifier les permissions
    if (user?.role !== 'ROLE_ADMIN' && user?.role !== 'ROLE_OWNER') {
      router.push('/dashboard')
      return
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="container mx-auto px-4 py-8">
      <DriverForm />
    </div>
  )
}