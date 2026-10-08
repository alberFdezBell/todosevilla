import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MapPin, Store, ArrowRight, Building2, Phone, Globe } from 'lucide-react'
import type { Metadata } from 'next'

interface BarrioPageProps {
  params: { barrioSlug: string }
}

export async function generateMetadata({ params }: BarrioPageProps): Promise<Metadata> {
  const barrio = await prisma.barrio.findFirst({
    where: { slug: params.barrioSlug, activo: true },
  })

  if (!barrio) {
    return { title: 'Barrio no encontrado — Todo Sevilla' }
  }

  return {
    title: `Negocios en ${barrio.nombre} — Todo Sevilla`,
    description: barrio.descripcion || `Descubre los mejores negocios, comercios y servicios en el barrio de ${barrio.nombre}, Sevilla.`,
  }
}

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function BarrioDetailPage({ params }: BarrioPageProps) {
  const barrio = await prisma.barrio.findFirst({
    where: { slug: params.barrioSlug, activo: true },
    include: {
      negocios: {
        where: { activo: true },
        orderBy: { nombre: 'asc' },
        include: {
          categorias: {
            where: { categoria: { activa: true } },
            include: { categoria: { select: { nombre: true, slug: true } } },
          },
        },
      },
    },
  })

  if (!barrio) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 font-medium flex items-center gap-2">
        <Link href="/sevilla" className="hover:text-sevilla-carmesi">Inicio</Link>
        <span>/</span>
        <Link href="/sevilla/barrios" className="hover:text-sevilla-carmesi">Barrios</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">{barrio.nombre}</span>
      </nav>

      {/* Barrio Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {barrio.imagen && (
          <div className="md:w-1/3 h-56 md:h-auto relative bg-gray-100">
            <img
              src={barrio.imagen}
              alt={barrio.nombre}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-8 md:w-2/3 flex flex-col justify-between space-y-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              {barrio.nombre}
            </h1>
            {barrio.descripcion && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                {barrio.descripcion}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
            {barrio.negocios.length} negocio{barrio.negocios.length === 1 ? '' : 's'} activo{barrio.negocios.length === 1 ? '' : 's'} en este barrio
          </div>
        </div>
      </div>

      {/* Negocios List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-sevilla-carmesi" />
          Comercios y Negocios en {barrio.nombre}
        </h2>

        {barrio.negocios.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 space-y-3">
            <Store className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="font-bold text-gray-800">Aún no hay negocios registrados en {barrio.nombre}</h3>
            <p className="text-xs text-gray-500">
              ¿Eres propietario de un negocio en este barrio? Contacta con nosotros para incorporarlo.
            </p>
            <Link
              href="/contacto"
              className="inline-block mt-2 bg-sevilla-carmesi text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Sugerir negocio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barrio.negocios.map((negocio) => (
              <Link
                key={negocio.id}
                href={`/sevilla/${barrio.slug}/${negocio.slug}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-sevilla-carmesi transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xl text-gray-900 group-hover:text-sevilla-carmesi transition-colors">
                    {negocio.nombre}
                  </h3>

                  {negocio.descripcion && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {negocio.descripcion}
                    </p>
                  )}

                  {negocio.direccion && (
                    <div className="text-xs text-gray-500 flex items-start gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-sevilla-albero-dark shrink-0 mt-0.5" />
                      <span>{negocio.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-sevilla-carmesi group-hover:underline">
                  <span>Ver ficha completa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
