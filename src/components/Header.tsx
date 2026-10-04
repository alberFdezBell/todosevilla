'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Search, LogOut } from 'lucide-react'
import { getPageLabel, shouldShowAdminControls } from '@/lib/page-labels'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()

  // En /admin/login todavía no hay sesión iniciada: no mostrar los controles de sesión
  const showAdminControls = shouldShowAdminControls(pathname)

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

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
            <span className="-ml-1 font-extrabold text-xl tracking-tight text-gray-950 leading-none">
              TODO <span className="text-gray-900">SEVILLA</span>
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-800 opacity-90">
              {getPageLabel(pathname)}
            </span>
          </div>
        </Link>

        {/* Actions / Admin Controls */}
        <div className="flex items-center gap-2">
          {showAdminControls ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-700/40 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Red Local Autenticada
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-50/80 border border-red-300/80 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <Link
              href="/sevilla/buscar"
              className="md:hidden p-2 text-gray-900 hover:bg-black/10 rounded-lg transition-colors"
              aria-label="Buscar negocios"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
