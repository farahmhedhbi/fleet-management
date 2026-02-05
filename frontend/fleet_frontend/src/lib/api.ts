// lib/api.ts
import axios, { 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios'

export interface ApiError {
  message: string
  status?: number
  data?: any
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Intercepteur de requête
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken()
        
        if (token) {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
        }
        
        return config
      },
      (error) => {
        return Promise.reject(this.normalizeError(error))
      }
    )

    // Intercepteur de réponse
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error: AxiosError) => {
        const status = error.response?.status
        
        if (status === 401 || status === 403) {
          this.handleUnauthorized()
        }
        
        return Promise.reject(this.normalizeError(error))
      }
    )
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  private handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true'
      }
    }
  }

  private normalizeError(error: any): ApiError {
    if (error.response) {
      const responseData = error.response.data
      let message = 'Server error'
      
      if (typeof responseData === 'string') {
        message = responseData
      } else if (responseData?.message) {
        message = responseData.message
      } else if (responseData?.error) {
        message = responseData.error
      }
      
      return {
        message: message,
        status: error.response.status,
        data: responseData,
      }
    } else if (error.request) {
      return {
        message: 'No response from server. Check your network connection.',
        status: 0,
      }
    } else {
      return {
        message: error.message || 'Unknown error occurred',
        status: 0,
      }
    }
  }

  // Méthodes HTTP
  async get<T>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: InternalAxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }
}

export const api = new ApiClient()