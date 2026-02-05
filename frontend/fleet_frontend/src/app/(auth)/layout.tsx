import { ReactNode } from 'react'
import Link from 'next/link'
import { Car } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Fleet Management</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <Car className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Fleet Management</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Modern fleet management system for efficient operations
              </p>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Fleet Management. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}