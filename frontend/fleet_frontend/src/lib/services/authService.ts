// services/authService.ts
import { api } from '@/lib/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'ADMIN' | 'OWNER' | 'DRIVER'
  phone?: string
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

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Login attempt with:', { email: credentials.email })
      
      const response = await api.post<AuthResponse>('/api/auth/login', {
        email: credentials.email,
        password: credentials.password
      })
      
      console.log('✅ Login successful, token received:', response.data.token?.substring(0, 20) + '...')
      
      // Stocker le token et les infos utilisateur
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          role: response.data.role
        }))
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      
      // Messages d'erreur spécifiques
      if (error.status === 401 || error.status === 403) {
        throw new Error('Invalid email or password')
      } else if (error.status === 0) {
        throw new Error('Cannot connect to server. Please check your connection.')
      }
      
      throw new Error(error.message || 'Login failed')
    }
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('📝 Register attempt with:', { email: userData.email, role: userData.role })
      
      const response = await api.post<AuthResponse>('/api/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phone: userData.phone
      })
      
      console.log('✅ Registration successful')
      
      // Auto-login après inscription
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          role: response.data.role
        }))
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ Registration failed:', error)
      
      if (error.status === 400) {
        throw new Error(error.data?.message || 'Invalid registration data')
      } else if (error.message?.includes('already in use')) {
        throw new Error('Email already in use')
      }
      
      throw new Error(error.message || 'Registration failed')
    }
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      console.log('👋 User logged out')
    }
  },

  getCurrentUser(): any | null {
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
  },

  isAuthenticated(): boolean {
    const token = this.getToken()
    return !!token && token.length > 0 && !token.startsWith('mock-')
  },

  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    if (!user || !user.role) return false
    
    // Normaliser les noms de rôles
    const userRole = user.role.toUpperCase()
    const targetRole = role.toUpperCase()
    
    return userRole === targetRole || 
           userRole === `ROLE_${targetRole}` ||
           userRole.replace('ROLE_', '') === targetRole
  },

  // Vérifier l'accès aux endpoints
  canAccess(requiredRole: 'ADMIN' | 'OWNER' | 'DRIVER'): boolean {
    const user = this.getCurrentUser()
    if (!user || !user.role) return false
    
    // Logique de hiérarchie des rôles
    const userRole = user.role.toUpperCase()
    
    if (requiredRole === 'DRIVER') {
      return ['ROLE_DRIVER', 'ROLE_OWNER', 'ROLE_ADMIN'].includes(userRole)
    } else if (requiredRole === 'OWNER') {
      return ['ROLE_OWNER', 'ROLE_ADMIN'].includes(userRole)
    } else if (requiredRole === 'ADMIN') {
      return userRole === 'ROLE_ADMIN'
    }
    
    return false
  }
}