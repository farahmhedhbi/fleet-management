// app/vehicles/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/authContext'
import { vehicleService } from '@/lib/services/vehicleService'
import { Vehicle } from '@/types/vehicle'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Car, Edit, Trash2, Users } from 'lucide-react'
import { getVehicleStatusColor, getFuelTypeColor } from '@/types/vehicle'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchVehicles()
  }, [isAuthenticated, router])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const data = await vehicleService.getAll()
      setVehicles(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleService.delete(id)
        fetchVehicles()
      } catch (err) {
        alert('Failed to delete vehicle')
      }
    }
  }

  const handleAssignDriver = async (vehicleId: number) => {
    const driverId = prompt('Enter driver ID:')
    if (driverId && !isNaN(parseInt(driverId))) {
      try {
        await vehicleService.assignDriver(vehicleId, parseInt(driverId))
        fetchVehicles()
        alert('Driver assigned successfully!')
      } catch (err) {
        alert('Failed to assign driver')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-2">Manage your fleet vehicles</p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/vehicles/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add Vehicle
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No vehicles</h3>
            <p className="mt-1 text-gray-500">Get started by adding your first vehicle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Car className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {vehicle.year} • {vehicle.color || 'N/A'}
                      </div>
                      {vehicle.fuelType && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getFuelTypeColor(vehicle.fuelType)}`}>
                          {vehicle.fuelType}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.driverName ? (
                        <div>
                          <div className="text-sm text-gray-900">{vehicle.driverName}</div>
                          <div className="text-sm text-gray-500">{vehicle.driverEmail}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No driver assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getVehicleStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-3">
                        {/* SECTION MODIFIÉE - Ligne ~150 */}
                        <button
                          onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)} // AJOUTER /edit/
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        {!vehicle.driverId && (
                          <button
                            onClick={() => handleAssignDriver(vehicle.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Assign Driver"
                          >
                            <Users size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="text-2xl font-bold text-gray-900">{vehicles.length}</div>
          <div className="text-sm text-gray-600">Total Vehicles</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="text-2xl font-bold text-green-600">
            {vehicles.filter(v => v.status === 'AVAILABLE').length}
          </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {vehicles.filter(v => v.status === 'IN_USE').length}
          </div>
          <div className="text-sm text-gray-600">In Use</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="text-2xl font-bold text-yellow-600">
            {vehicles.filter(v => v.status === 'UNDER_MAINTENANCE').length}
          </div>
          <div className="text-sm text-gray-600">Maintenance</div>
        </div>
      </div>
    </div>
  )
}