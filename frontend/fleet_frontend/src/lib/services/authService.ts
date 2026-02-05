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
    return await api.post<AuthResponse>('/api/auth/login', {
      email: credentials.email,
      password: credentials.password
    })
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return await api.post<AuthResponse>('/api/auth/register', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      phone: userData.phone
    })
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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
    return !!this.getToken()
  },
}