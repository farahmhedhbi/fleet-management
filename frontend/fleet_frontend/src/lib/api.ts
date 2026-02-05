// lib/api.ts
import axios, { 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosResponse, 
  AxiosHeaders,
  AxiosError
} from 'axios'

export interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers?: any
}

export interface ApiError {
  message: string
  status?: number
  data?: any
  code?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const IS_DEV = process.env.NODE_ENV === 'development'

class ApiClient {
  private client: AxiosInstance
  private tokenCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
      withCredentials: false,
    })

    this.setupInterceptors()
    
    // Vérifier périodiquement le token en dev
    if (IS_DEV && typeof window !== 'undefined') {
      this.startTokenMonitor()
    }
  }

  private setupInterceptors(): void {
    // Intercepteur de requête
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken()
        
        if (IS_DEV) {
          console.group('📡 API Request')
          console.log('URL:', `${config.baseURL}${config.url}`)
          console.log('Method:', config.method?.toUpperCase())
          console.log('Has Token:', !!token)
          console.log('Token Preview:', token ? `${token.substring(0, 20)}...` : 'None')
        }
        
        if (token) {
          // Valider le format du token
          if (!this.isValidToken(token)) {
            console.warn('⚠️ Invalid token format detected')
            if (IS_DEV) {
              console.warn('Token appears to be a mock token. Using real backend requires proper JWT.')
            }
          }
          
          try {
            const decoded = this.decodeJWT(token)
            if (IS_DEV) {
              console.log('🔍 Token Info:', {
                email: decoded.sub || decoded.email,
                role: decoded.role || decoded.authorities?.[0],
                exp: decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'No expiration',
                valid: decoded.exp ? decoded.exp * 1000 > Date.now() : true
              })
            }
          } catch (e) {
            if (IS_DEV) {
              console.warn('⚠️ Cannot decode token - may be invalid or mock')
            }
          }
          
          if (!config.headers) {
            config.headers = new AxiosHeaders()
          }
          config.headers.Authorization = `Bearer ${token}`
          if (IS_DEV) {
            console.log('✅ Added Authorization header')
          }
        } else {
          if (IS_DEV) {
            console.warn('⚠️ No token available for request')
            // Pour les routes publiques, c'est normal
            if (config.url?.includes('/auth/')) {
              console.log('🔓 Public auth route - no token needed')
            }
          }
        }
        
        if (IS_DEV) {
          console.groupEnd()
        }
        return config
      },
      (error) => {
        console.error('❌ Request setup error:', error)
        return Promise.reject(this.normalizeError(error))
      }
    )

    // Intercepteur de réponse
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (IS_DEV) {
          console.group('✅ API Response Success')
          console.log('URL:', response.config.url)
          console.log('Status:', response.status, response.statusText)
          console.log('Data:', response.data)
          console.groupEnd()
        }
        
        return response
      },
      (error: AxiosError) => {
        const requestUrl = error.config?.url || 'Unknown URL'
        const requestMethod = error.config?.method?.toUpperCase() || 'UNKNOWN'
        const status = error.response?.status
        const statusText = error.response?.statusText || ''
        
        if (IS_DEV) {
          console.group('❌ API Response Error')
          console.log('URL:', requestUrl)
          console.log('Method:', requestMethod)
          console.log('Status:', status)
          console.log('Status Text:', statusText)
          console.log('Error Message:', error.message)
        }
        
        // Gestion spécifique des erreurs
        switch (status) {
          case 400:
            if (IS_DEV) {
              console.warn('🚨 BAD REQUEST - Invalid data sent to server')
              console.log('Response data:', error.response?.data)
            }
            break
            
          case 401:
            if (IS_DEV) {
              console.warn('🔒 UNAUTHORIZED - Token invalid or expired')
            }
            this.handleUnauthorized()
            break
            
          case 403:
            if (IS_DEV) {
              console.warn('🚫 FORBIDDEN - Possible causes:')
              console.warn('1. Token missing or invalid')
              console.warn('2. Insufficient permissions')
              console.warn('   • Required: ROLE_ADMIN or ROLE_OWNER for drivers')
              console.warn('   • Your role may be: DRIVER or none')
              console.warn('3. Token expired')
              console.warn('4. Route requires authentication')
              
              // Afficher les headers pour debug
              if (error.response?.headers) {
                console.log('Response Headers:', error.response.headers)
              }
              
              // Vérifier le rôle de l'utilisateur
              const token = this.getToken()
              if (token) {
                try {
                  const decoded = this.decodeJWT(token)
                  const role = decoded.role || decoded.authorities?.[0]
                  console.log('🔍 Current user info:', {
                    email: decoded.sub || decoded.email,
                    role: role,
                    hasAdminOrOwner: role && (role.includes('ADMIN') || role.includes('OWNER'))
                  })
                } catch (e) {
                  console.warn('Cannot decode token to check role')
                }
              }
              
              // Suggestions selon la route
              if (requestUrl?.includes('/api/drivers')) {
                console.log('💡 Suggestion: Login as admin@fleet.com or owner@fleet.com')
                console.log('💡 Current test accounts:')
                console.log('   - admin@fleet.com / admin123 (ROLE_ADMIN)')
                console.log('   - owner@fleet.com / owner123 (ROLE_OWNER)')
                console.log('   - driver@fleet.com / driver123 (ROLE_DRIVER)')
              }
            }
            break
            
          case 404:
            if (IS_DEV) {
              console.warn('🔍 NOT FOUND - Resource does not exist')
              console.log('Requested URL:', requestUrl)
            }
            break
            
          case 500:
            if (IS_DEV) {
              console.error('💥 INTERNAL SERVER ERROR - Backend issue')
              console.log('Error details:', error.response?.data)
            }
            break
            
          default:
            if (!error.response) {
              if (IS_DEV) {
                console.error('🌐 NETWORK ERROR - Possible causes:')
                console.error('1. Backend server not running')
                console.error('2. CORS configuration issue')
                console.error('3. Network connectivity problem')
                console.error(`4. Wrong URL: ${API_BASE_URL}`)
              }
            }
        }
        
        if (IS_DEV) {
          console.groupEnd()
        }
        
        return Promise.reject(this.normalizeError(error))
      }
    )
  }

  private startTokenMonitor(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval)
    }
    
    this.tokenCheckInterval = setInterval(() => {
      const token = this.getToken()
      if (token) {
        try {
          const decoded = this.decodeJWT(token)
          const isExpired = decoded.exp && decoded.exp * 1000 < Date.now()
          
          if (isExpired) {
            console.warn('⏰ Token expired, clearing...')
            this.clearAuth()
            if (window.location.pathname !== '/login') {
              window.location.href = '/login?expired=true'
            }
          }
        } catch (e) {
          // Token invalide, ignorer
        }
      }
    }, 30000) // Vérifier toutes les 30 secondes
  }

  private stopTokenMonitor(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval)
      this.tokenCheckInterval = null
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  private clearAuth(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
  }

  private handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      console.log('🔒 Session expired, clearing storage...')
      this.clearAuth()
      
      // Ne rediriger que si on n'est pas déjà sur la page de login
      if (window.location.pathname !== '/login') {
        const currentPath = window.location.pathname + window.location.search
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&expired=true`
      }
    }
  }

  private isValidToken(token: string): boolean {
    // Un vrai JWT a 3 parties séparées par des points
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }
    
    // Vérifier que ce n'est pas un token mock
    if (token.startsWith('mock-') || token.includes('mock-jwt-token')) {
      return false
    }
    
    return true
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) {
        throw new Error('Invalid JWT format')
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      
      return JSON.parse(jsonPayload)
    } catch (error) {
      if (IS_DEV) {
        console.warn('JWT Decode Error:', error)
      }
      // Pour les tokens mock, retourner une structure simulée
      if (token.startsWith('mock-') || token.includes('mock-jwt-token')) {
        return {
          sub: 'mock-user@example.com',
          role: 'ROLE_ADMIN',
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      }
      throw new Error('Invalid JWT token')
    }
  }

  private normalizeError(error: any): ApiError {
    if (error.response) {
      // Erreur avec réponse du serveur
      const responseData = error.response.data
      let message = 'Server error'
      
      if (typeof responseData === 'string') {
        message = responseData
      } else if (responseData?.message) {
        message = responseData.message
      } else if (responseData?.error) {
        message = responseData.error
      } else if (error.response.statusText) {
        message = error.response.statusText
      }
      
      return {
        message: message,
        status: error.response.status,
        data: responseData,
        code: responseData?.code || error.code
      }
    } else if (error.request) {
      // Requête envoyée mais pas de réponse
      return {
        message: 'No response from server. Check your network connection.',
        status: 0,
        code: 'NETWORK_ERROR'
      }
    } else {
      // Erreur lors de la configuration de la requête
      return {
        message: error.message || 'Unknown error occurred',
        status: 0,
        code: error.code || 'UNKNOWN'
      }
    }
  }

  // Méthodes HTTP
  async get<T>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config)
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    } catch (error: any) {
      throw this.normalizeError(error)
    }
  }

  async post<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config)
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    } catch (error: any) {
      throw this.normalizeError(error)
    }
  }

  async put<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config)
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    } catch (error: any) {
      throw this.normalizeError(error)
    }
  }

  async delete<T>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config)
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    } catch (error: any) {
      throw this.normalizeError(error)
    }
  }

  async patch<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config)
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    } catch (error: any) {
      throw this.normalizeError(error)
    }
  }

  // Méthodes utilitaires
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing API connection...')
      const response = await this.get('/api/test/all')
      console.log('✅ API Connection test passed:', response.data)
      return true
    } catch (error) {
      console.error('❌ API Connection test failed:', error)
      return false
    }
  }

  async login(email: string, password: string): Promise<any> {
    try {
      const response = await this.post('/api/auth/login', { email, password })
      return response.data
    } catch (error) {
      throw this.normalizeError(error)
    }
  }

  async register(userData: any): Promise<any> {
    try {
      const response = await this.post('/api/auth/register', userData)
      return response.data
    } catch (error) {
      throw this.normalizeError(error)
    }
  }

  // Cleanup
  destroy(): void {
    this.stopTokenMonitor()
  }
}

// Instance singleton
export const api = new ApiClient()

// Export pour les tests
if (typeof window !== 'undefined') {
  (window as any).__api = api
}

// Fonctions utilitaires globales
export const testApiConnection = async (): Promise<boolean> => {
  return api.testConnection()
}

export const checkBackendHealth = async (): Promise<{
  isAlive: boolean
  message: string
  url: string
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/test/all`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache'
    })
    
    if (response.ok) {
      return {
        isAlive: true,
        message: 'Backend is running',
        url: API_BASE_URL
      }
    } else {
      return {
        isAlive: false,
        message: `Backend responded with status: ${response.status}`,
        url: API_BASE_URL
      }
    }
  } catch (error: any) {
    return {
      isAlive: false,
      message: `Cannot connect to backend: ${error.message}`,
      url: API_BASE_URL
    }
  }
}

// Fonction pour vérifier et initialiser l'authentification
export const initializeAuth = (): {
  hasToken: boolean
  tokenValid: boolean
  userInfo: any
} => {
  if (typeof window === 'undefined') {
    return { hasToken: false, tokenValid: false, userInfo: null }
  }
  
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  let userInfo = null
  let tokenValid = false
  
  try {
    if (userStr) {
      userInfo = JSON.parse(userStr)
    }
    
    if (token) {
      const decoded = api['decodeJWT'](token)
      tokenValid = !decoded.exp || decoded.exp * 1000 > Date.now()
      
      if (IS_DEV) {
        console.log('🔐 Auth Initialization:', {
          hasToken: !!token,
          tokenValid,
          userRole: userInfo?.role,
          tokenExpiry: decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'No expiry'
        })
      }
    }
  } catch (error) {
    if (IS_DEV) {
      console.warn('Auth initialization error:', error)
    }
  }
  
  return { hasToken: !!token, tokenValid, userInfo }
}

// Cleanup global
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    api.destroy()
  })
}

export default api