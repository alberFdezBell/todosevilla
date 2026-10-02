import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { SearchBar } from '@/components/SearchBar'
import { MapPin, Building2, Store, Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react'

// Revalidate page periodically or on demand
export const revalidate = 60
export const dynamic = 'force-dynamic'

async function getPortadaData() {
  try {
    // Stats: Real count of active barrios & active negocios
    const totalBarriosCount = await prisma.barrio.count({
      where: { activo: true },
    })

    const totalNegociosCount = await prisma.negocio.count({
      where: { activo: true, barrio: { activo: true } },
    })

    // Active barrios list
    const barrios = await prisma.barrio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { negocios: { where: { activo: true } } },
        },
      },
    })

    // Discovery: pseudo-random selection of active businesses (fetch active businesses and shuffle)
    const activeNegocios = await prisma.negocio.findMany({
      where: { activo: true, barrio: { activo: true } },
      include: {
        barrio: { select: { nombre: true, slug: true } },
        categorias: {
          where: { categoria: { activa: true } },
          include: { categoria: { select: { nombre: true, slug: true } } },
        },
      },
      take: 20,
    })

    // Shuffle array pseudo-randomly
    const discoveryNegocios = [...activeNegocios]
      .sort(() => 0.5 - Math.random())
      .slice(0, 6)

    return {
      totalBarriosCount,
      totalNegociosCount,
      barrios,
      discoveryNegocios,
    }
  } catch (error) {
    console.error('Error fetching portada data:', error)
    return {
      totalBarriosCount: 0,
      totalNegociosCount: 0,
      barrios: [],
      discoveryNegocios: [],
    }
  }
}

export default async function PortadaPage() {
  const { totalBarriosCount, totalNegociosCount, barrios, discoveryNegocios } = await getPortadaData()

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-amber-50 via-amber-50/50 to-gray-50 pt-12 pb-20 border-b border-amber-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-amber-100/80 border border-amber-300/60 text-amber-900 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-4 h-4 text-sevilla-carmesi" />
            Descubre tu ciudad barrio a barrio
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Las Páginas Amarillas de <span className="text-sevilla-carmesi">Sevilla</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Encuentra bares, cafeterías, tiendas tradicionales, peluquerías y servicios profesionales cerca de ti en Triana, Nervión, Macarena y más.
          </p>

          {/* Buscador Principal */}
          <div className="pt-2">
            <SearchBar placeholder="Busca cafetería, bar Pepe, peluquería, Triana..." />
          </div>

          {/* Estadísticas Reales */}
          <div className="flex items-center justify-center gap-8 pt-4 text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-200/60 shadow-sm">
              <Building2 className="w-5 h-5 text-sevilla-albero-dark" />
              <span>
                <strong className="text-sevilla-carmesi font-extrabold text-base">{totalBarriosCount}</strong> barrios activos
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-200/60 shadow-sm">
              <Store className="w-5 h-5 text-sevilla-albero-dark" />
              <span>
                <strong className="text-sevilla-carmesi font-extrabold text-base">{totalNegociosCount}</strong> negocios verificados
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Descubrimiento: Selección de negocios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold text-sevilla-carmesi uppercase tracking-widest block">
              Sugerencias locales
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Descubre negocios de Sevilla
            </h2>
          </div>
          <Link
            href="/sevilla/barrios"
            className="text-sm font-bold text-sevilla-carmesi hover:text-sevilla-carmesi-dark flex items-center gap-1 group"
          >
            Ver todos los barrios
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {discoveryNegocios.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
            No hay negocios activos disponibles por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {discoveryNegocios.map((negocio) => (
              <Link
                key={negocio.id}
                href={`/sevilla/${negocio.barrio.slug}/${negocio.slug}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md hover:border-sevilla-albero transition-all flex flex-col group"
              >
                {negocio.imagen ? (
                  <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={negocio.imagen}
                      alt={negocio.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-sevilla-carmesi shadow-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sevilla-albero-dark" />
                      {negocio.barrio.nombre}
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-gradient-to-r from-amber-50 to-amber-100/80 p-4 flex items-center justify-between border-b border-amber-200/50">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-amber-200">
                      <Store className="w-6 h-6 text-sevilla-carmesi" />
                    </div>
                    <span className="text-xs font-bold text-sevilla-carmesi bg-white px-2.5 py-1 rounded-md border border-amber-200 shadow-sm">
                      {negocio.barrio.nombre}
                    </span>
                  </div>
                )}

                <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-sevilla-carmesi transition-colors line-clamp-1">
                      {negocio.nombre}
                    </h3>
                    {negocio.descripcion && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                        {negocio.descripcion}
                      </p>
                    )}
                  </div>

                  {negocio.categorias.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                      {negocio.categorias.map((c) => (
                        <span
                          key={c.categoria.slug}
                          className="text-[11px] font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60"
                        >
                          {c.categoria.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Barrios Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold text-sevilla-albero-dark uppercase tracking-widest block">
            Estructura por Barrios
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
            Explora Sevilla por Barrios
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Cada barrio tiene su propia alma, tradición y comercios de confianza.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {barrios.map((b) => (
            <Link
              key={b.id}
              href={`/sevilla/${b.slug}`}
              className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md hover:border-sevilla-carmesi transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-100 text-sevilla-carmesi p-2 rounded-xl group-hover:bg-sevilla-carmesi group-hover:text-white transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-xl text-gray-900 group-hover:text-sevilla-carmesi transition-colors">
                      {b.nombre}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    {b._count.negocios} negocios
                  </span>
                </div>

                {b.descripcion && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {b.descripcion}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-sevilla-carmesi group-hover:underline">
                <span>Explorar negocios en {b.nombre}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About Todo Sevilla Info Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-4">
            <span className="text-xs font-extrabold text-sevilla-albero uppercase tracking-widest">
              ¿Qué es Todo Sevilla?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              El directorio local digital creado por y para Sevilla
            </h2>
            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
              Todo Sevilla nace con el objetivo de ofrecer unas Páginas Amarillas modernas, rápidas y sin distracciones. Queremos dar visibilidad a la abancería del barrio, la freiduría de siempre, la cafetería con el mejor café y todos los profesionales que hacen latir nuestra ciudad.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-amber-200">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sevilla-albero" />
                <span>Sin intermediarios ni comisiones</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-sevilla-carmesi fill-sevilla-carmesi" />
                <span>Apoyo al comercio de cercanía</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
