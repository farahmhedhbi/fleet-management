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
  role: 'ROLE_DRIVER' | 'ROLE_OWNER' | 'ROLE_ADMIN'
  licenseNumber?: string;
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

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  token?: string
}