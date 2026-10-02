import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MapPin, ArrowRight, Building2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barrios de Sevilla — Directorio Completo',
  description: 'Explora todos los barrios de Sevilla: Triana, Nervión, La Macarena, Centro y más. Encuentra comercios y servicios locales.',
}

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function BarriosListPage() {
  const barrios = await prisma.barrio.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    include: {
      _count: {
        select: { negocios: { where: { activo: true } } },
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 font-medium flex items-center gap-2">
        <Link href="/sevilla" className="hover:text-sevilla-carmesi">Inicio</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Barrios</span>
      </nav>

      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-sevilla-carmesi" />
          Barrios de Sevilla
        </h1>
        <p className="text-sm text-gray-600 mt-2 max-w-2xl">
          Selecciona un barrio para ver el listado de comercios, bares, cafeterías y profesionales disponibles.
        </p>
      </div>

      {/* Barrios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {barrios.map((barrio) => (
          <Link
            key={barrio.id}
            href={`/sevilla/${barrio.slug}`}
            className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:border-sevilla-carmesi transition-all flex flex-col group"
          >
            {barrio.imagen ? (
              <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                <img
                  src={barrio.imagen}
                  alt={`Barrio ${barrio.nombre}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-amber-900 shadow-sm">
                  {barrio._count.negocios} negocios
                </div>
              </div>
            ) : (
              <div className="h-28 bg-gradient-to-r from-amber-50 to-amber-100 p-4 flex items-center justify-between border-b border-amber-200/50">
                <div className="flex items-center gap-2 text-sevilla-carmesi font-bold text-lg">
                  <MapPin className="w-5 h-5" />
                  {barrio.nombre}
                </div>
                <span className="text-xs font-bold text-amber-900 bg-white px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">
                  {barrio._count.negocios} negocios
                </span>
              </div>
            )}

            <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 group-hover:text-sevilla-carmesi transition-colors">
                  {barrio.nombre}
                </h2>
                {barrio.descripcion && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                    {barrio.descripcion}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-sevilla-carmesi group-hover:underline">
                <span>Ver todos los negocios</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
