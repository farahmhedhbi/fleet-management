'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'

// Types d'authentification
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  role: 'DRIVER' | 'OWNER' | 'ADMIN'
}

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  token?: string
}

export interface AuthResponse {
  token: string
  type: string
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
}

// Interface du contexte d'authentification
interface AuthContextType {
  user: User | null
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message?: string }>
  register: (userData: RegisterRequest) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
}

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Props du provider
interface AuthProviderProps {
  children: ReactNode
}

// Hook personnalisé pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Service d'authentification local
const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Simulation d'un appel API
    console.log('Login attempt:', credentials)
    
    // Vérifier les comptes de test
    let role = 'ROLE_DRIVER'
    let firstName = 'Driver'
    
    if (credentials.email === 'admin@fleet.com' && credentials.password === 'admin123') {
      role = 'ROLE_ADMIN'
      firstName = 'Admin'
    } else if (credentials.email === 'owner@fleet.com' && credentials.password === 'owner123') {
      role = 'ROLE_OWNER'
      firstName = 'Owner'
    } else if (credentials.email === 'driver@fleet.com' && credentials.password === 'driver123') {
      role = 'ROLE_DRIVER'
      firstName = 'Driver'
    } else {
      throw new Error('Invalid credentials')
    }
    
    const mockResponse: AuthResponse = {
      token: `mock-jwt-token-${Date.now()}`,
      type: 'Bearer',
      id: 1,
      email: credentials.email,
      firstName: firstName,
      lastName: 'User',
      role: role
    }
    
    return mockResponse
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Simulation d'un appel API
    console.log('Register attempt:', userData)
    
    const mockResponse: AuthResponse = {
      token: `mock-jwt-token-${Date.now()}`,
      type: 'Bearer',
      id: Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role
    }
    
    return mockResponse
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    }
    return null
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }
}

// Provider d'authentification
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    setLoading(false)
  }, [])

  // Fonction de connexion
  const login = async (credentials: LoginRequest) => {
    try {
      const userData = await authService.login(credentials)
      
      // Stocker dans le localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', userData.token)
      }
      
      setUser(userData)
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Login failed. Please check your credentials.'
      }
    }
  }

  // Fonction d'inscription
  const register = async (userData: RegisterRequest) => {
    try {
      const newUser = await authService.register(userData)
      
      // Stocker dans le localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(newUser))
        localStorage.setItem('token', newUser.token)
      }
      
      setUser(newUser)
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.'
      }
    }
  }

  // Fonction de déconnexion
  const logout = () => {
    authService.logout()
    setUser(null)
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  // Valeur du contexte
  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Export du contexte
export default AuthContext