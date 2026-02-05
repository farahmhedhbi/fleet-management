'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/authContext'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@fleet.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    
    setLoading(true)

    try {
      const result = await login({ email, password })
      if (result.success) {
        toast.success('Login successful!')
        router.push('/dashboard')
      } else {
        toast.error(result.message || 'Invalid credentials')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          {/* CORRECTION ICI : Remplacer le <p> qui contient un <div> */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              <span className="font-semibold block mb-2">Test accounts:</span>
              
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-blue-600">Admin:</span>
                  <br />
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">admin@fleet.com</code> / 
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-1">admin123</code>
                </div>
                
                <div>
                  <span className="font-medium text-green-600">Owner:</span>
                  <br />
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">owner@fleet.com</code> / 
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-1">owner123</code>
                </div>
                
                <div>
                  <span className="font-medium text-purple-600">Driver:</span>
                  <br />
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">driver@fleet.com</code> / 
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-1">driver123</code>
                </div>
              </div>
              
              <div className="mt-4 text-xs">
                These accounts are created automatically when the backend starts.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}