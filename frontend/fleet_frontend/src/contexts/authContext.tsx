'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { authService, LoginRequest, RegisterRequest, AuthResponse } from '@/lib/services/authService'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message?: string }>
  register: (userData: RegisterRequest) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const authResponse = await authService.login(credentials)
      
      const userData: User = {
        id: authResponse.id,
        firstName: authResponse.firstName,
        lastName: authResponse.lastName,
        email: authResponse.email,
        role: authResponse.role
      }
      
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', authResponse.token)
      
      setUser(userData)
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Invalid credentials' 
      }
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      const authResponse = await authService.register(userData)
      
      const newUser: User = {
        id: authResponse.id,
        firstName: authResponse.firstName,
        lastName: authResponse.lastName,
        email: authResponse.email,
        role: authResponse.role
      }
      
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('token', authResponse.token)
      
      setUser(newUser)
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}