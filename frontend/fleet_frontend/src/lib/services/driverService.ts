import { api } from '@/lib/api'
import { Driver, DriverDTO } from '@/types/driver'

export const driverService = {
  async getAll(): Promise<Driver[]> {
    console.log('📞 Fetching drivers from API...')
    try {
      // IMPORTANT: Utilisez '/api/drivers' car baseURL est http://localhost:8080
      const response = await api.get<Driver[]>('/api/drivers')
      console.log(`✅ Successfully fetched ${response.data?.length || 0} drivers`)
      return response.data
    } catch (error: any) {
      console.error('❌ Failed to fetch drivers:', error)
      
      // Log détaillé de l'erreur
      if (error.status === 403) {
        console.error('Access forbidden. Possible reasons:')
        console.error('1. User does not have ADMIN or OWNER role')
        console.error('2. Token is invalid or expired')
        console.error('3. CORS configuration issue')
        
        // Vérifier le token actuel
        const token = localStorage.getItem('token')
        if (token) {
          try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            )
            const decoded = JSON.parse(jsonPayload)
            console.log('Current user role from token:', decoded.role)
          } catch (e) {
            console.error('Cannot decode token')
          }
        }
      }
      
      throw error
    }
  },

  async getById(id: number): Promise<Driver> {
    try {
      const response = await api.get<Driver>(`/api/drivers/${id}`)
      return response.data
    } catch (error: any) {
      console.error(`❌ Failed to fetch driver ${id}:`, error)
      throw error
    }
  },

  async create(driverData: DriverDTO): Promise<Driver> {
    console.log('📝 Creating new driver:', driverData)
    try {
      const response = await api.post<Driver>('/api/drivers', driverData)
      console.log('✅ Driver created successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Failed to create driver:', error)
      throw error
    }
  },

  async update(id: number, driverData: DriverDTO): Promise<Driver> {
    try {
      const response = await api.put<Driver>(`/api/drivers/${id}`, driverData)
      return response.data
    } catch (error: any) {
      console.error(`❌ Failed to update driver ${id}:`, error)
      throw error
    }
  },

  async delete(id: number): Promise<void> {
    console.log(`🗑️ Deleting driver with id: ${id}`)
    try {
      await api.delete(`/api/drivers/${id}`)
      console.log('✅ Driver deleted successfully')
    } catch (error: any) {
      console.error(`❌ Failed to delete driver ${id}:`, error)
      throw error
    }
  },

  // Méthode utilitaire pour tester l'accès
  async testAccess(): Promise<{ hasAccess: boolean; message: string }> {
    try {
      await this.getAll()
      return { hasAccess: true, message: 'Access granted' }
    } catch (error: any) {
      if (error.status === 403) {
        return { 
          hasAccess: false, 
          message: 'Access forbidden. You need ADMIN or OWNER role.' 
        }
      }
      return { 
        hasAccess: false, 
        message: `Error: ${error.message || 'Unknown error'}` 
      }
    }
  }
}