import Image from 'next/image'
import Link from 'next/link'
import { Car, Shield, Users, Clock, MapPin, CheckCircle, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Security & Compliance",
      description: "Enterprise-grade security with full compliance tracking"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Driver Management",
      description: "Complete driver profiles with license and performance tracking"
    },
    {
      icon: <Car className="w-8 h-8" />,
      title: "Vehicle Fleet",
      description: "Manage your entire vehicle fleet with maintenance scheduling"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Real-time Tracking",
      description: "Live GPS tracking and route optimization"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Route Planning",
      description: "Intelligent route planning and dispatch management"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Maintenance Alerts",
      description: "Automated maintenance alerts and service scheduling"
    }
  ]

  const stats = [
    { value: "99%", label: "Uptime" },
    { value: "24/7", label: "Support" },
    { value: "1000+", label: "Vehicles Managed" },
    { value: "50+", label: "Companies Trust Us" }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Car className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Fleet Management</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Modern Fleet Management
              <br />
              <span className="text-blue-200">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Streamline your fleet operations with our comprehensive management platform.
              Track drivers, manage vehicles, and optimize routes all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-semibold transition flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                href="/login"
                className="bg-transparent border-2 border-white hover:bg-white/10 px-8 py-3 rounded-lg text-lg font-semibold transition"
              >
                Demo Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Fleet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From driver management to vehicle maintenance, our platform provides all the tools
              you need to run an efficient and profitable fleet operation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Fleet Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of companies that trust our platform to manage their fleets.
            Start your free trial today – no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              Get Started for Free
            </Link>
            <Link
              href="/login"
              className="bg-transparent border-2 border-white hover:bg-white/10 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              Schedule a Demo
            </Link>
          </div>
          <p className="mt-8 text-blue-200">
            Already have an account?{' '}
            <Link href="/login" className="text-white font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </section>

      {/* Test Accounts Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Want to Explore First?
          </h3>
          <p className="text-gray-600 mb-8">
            Use these test accounts to experience the platform:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-blue-600 font-semibold mb-2">Administrator</div>
              <div className="text-gray-900">admin@fleet.com</div>
              <div className="text-gray-500 text-sm">Password: admin123</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-green-600 font-semibold mb-2">Fleet Owner</div>
              <div className="text-gray-900">owner@fleet.com</div>
              <div className="text-gray-500 text-sm">Password: owner123</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-purple-600 font-semibold mb-2">Driver</div>
              <div className="text-gray-900">driver@fleet.com</div>
              <div className="text-gray-500 text-sm">Password: driver123</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <Car className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold">Fleet Management</span>
              </div>
              <p className="text-gray-400 mt-2">
                Modern fleet management for the digital age
              </p>
            </div>
            <div className="text-gray-400">
              <p>© {new Date().getFullYear()} Fleet Management System. All rights reserved.</p>
              <p className="mt-2 text-sm">Built with Next.js 14 & Tailwind CSS</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}