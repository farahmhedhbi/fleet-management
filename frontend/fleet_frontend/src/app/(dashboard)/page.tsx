'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
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
  AlertCircle,
  Check,
  BarChart3,
  Cpu,
  Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/authContext'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@fleet.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeDemo, setActiveDemo] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // Animation des démos de comptes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoAccounts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Effet de particules
  useEffect(() => {
    if (!containerRef.current) return

    const particles: HTMLDivElement[] = []
    const container = containerRef.current

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 50%;
        opacity: ${Math.random() * 0.4 + 0.1};
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: float ${Math.random() * 20 + 10}s linear infinite;
        animation-delay: ${Math.random() * 5}s;
      `
      container.appendChild(particle)
      particles.push(particle)
    }

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [])

  // Comptes de démonstration
  const demoAccounts = [
    { 
      email: 'admin@fleet.com', 
      password: 'admin123', 
      role: 'Administrateur', 
      color: 'from-blue-500 to-indigo-600', 
      icon: <Shield size={20} />,
      features: ['Accès complet', 'Gestion utilisateurs', 'Analytics']
    },
    { 
      email: 'owner@fleet.com', 
      password: 'owner123', 
      role: 'Propriétaire', 
      color: 'from-emerald-500 to-teal-600', 
      icon: <Key size={20} />,
      features: ['Vision globale', 'Gestion véhicules', 'Rapports']
    },
    { 
      email: 'driver@fleet.com', 
      password: 'driver123', 
      role: 'Conducteur', 
      color: 'from-purple-500 to-pink-600', 
      icon: <User size={20} />,
      features: ['Carnet route', 'Maintenance', 'Planning']
    }
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
        toast.success('Connexion réussie ! Redirection...')
        setTimeout(() => router.push('/dashboard'), 1000)
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
    toast.info(`Compte ${accountEmail} chargé`)
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 overflow-hidden" ref={containerRef}>
      {/* Sidebar avec effet glassmorphism */}
      <div className="hidden lg:flex flex-col w-1/2 p-12 relative overflow-hidden">
        {/* Arrière-plan avec gradient animé */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 animate-gradient"></div>
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Contenu principal */}
        <div className="relative z-10">
          {/* Logo animé */}
          <Link href="/" className="flex items-center space-x-3 mb-16 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-3 shadow-2xl">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <div className="relative">
              <h1 className="text-4xl font-bold text-white tracking-tight">FleetSync</h1>
              <p className="text-blue-200/80 text-sm font-medium tracking-wide">Intelligence de flotte</p>
            </div>
          </Link>

          {/* Message d'accueil */}
          <div className="mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-yellow-300 mr-2 animate-pulse" />
              <span className="text-sm text-white font-medium">Solution professionnelle de gestion</span>
              <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Optimisez votre flotte
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-text">
                  avec précision
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></span>
              </span>
            </h2>
            <p className="text-xl text-blue-100/90 font-light leading-relaxed">
              Plateforme intelligente pour une gestion optimale de vos véhicules et de vos équipes.
            </p>
          </div>

          {/* Fonctionnalités */}
          <div className="grid grid-cols-2 gap-6 mt-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mb-4">
                <BarChart3 className="h-6 w-6 text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-white">+45%</div>
              <div className="text-blue-200/80 text-sm font-medium mt-2">Efficacité opérationnelle</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 mb-4">
                <Zap className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="text-2xl font-bold text-white">-30%</div>
              <div className="text-blue-200/80 text-sm font-medium mt-2">Coûts de maintenance</div>
            </div>
          </div>

          {/* Témoignage avec effet glass */}
          <div className="mt-12 p-8 bg-gradient-to-br from-white/5 to-white/3 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md"></div>
                <div className="relative w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <div className="font-bold text-white text-lg">Marc Dubois</div>
                <div className="text-blue-200/80 text-sm">Directeur Logistique, Groupe Transport+</div>
              </div>
            </div>
            <p className="text-blue-100/90 italic text-lg leading-relaxed">
              "FleetSync a transformé notre gestion de flotte. Interface intuitive, analytics puissants, et un support exceptionnel."
            </p>
            <div className="flex mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} filled={true} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de connexion */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Effet de lumière */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10 hover:shadow-3xl transition-all duration-500">
            {/* En-tête du formulaire */}
            <div className="text-center mb-10">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-4 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
                  <LogIn className="h-12 w-12 text-white relative z-10" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Accédez à votre espace
              </h1>
              <p className="text-gray-600 font-medium">
                Gérez votre flotte en toute simplicité
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email avec effet focus */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="inline-flex p-2 rounded-lg bg-blue-50 mr-3 group-hover:bg-blue-100 transition-colors">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 rounded-xl group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300"></div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative w-full px-12 py-4 bg-gray-50/80 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all group-hover:border-blue-300 placeholder-gray-500"
                    placeholder="votre@email.com"
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Mot de passe */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <div className="inline-flex p-2 rounded-lg bg-blue-50 mr-3 group-hover:bg-blue-100 transition-colors">
                    <Lock className="h-4 w-4 text-blue-500" />
                  </div>
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 rounded-xl group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300"></div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative w-full px-12 py-4 bg-gray-50/80 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all group-hover:border-blue-300 placeholder-gray-500 pr-12"
                    placeholder="Votre mot de passe"
                    required
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Options supplémentaires */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                    />
                    <div className="w-5 h-5 bg-gray-200 rounded border border-gray-300 flex items-center justify-center transition-colors hover:bg-gray-300">
                      <Check className="h-3 w-3 text-white hidden" />
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-gray-600 font-medium">Se souvenir de moi</span>
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton de connexion avec effet hover */}
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-5 px-6 rounded-xl transition-all duration-500 transform hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none group"
              >
                {/* Effet de brillance */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-all duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`}></div>
                
                {loading ? (
                  <span className="flex items-center justify-center relative">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center relative">
                    Se connecter
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="my-8 flex items-center">
              <div className="flex-grow border-t border-gray-300/50"></div>
              <span className="mx-4 text-sm text-gray-500 font-medium">OU</span>
              <div className="flex-grow border-t border-gray-300/50"></div>
            </div>

            {/* Comptes de démonstration */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-sm font-semibold mb-3 shadow-sm">
                  <Cpu className="h-3 w-3 mr-2" />
                  Environnement de test
                </div>
                <p className="text-sm text-gray-600 font-medium">Explorez les différentes fonctionnalités</p>
              </div>

              <div className="space-y-4">
                {demoAccounts.map((account, index) => (
                  <div
                    key={index}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-500 cursor-pointer transform hover:-translate-y-1 ${
                      activeDemo === index
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 scale-[1.02] shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                    onClick={() => quickLogin(account.email, account.password)}
                  >
                    {activeDemo === index && (
                      <>
                        <div className="absolute -top-3 -right-3">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                            Actif
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      </>
                    )}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className={`relative bg-gradient-to-r ${account.color} w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-md`}>
                          <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
                          <div className="relative text-white">
                            {account.icon}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{account.role}</div>
                          <div className="text-sm text-gray-500 font-medium">{account.email}</div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {account.features.map((feature, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
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
              
              <div className="mt-4 text-xs text-gray-500 text-center flex items-center justify-center">
                <AlertCircle className="h-3 w-3 mr-1.5 text-blue-500" />
                Comptes pré-configurés pour le démonstration
              </div>
            </div>

            {/* Lien d'inscription */}
            <div className="text-center pt-8 border-t border-gray-200/50">
              <p className="text-gray-600 font-medium">
                Nouveau sur FleetSync ?{' '}
                <Link 
                  href="/register" 
                  className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center group"
                >
                  Créer un compte
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </p>
            </div>

            {/* Sécurité */}
            <div className="mt-8 p-5 bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-2xl border border-gray-200/50 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-gray-700 font-medium">Sécurité</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-gray-700 font-medium">Connecté</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-gray-700 font-medium">Chiffré</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }

        .animate-gradient-text {
          animation: gradient-text 3s ease infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .particle {
          pointer-events: none;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #111827;
          -webkit-box-shadow: 0 0 0px 1000px rgba(249, 250, 251, 0.8) inset;
          transition: background-color 5000s ease-in-out 0s;
          border: 1px solid #d1d5db;
        }

        .hover-shadow-3xl:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  )
}

// Composant étoile pour les avis
function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}