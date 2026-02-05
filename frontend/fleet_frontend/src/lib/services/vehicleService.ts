import { api } from '@/lib/api'
import { Vehicle, VehicleDTO } from '@/types/vehicle'

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const response = await api.get<Vehicle[]>('/vehicles')
    return response.data
  },

  async getById(id: number): Promise<Vehicle> {
    const response = await api.get<Vehicle>(`/vehicles/${id}`)
    return response.data
  },

  async create(vehicleData: VehicleDTO): Promise<Vehicle> {
    const response = await api.post<Vehicle>('/vehicles', vehicleData)
    return response.data
  },

  async update(id: number, vehicleData: VehicleDTO): Promise<Vehicle> {
    const response = await api.put<Vehicle>(`/vehicles/${id}`, vehicleData)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}`)
  },

  async assignDriver(vehicleId: number, driverId: number): Promise<Vehicle> {
    const response = await api.post<Vehicle>(
      `/vehicles/${vehicleId}/assign-driver/${driverId}`
    )
    return response.data
  },

  async removeDriver(vehicleId: number): Promise<Vehicle> {
    const response = await api.post<Vehicle>(
      `/vehicles/${vehicleId}/remove-driver`
    )
    return response.data
  },

  async getByDriverId(driverId: number): Promise<Vehicle[]> {
    const response = await api.get<Vehicle[]>(`/vehicles/by-driver/${driverId}`)
    return response.data
  },
}