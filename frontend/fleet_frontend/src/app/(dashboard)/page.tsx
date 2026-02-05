'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  Car, 
  Shield, 
  Key, 
  User, 
  Lock, 
  Sparkles,
  ArrowRight,
  Smartphone,
  Mail,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/authContext'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@fleet.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeDemo, setActiveDemo] = useState(0)
  const { login } = useAuth()
  const router = useRouter()

  // Animation des démos de comptes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoAccounts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Comptes de démonstration
  const demoAccounts = [
    { email: 'admin@fleet.com', password: 'admin123', role: 'Administrateur', color: 'from-blue-600 to-blue-800', icon: <Shield /> },
    { email: 'owner@fleet.com', password: 'owner123', role: 'Propriétaire', color: 'from-emerald-600 to-emerald-800', icon: <Key /> },
    { email: 'driver@fleet.com', password: 'driver123', role: 'Conducteur', color: 'from-purple-600 to-purple-800', icon: <User /> }
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    
    setLoading(true)

    try {
      const result = await login({ email, password })
      if (result.success) {
        toast.success('Connexion réussie !')
        router.push('/dashboard')
      } else {
        toast.error(result.message || 'Identifiants incorrects')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail)
    setPassword(accountPassword)
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Sidebar avec animation */}
      <div className="hidden lg:flex flex-col w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
        
        {/* Animation de particules */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 bg-blue-400 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                opacity: Math.random() * 0.5 + 0.3
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Logo animé */}
          <Link href="/" className="flex items-center space-x-3 mb-16 group">
            <div className="relative">
              <Car className="h-12 w-12 text-white group-hover:text-blue-300 transition-colors" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">FleetAuto</h1>
              <p className="text-blue-200 text-sm">Gestion de Flotte Pro</p>
            </div>
          </Link>

          {/* Message d'accueil */}
          <div className="mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-sm text-white">Plateforme #1 de gestion de flotte</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Gérez votre flotte
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                avec intelligence
              </span>
            </h2>
            <p className="text-xl text-blue-100">
              Connectez-vous pour accéder à votre tableau de bord et optimiser vos opérations.
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-6 mt-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-blue-200 text-sm mt-2">Disponibilité</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-blue-200 text-sm mt-2">Support</div>
            </div>
          </div>

          {/* Témoignage */}
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="font-semibold text-white">Jean Dupont</div>
                <div className="text-blue-200 text-sm">Directeur Logistique</div>
              </div>
            </div>
            <p className="text-blue-100 italic">
              "FleetAuto a révolutionné notre gestion de flotte. Interface intuitive et résultats concrets."
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de connexion */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8">
            {/* En-tête du formulaire */}
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur-xl opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 w-20 h-20 rounded-2xl flex items-center justify-center">
                  <LogIn className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Connexion à votre compte
              </h1>
              <p className="text-gray-600">
                Accédez à votre tableau de bord de gestion de flotte
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  Adresse email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-12 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all group-hover:border-blue-300"
                    placeholder="votre@email.com"
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Mot de passe */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-blue-500" />
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-12 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all group-hover:border-blue-300 pr-12"
                    placeholder="Votre mot de passe"
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Options supplémentaires */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Se connecter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="my-8 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500">OU</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Comptes de démonstration */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-2">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Comptes de démonstration
                </div>
                <p className="text-sm text-gray-600">Testez rapidement les différentes fonctionnalités</p>
              </div>

              <div className="space-y-4">
                {demoAccounts.map((account, index) => (
                  <div
                    key={index}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer transform hover:-translate-y-1 ${
                      activeDemo === index
                        ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => quickLogin(account.email, account.password)}
                  >
                    {activeDemo === index && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Actif
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`bg-gradient-to-r ${account.color} w-10 h-10 rounded-lg flex items-center justify-center mr-3`}>
                          {account.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{account.role}</div>
                          <div className="text-sm text-gray-500">{account.email}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          quickLogin(account.email, account.password)
                        }}
                      >
                        Utiliser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-xs text-gray-500 text-center">
                <AlertCircle className="inline h-3 w-3 mr-1" />
                Ces comptes sont créés automatiquement au démarrage du backend
              </div>
            </div>

            {/* Lien d'inscription */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Pas encore de compte ?{' '}
                <Link 
                  href="/register" 
                  className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center group"
                >
                  Créer un compte
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>

            {/* Informations de sécurité */}
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Shield className="h-4 w-4 text-green-500 mr-2" />
                <span>Connexion sécurisée • Données cryptées</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #1f2937;
          -webkit-box-shadow: 0 0 0px 1000px #f9fafb inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  )
}