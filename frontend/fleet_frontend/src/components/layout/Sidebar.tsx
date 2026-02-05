'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { 
  Home, 
  Users, 
  Car, 
  Settings, 
  BarChart3,
  Calendar,
  FileText,
  LucideIcon
} from 'lucide-react'
import { useAuth } from '@/contexts/authContext'


interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  accessible: boolean
}

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.role === 'ROLE_ADMIN'
  const isOwner = user?.role === 'ROLE_OWNER'
  const isDriver = user?.role === 'ROLE_DRIVER'

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, accessible: true },
    { 
      name: 'Drivers', 
      href: '/drivers', 
      icon: Users, 
      accessible: isAdmin || isOwner 
    },
    { 
      name: 'Vehicles', 
      href: '/vehicles', 
      icon: Car, 
      accessible: isAdmin || isOwner 
    },
    { name: 'Reports', href: '/reports', icon: BarChart3, accessible: isAdmin || isOwner },
    { name: 'Schedule', href: '/schedule', icon: Calendar, accessible: true },
    { name: 'Documents', href: '/documents', icon: FileText, accessible: true },
    { name: 'Settings', href: '/settings', icon: Settings, accessible: isAdmin },
  ]

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-16 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 lg:translate-x-0`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <div className="pt-4">
            <div className="px-4 mb-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main Navigation
              </div>
            </div>
            
            <ul className="space-y-2">
              {navigation
                .filter(item => item.accessible)
                .map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center p-3 text-base font-medium rounded-lg ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon size={20} className="mr-3" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
            </ul>

            <div className="px-4 mt-8 mb-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Your Role
              </div>
            </div>
            
            <div className="px-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {user?.role?.replace('ROLE_', '')}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}