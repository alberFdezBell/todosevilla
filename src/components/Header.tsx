'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, Building2, Shield } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#f3d044]/95 backdrop-blur-md border-b border-black/10 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Todo Sevilla */}
        <Link href="/sevilla" className="flex items-center gap-3 group">
          <Image
            src="/todosevilla.svg"
            alt="Logo Todo Sevilla"
            width={56}
            height={56}
            className="shrink-0 object-contain group-hover:scale-105 transition-transform"
            priority
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-gray-950 leading-none">
              TODO <span className="text-gray-900">SEVILLA</span>
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-800 opacity-90">
              Directorio Local de Barrios
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-2 text-sm font-bold text-gray-900">
          <Link
            href="/sevilla"
            className="hover:bg-black/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/sevilla/barrios"
            className="flex items-center gap-1.5 hover:bg-black/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Building2 className="w-4 h-4 text-gray-800" />
            Barrios
          </Link>
          <Link
            href="/sevilla/buscar"
            className="flex items-center gap-1.5 hover:bg-black/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4 text-gray-800" />
            Buscador
          </Link>
          <Link
            href="/contacto"
            className="hover:bg-black/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            Contacto
          </Link>
        </nav>

        {/* Actions / Admin Link */}
        <div className="flex items-center gap-2">
          <Link
            href="/sevilla/buscar"
            className="md:hidden p-2 text-gray-900 hover:bg-black/10 rounded-lg transition-colors"
            aria-label="Buscar negocios"
          >
            <Search className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
