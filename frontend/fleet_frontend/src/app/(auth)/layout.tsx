import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Car, PhoneCall } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(900px_650px_at_85%_85%,rgba(16,185,129,0.14),transparent_60%),linear-gradient(to_bottom,#f8fafc,white,#f8fafc)]">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-44 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-300/30 via-white to-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 right-[-120px] h-[560px] w-[560px] rounded-full bg-gradient-to-br from-emerald-300/25 to-sky-300/20 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Car className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-slate-900">
                FleetIQ
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Automobile • IA • GPS
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-extrabold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-emerald-500 to-sky-500" />
              <span className="relative">Sign Up</span>
              <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/contact"
              className="ml-2 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-extrabold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <PhoneCall className="h-4 w-4 text-slate-600" />
              Support
            </Link>
          </nav>

          {/* Mobile quick links */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/login"
              className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-extrabold text-slate-900 shadow-sm"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      
        <footer className="border-t border-slate-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <Car className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-base font-extrabold text-slate-900">FleetIQ</p>
                  <p className="text-xs font-semibold text-slate-600">
                    Modern fleet management • IA • GPS
                  </p>
                </div>
              </div>
              <p className="mt-3 max-w-md text-sm font-semibold text-slate-600">
                Plateforme web intelligente pour optimiser les opérations de flotte et réduire les coûts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-extrabold">
              <Link className="text-slate-600 hover:text-slate-900" href="/privacy">
                Confidentialité
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/terms">
                Conditions
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/contact">
                Support
              </Link>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">© {new Date().getFullYear()} FleetIQ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}