import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/AdminLayout'
import { Building2, Store, Tags, Plus, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

export const revalidate = 0

async function getAdminDashboardStats() {
  const [totalBarrios, totalNegocios, activosNegocios, inactivosNegocios, totalCategorias] = await Promise.all([
    prisma.barrio.count(),
    prisma.negocio.count(),
    prisma.negocio.count({ where: { activo: true } }),
    prisma.negocio.count({ where: { activo: false } }),
    prisma.categoria.count(),
  ])

  return {
    totalBarrios,
    totalNegocios,
    activosNegocios,
    inactivosNegocios,
    totalCategorias,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats()

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Panel de Control
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Resumen general del estado de la base de datos de Todo Sevilla
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Barrios */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Barrios</span>
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalBarrios}</div>
            </div>
            <div className="bg-amber-100 text-sevilla-carmesi p-3 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Total Negocios */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Negocios</span>
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalNegocios}</div>
            </div>
            <div className="bg-amber-100 text-sevilla-albero-dark p-3 rounded-xl">
              <Store className="w-6 h-6" />
            </div>
          </div>

          {/* Activos */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Negocios Activos</span>
              <div className="text-3xl font-extrabold text-emerald-700 mt-1">{stats.activosNegocios}</div>
            </div>
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Inactivos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">Negocios Inactivos</span>
              <div className="text-3xl font-extrabold text-red-700 mt-1">{stats.inactivosNegocios}</div>
            </div>
            <div className="bg-red-100 text-red-700 p-3 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Actions & Navigation */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
            Acciones Rápidas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/barrios?action=new"
              className="p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 hover:border-sevilla-carmesi transition-all flex items-center gap-4 group"
            >
              <div className="bg-sevilla-carmesi text-white p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-gray-900 group-hover:text-sevilla-carmesi">
                  + Crear Barrio
                </strong>
                <span className="text-xs text-gray-500">Añadir nuevo barrio a la estructura</span>
              </div>
            </Link>

            <Link
              href="/admin/negocios?action=new"
              className="p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 hover:border-sevilla-carmesi transition-all flex items-center gap-4 group"
            >
              <div className="bg-sevilla-albero-dark text-white p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-gray-900 group-hover:text-sevilla-carmesi">
                  + Crear Negocio
                </strong>
                <span className="text-xs text-gray-500">Registrar un nuevo comercio</span>
              </div>
            </Link>

            <Link
              href="/admin/categorias?action=new"
              className="p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 hover:border-sevilla-carmesi transition-all flex items-center gap-4 group"
            >
              <div className="bg-gray-800 text-white p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-gray-900 group-hover:text-sevilla-carmesi">
                  + Crear Categoría
                </strong>
                <span className="text-xs text-gray-500">Categorizar negocios</span>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <Link
              href="/admin/barrios"
              className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-xs font-bold text-gray-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sevilla-carmesi" />
                Gestionar Barrios ({stats.totalBarrios})
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              href="/admin/negocios"
              className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-xs font-bold text-gray-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-sevilla-albero-dark" />
                Gestionar Negocios ({stats.totalNegocios})
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              href="/admin/categorias"
              className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-xs font-bold text-gray-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Tags className="w-4 h-4 text-gray-700" />
                Gestionar Categorías ({stats.totalCategorias})
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
