'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, Store, Tags, LayoutDashboard, LogOut } from 'lucide-react'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Gestionar Barrios', href: '/admin/barrios', icon: Building2 },
    { label: 'Gestionar Negocios', href: '/admin/negocios', icon: Store },
    { label: 'Gestionar Categorías', href: '/admin/categorias', icon: Tags },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar Admin */}
      <header className="bg-gray-950 text-white border-b-4 border-[#f3d044] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/todosevilla.svg"
              alt="Todo Sevilla Logo"
              width={28}
              height={28}
              className="object-contain shrink-0"
            />
            <div>
              <span className="font-extrabold text-lg tracking-tight">
                TODO SEVILLA <span className="text-[#f3d044] text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-gray-900 ml-1 border border-amber-500/20">Panel Admin</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full font-semibold hidden sm:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Red Local Autenticada
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="bg-gray-900 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#f3d044] text-gray-950 shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
