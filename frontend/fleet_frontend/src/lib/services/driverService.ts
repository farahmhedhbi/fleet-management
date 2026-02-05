import { api } from '@/lib/api'
import { Driver, DriverDTO } from '@/types/driver'

export const driverService = {
  async getAll(): Promise<Driver[]> {
    try {
      const response = await api.get<Driver[]>('/api/drivers')
      return response
    } catch (error: any) {
      console.error('❌ Failed to fetch drivers:', error)
      throw error
    }
  },

  async getById(id: number): Promise<Driver> {
    try {
      return await api.get<Driver>(`/api/drivers/${id}`)
    } catch (error: any) {
      console.error(`❌ Failed to fetch driver ${id}:`, error)
      throw error
    }
  },

  async create(driverData: DriverDTO): Promise<Driver> {
    console.log('📝 Creating new driver with data:', driverData)
    
    // S'assurer que le statut est bien défini
    if (!driverData.status) {
      driverData.status = 'ACTIVE'
    }
    
    // Formater la date d'expiration si elle existe
    if (driverData.licenseExpiry) {
      // S'assurer que c'est une string ISO
      if (typeof driverData.licenseExpiry !== 'string') {
        driverData.licenseExpiry = new Date(driverData.licenseExpiry).toISOString()
      }
    }
    
    try {
      const response = await api.post<Driver>('/api/drivers', driverData)
      console.log('✅ Driver created successfully:', response)
      return response
    } catch (error: any) {
      console.error('❌ Failed to create driver:', error)
      console.error('Error details:', error.data)
      throw error
    }
  },

  async update(id: number, driverData: DriverDTO): Promise<Driver> {
    try {
      return await api.put<Driver>(`/api/drivers/${id}`, driverData)
    } catch (error: any) {
      console.error(`❌ Failed to update driver ${id}:`, error)
      throw error
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/drivers/${id}`)
    } catch (error: any) {
      console.error(`❌ Failed to delete driver ${id}:`, error)
      throw error
    }
  }
}