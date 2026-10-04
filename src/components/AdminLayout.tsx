'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Building2, Store, Tags, LayoutDashboard } from 'lucide-react'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
