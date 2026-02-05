// services/vehicleService.ts
import { api } from '@/lib/api'
import { Vehicle, VehicleDTO } from '@/types/vehicle'

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    console.log('📞 Fetching vehicles from API...')
    try {
      const response = await api.get<Vehicle[]>('/api/vehicles')
      console.log(`✅ Successfully fetched ${response.length || 0} vehicles`)
      return response
    } catch (error: any) {
      console.error('❌ Failed to fetch vehicles:', error)
      throw error
    }
  },

  async getById(id: number): Promise<Vehicle> {
    try {
      return await api.get<Vehicle>(`/api/vehicles/${id}`)
    } catch (error: any) {
      console.error(`❌ Failed to fetch vehicle ${id}:`, error)
      throw error
    }
  },

  async create(vehicleData: VehicleDTO): Promise<Vehicle> {
    console.log('📝 Creating new vehicle with raw data:', vehicleData)
    
    // Préparer les données pour l'envoi
    const formattedData = this.formatVehicleData(vehicleData)
    console.log('📤 Sending formatted data:', formattedData)
    
    try {
      const response = await api.post<Vehicle>('/api/vehicles', formattedData)
      console.log('✅ Vehicle created successfully:', response)
      return response
    } catch (error: any) {
      console.error('❌ Failed to create vehicle:', error)
      console.error('Error details:', error.data)
      throw error
    }
  },

  async update(id: number, vehicleData: VehicleDTO): Promise<Vehicle> {
    console.log('📝 Updating vehicle with raw data:', vehicleData)
    
    // Préparer les données pour l'envoi
    const formattedData = this.formatVehicleData(vehicleData)
    console.log('📤 Sending formatted data:', formattedData)
    
    try {
      return await api.put<Vehicle>(`/api/vehicles/${id}`, formattedData)
    } catch (error: any) {
      console.error(`❌ Failed to update vehicle ${id}:`, error)
      console.error('Error details:', error.data)
      throw error
    }
  },

  async delete(id: number): Promise<void> {
    console.log(`🗑️ Deleting vehicle with id: ${id}`)
    try {
      await api.delete(`/api/vehicles/${id}`)
      console.log('✅ Vehicle deleted successfully')
    } catch (error: any) {
      console.error(`❌ Failed to delete vehicle ${id}:`, error)
      throw error
    }
  },

  async assignDriver(vehicleId: number, driverId: number): Promise<Vehicle> {
    console.log(`🔗 Assigning driver ${driverId} to vehicle ${vehicleId}`)
    try {
      return await api.post<Vehicle>(
        `/api/vehicles/${vehicleId}/assign-driver/${driverId}`
      )
    } catch (error: any) {
      console.error(`❌ Failed to assign driver to vehicle:`, error)
      throw error
    }
  },

  async removeDriver(vehicleId: number): Promise<Vehicle> {
    console.log(`🔗 Removing driver from vehicle ${vehicleId}`)
    try {
      return await api.post<Vehicle>(
        `/api/vehicles/${vehicleId}/remove-driver`
      )
    } catch (error: any) {
      console.error(`❌ Failed to remove driver from vehicle:`, error)
      throw error
    }
  },

  async getByDriverId(driverId: number): Promise<Vehicle[]> {
    try {
      return await api.get<Vehicle[]>(`/api/vehicles/by-driver/${driverId}`)
    } catch (error: any) {
      console.error(`❌ Failed to fetch vehicles for driver ${driverId}:`, error)
      throw error
    }
  },

  // Formatte les données du véhicule pour l'API
   formatVehicleData(vehicleData: VehicleDTO): any {
    const formattedData: any = {
      ...vehicleData,
      // S'assurer que l'année est un nombre
      year: Number(vehicleData.year),
      // S'assurer que le kilométrage est un nombre
      mileage: vehicleData.mileage ? Number(vehicleData.mileage) : 0.0,
      // S'assurer que le statut est défini
      status: vehicleData.status || 'AVAILABLE'
    }

    // Formater les dates pour qu'elles soient compatibles avec Java LocalDateTime
    if (vehicleData.lastMaintenanceDate) {
      // Convertir "2026-02-20" en "2026-02-20T00:00:00"
      formattedData.lastMaintenanceDate = this.formatDateForBackend(vehicleData.lastMaintenanceDate)
    }

    if (vehicleData.nextMaintenanceDate) {
      formattedData.nextMaintenanceDate = this.formatDateForBackend(vehicleData.nextMaintenanceDate)
    }

    // Supprimer les champs undefined
    Object.keys(formattedData).forEach(key => {
      if (formattedData[key] === undefined) {
        delete formattedData[key]
      }
    })

    return formattedData
  },

  // Convertir une date en format compatible avec Java LocalDateTime
   formatDateForBackend(dateString: string): string {
    if (!dateString) return ''
    
    // Si la date est déjà au format ISO, la retourner telle quelle
    if (dateString.includes('T')) {
      return dateString
    }
    
    // Sinon, ajouter "T00:00:00" pour créer un format ISO complet
    return `${dateString}T00:00:00`
  },

  // Méthodes utilitaires
  async getAvailableVehicles(): Promise<Vehicle[]> {
    try {
      const allVehicles = await this.getAll()
      return allVehicles.filter(vehicle => 
        vehicle.status === 'AVAILABLE'
      )
    } catch (error) {
      console.error('❌ Failed to fetch available vehicles:', error)
      throw error
    }
  },

  async getVehiclesNeedingMaintenance(): Promise<Vehicle[]> {
    try {
      const allVehicles = await this.getAll()
      const today = new Date()
      
      return allVehicles.filter(vehicle => {
        if (!vehicle.nextMaintenanceDate) return false
        
        const maintenanceDate = new Date(vehicle.nextMaintenanceDate)
        const diffTime = maintenanceDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        // Véhicules nécessitant une maintenance dans les 7 prochains jours
        return diffDays <= 7 && diffDays >= 0
      })
    } catch (error) {
      console.error('❌ Failed to fetch vehicles needing maintenance:', error)
      throw error
    }
  }
}