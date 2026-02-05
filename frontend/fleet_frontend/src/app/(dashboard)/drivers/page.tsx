'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search,
  Filter,
  Download,
  Users,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHeadCell, 
  TableCell 
} from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toastError } from '@/components/ui/Toast'
import { driverService } from '@/lib/services/driverService'
import { Driver, DriverStatus } from '@/types/driver'
import { formatDate } from '@/lib/utils/helpers'

export default function DriversPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'ALL'>('ALL')

  useEffect(() => {
    loadDrivers()
  }, [])

  useEffect(() => {
    filterDrivers()
  }, [drivers, searchTerm, statusFilter])

  const loadDrivers = async () => {
    try {
      const data = await driverService.getAll()
      setDrivers(data)
    } catch (error) {
      toastError('Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }

  const filterDrivers = () => {
    let filtered = drivers

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(driver =>
        driver.firstName.toLowerCase().includes(term) ||
        driver.lastName.toLowerCase().includes(term) ||
        driver.email.toLowerCase().includes(term) ||
        driver.licenseNumber.toLowerCase().includes(term) ||
        driver.phone?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(driver => driver.status === statusFilter)
    }

    setFilteredDrivers(filtered)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      await driverService.delete(id)
      await loadDrivers()
    } catch (error) {
      toastError('Failed to delete driver')
    }
  }

  const handleExport = () => {
    // Implement export functionality
    toastError('Export feature coming soon')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-2">Manage your fleet drivers and their information</p>
        </div>
        <Button
          onClick={() => router.push('/drivers/create')}
          icon={Plus}
        >
          Add Driver
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search drivers by name, email, license..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter size={20} className="text-gray-400 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as DriverStatus | 'ALL')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              
              <Button
                variant="outline"
                onClick={handleExport}
                icon={Download}
              >
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Table */}
        <CardBody>
          {filteredDrivers.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : 'Get started by adding your first driver.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHeadCell>Driver</TableHeadCell>
                <TableHeadCell>Contact</TableHeadCell>
                <TableHeadCell>License</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell align="right">Actions</TableHeadCell>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow 
                    key={driver.id}
                    onClick={() => router.push(`/drivers/edit/${driver.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-blue-600">
                            {driver.firstName[0]}{driver.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {driver.firstName} {driver.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {driver.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900">{driver.email}</div>
                      <div className="text-sm text-gray-500">
                        {driver.phone || 'No phone'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {driver.licenseNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {driver.licenseExpiry 
                          ? `Expires: ${formatDate(driver.licenseExpiry)}`
                          : 'No expiry date'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusBadge 
                          type="driver" 
                          status={driver.status} 
                        />
                        <div className="text-sm text-gray-500">
                          Eco Score: {(driver.ecoScore || 0).toFixed(1)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/drivers/edit/${driver.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(driver.id, `${driver.firstName} ${driver.lastName}`)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                Showing <span className="font-medium">{filteredDrivers.length}</span> of{' '}
                <span className="font-medium">{drivers.length}</span> drivers
              </div>
              {filteredDrivers.length < drivers.length && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle size={16} className="mr-1" />
                  <span>Filtered results</span>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}