'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Menu, X, Bell, User, LogOut } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/authContext'

interface NavbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 lg:pl-64">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <span className="sr-only">Open sidebar</span>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center ml-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="ml-3 text-xl font-semibold hidden sm:block">
                Fleet Management
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <button className="p-2 text-gray-500 rounded-lg hover:bg-gray-100">
              <Bell size={20} />
            </button>

            <div className="relative ml-3">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 text-sm rounded-lg focus:ring-4 focus:ring-gray-300"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role?.replace('ROLE_', '')}
                  </div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role?.replace('ROLE_', '')}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}