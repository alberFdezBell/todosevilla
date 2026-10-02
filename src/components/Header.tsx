'use client'

import Link from 'next/link'
import { MapPin, Search, Store, Building2, Shield } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/sevilla" className="flex items-center gap-2 group">
          <div className="bg-sevilla-carmesi text-white p-2 rounded-lg group-hover:bg-sevilla-carmesi-dark transition-colors shadow-sm">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-gray-900 leading-none group-hover:text-sevilla-carmesi transition-colors">
              TODO <span className="text-sevilla-albero-dark">SEVILLA</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700">
              Directorio Local de Barrios
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700">
          <Link
            href="/sevilla"
            className="hover:text-sevilla-carmesi transition-colors py-1"
          >
            Inicio
          </Link>
          <Link
            href="/sevilla/barrios"
            className="flex items-center gap-1.5 hover:text-sevilla-carmesi transition-colors py-1"
          >
            <Building2 className="w-4 h-4 text-sevilla-albero-dark" />
            Barrios
          </Link>
          <Link
            href="/sevilla/buscar"
            className="flex items-center gap-1.5 hover:text-sevilla-carmesi transition-colors py-1"
          >
            <Search className="w-4 h-4 text-sevilla-albero-dark" />
            Buscador
          </Link>
          <Link
            href="/contacto"
            className="hover:text-sevilla-carmesi transition-colors py-1"
          >
            Contacto
          </Link>
        </nav>

        {/* Action / Admin Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/sevilla/buscar"
            className="md:hidden p-2 text-gray-600 hover:text-sevilla-carmesi rounded-lg hover:bg-amber-50"
            aria-label="Buscar negocios"
          >
            <Search className="w-5 h-5" />
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-md transition-colors"
            title="Panel de Administración (Acceso restringido)"
          >
            <Shield className="w-3.5 h-3.5 text-sevilla-carmesi" />
            <span className="hidden sm:inline">Panel Admin</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
