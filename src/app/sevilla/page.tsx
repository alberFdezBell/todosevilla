import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SearchBar } from '@/components/SearchBar'
import { MapPin, Building2, Store, Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react'
import SevillaBarriosMap from '@/components/SevillaBarriosMap'

export const revalidate = 60
export const dynamic = 'force-dynamic'

async function getPortadaData() {
  try {
    const totalBarriosCount = await prisma.barrio.count({
      where: { activo: true },
    })

    const totalNegociosCount = await prisma.negocio.count({
      where: { activo: true, barrio: { activo: true } },
    })

    const barrios = await prisma.barrio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { negocios: { where: { activo: true } } },
        },
      },
    })

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
      <section className="relative bg-gradient-to-b from-[#fff7d1]/80 via-white to-[#f5f7fb] pt-12 pb-20 border-b border-[#ecd37b]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-950 tracking-tight leading-tight whitespace-nowrap max-w-full mx-auto">
            Las Páginas Amarillas de <span className="underline decoration-[#f3d044] decoration-4 underline-offset-4">Sevilla</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#516173] max-w-2xl mx-auto font-medium leading-relaxed">
            Encuentra bares, cafeterías, tiendas tradicionales, peluquerías y servicios profesionales cerca de ti en Sevilla.
          </p>

          {/* Buscador Principal */}
          <div className="pt-2">
            <SearchBar placeholder="Busca cafetería, bar Pepe, peluquería, Triana..." />
          </div>
        </div>
      </section>

      {/* Descubrimiento: Selección de negocios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950">
              Descubre negocios de Sevilla
            </h2>
          </div>
          <Link
            href="/sevilla/barrios"
            className="text-sm font-extrabold text-gray-900 hover:text-amber-700 flex items-center gap-1 group"
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
                className="bg-white rounded-2xl overflow-hidden border border-[#d7e0ea] shadow-xs hover:shadow-md hover:border-[#f3d044] transition-all flex flex-col group"
              >
                {negocio.imagen ? (
                  <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={negocio.imagen}
                      alt={negocio.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-[#fff7d1] border border-[#ecd37b] px-2.5 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-xs flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-700" />
                      {negocio.barrio.nombre}
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-[#fff7d1]/60 p-4 flex items-center justify-between border-b border-[#ecd37b]/40">
                    <div className="bg-white p-3 rounded-xl shadow-xs border border-[#ecd37b]">
                      <Store className="w-6 h-6 text-gray-800" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-[#ecd37b] shadow-xs">
                      {negocio.barrio.nombre}
                    </span>
                  </div>
                )}

                <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-950 group-hover:text-amber-800 transition-colors line-clamp-1">
                      {negocio.nombre}
                    </h3>
                    {negocio.descripcion && (
                      <p className="text-xs text-[#516173] line-clamp-2 mt-1 leading-relaxed">
                        {negocio.descripcion}
                      </p>
                    )}
                  </div>

                  {negocio.categorias.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                      {negocio.categorias.map((c) => (
                        <span
                          key={c.categoria.slug}
                          className="text-[11px] font-bold text-gray-800 bg-[#fff7d1] px-2 py-0.5 rounded-md border border-[#ecd37b]"
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
          <h2 className="text-3xl font-extrabold text-gray-950 mt-1">
            Explora Sevilla por Barrios
          </h2>
          <p className="text-sm text-[#516173] mt-2">
            Cada barrio tiene su propia alma, tradición y comercios de confianza.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {barrios.map((b) => (
            <Link
              key={b.id}
              href={`/sevilla/${b.slug}`}
              className="bg-white rounded-2xl border border-[#d7e0ea] p-6 shadow-xs hover:shadow-md hover:border-[#f3d044] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#fff7d1] text-gray-900 border border-[#ecd37b] p-2 rounded-xl group-hover:bg-[#f3d044] transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-xl text-gray-950 group-hover:text-amber-800 transition-colors">
                      {b.nombre}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-gray-800 bg-[#fff7d1] border border-[#ecd37b] px-2.5 py-1 rounded-full">
                    {b._count.negocios} negocios
                  </span>
                </div>

                {b.descripcion && (
                  <p className="text-xs text-[#516173] line-clamp-2 leading-relaxed">
                    {b.descripcion}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-extrabold text-gray-900 group-hover:underline">
                <span>Explorar negocios en {b.nombre}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Mapa de Barrios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-950 mt-1">
            Mapa de Barrios de Sevilla
          </h2>
          <p className="text-sm text-[#516173] mt-2">
            Pasa el ratón por cada barrio para descubrir su nombre y su situación en la ciudad.
          </p>
        </div>
        <SevillaBarriosMap
          height={680}
          className="w-full rounded-2xl border border-[#d7e0ea] shadow-sm overflow-hidden"
        />
      </section>

      {/* About Todo Sevilla Info Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-black text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden border-t-4 border-[#f3d044]">
          <div className="max-w-3xl relative z-10 space-y-4">
            <span className="text-xs font-extrabold text-[#f3d044] uppercase tracking-widest">
              ¿Qué es Todo Sevilla?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              El directorio local digital creado por y para Sevilla
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Todo Sevilla nace con el objetivo de ofrecer unas Páginas Amarillas modernas, rápidas y sin distracciones. Queremos dar visibilidad a la abancería del barrio, la freiduría de siempre, la cafetería con el mejor café y todos los profesionales que hacen latir nuestra ciudad.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-gray-300">
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
