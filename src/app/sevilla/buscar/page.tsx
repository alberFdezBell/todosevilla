import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SearchBar } from '@/components/SearchBar'
import { Search, MapPin, Store, ArrowRight, Filter } from 'lucide-react'
import type { Metadata } from 'next'

interface SearchPageProps {
  searchParams: { q?: string }
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q?.trim() || ''
  return {
    title: query ? `Resultados de "${query}" — Todo Sevilla` : 'Buscador de Negocios — Todo Sevilla',
    description: 'Busca bares, comercios, peluquerías y negocios por nombre o barrio en Sevilla.',
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() || ''
  const cleanQuery = query.toLowerCase()

  let barrios: Array<{
    id: string
    nombre: string
    slug: string
    descripcion: string | null
    imagen: string | null
    _count: { negocios: number }
  }> = []

  let negocios: Array<{
    id: string
    nombre: string
    slug: string
    descripcion: string | null
    direccion: string | null
    barrio: { nombre: string; slug: string }
    categorias: Array<{ categoria: { nombre: string; slug: string } }>
  }> = []

  if (cleanQuery.length >= 2) {
    // 1. Search active barrios
    barrios = await prisma.barrio.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: cleanQuery, mode: 'insensitive' } },
          { descripcion: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: { select: { negocios: { where: { activo: true } } } },
      },
    })

    // 2. Search active businesses matching name, description, address, barrio name, category name
    negocios = await prisma.negocio.findMany({
      where: {
        activo: true,
        barrio: { activo: true },
        OR: [
          { nombre: { contains: cleanQuery, mode: 'insensitive' } },
          { descripcion: { contains: cleanQuery, mode: 'insensitive' } },
          { direccion: { contains: cleanQuery, mode: 'insensitive' } },
          { barrio: { nombre: { contains: cleanQuery, mode: 'insensitive' } } },
          {
            categorias: {
              some: {
                categoria: {
                  nombre: { contains: cleanQuery, mode: 'insensitive' },
                  activa: true,
                },
              },
            },
          },
        ],
      },
      include: {
        barrio: { select: { nombre: true, slug: true } },
        categorias: {
          where: { categoria: { activa: true } },
          include: { categoria: { select: { nombre: true, slug: true } } },
        },
      },
      orderBy: { nombre: 'asc' },
    })
  }

  const totalFound = barrios.length + negocios.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Search Header */}
      <div className="py-8 text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Buscar en Sevilla
        </h1>
        <div className="max-w-2xl mx-auto">
          <SearchBar placeholder="Escribe el nombre del negocio, tipo de servicio o barrio..." />
        </div>
      </div>

      {/* Results Header */}
      {query && (
        <div className="border-b border-gray-200 pb-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-gray-700 px-3.5 py-1.5 rounded-full">
            {totalFound} resultado{totalFound === 1 ? '' : 's'} encontrado{totalFound === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Search Results Display */}
      {query.length < 2 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 space-y-3">
          <Filter className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-bold text-gray-800">Introduce al menos 2 caracteres para buscar</h3>
          <p className="text-xs text-gray-500">
            Puedes buscar por término como &quot;café&quot;, &quot;peluquería&quot;, &quot;bar&quot; o por nombres de barrios como &quot;Triana&quot;.
          </p>
        </div>
      ) : totalFound === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 space-y-3">
          <Search className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-gray-800">No se encontraron resultados</h3>
          <p className="text-xs text-gray-500">
            Prueba a revisar la ortografía o intenta buscar un término más general.
          </p>
          <div className="pt-2">
            <Link
              href="/sevilla/barrios"
              className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-4 py-2 rounded-xl"
            >
              Explorar todos los barrios
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Barrio Results */}
          {barrios.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sevilla-carmesi" />
                Barrios ({barrios.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {barrios.map((b) => (
                  <Link
                    key={b.id}
                    href={`/sevilla/${b.slug}`}
                    className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-sm hover:border-sevilla-carmesi hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-extrabold text-lg text-gray-900 group-hover:text-sevilla-carmesi transition-colors">
                        Barrio {b.nombre}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {b._count.negocios} negocio(s) activo(s)
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-sevilla-carmesi group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Business Results */}
          {negocios.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-sevilla-albero-dark" />
                Negocios encontrados ({negocios.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {negocios.map((negocio) => (
                  <Link
                    key={negocio.id}
                    href={`/sevilla/${negocio.barrio.slug}/${negocio.slug}`}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-sevilla-carmesi transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {negocio.barrio.nombre}
                      </p>

                      <h4 className="font-extrabold text-lg text-gray-900 group-hover:text-sevilla-carmesi transition-colors">
                        {negocio.nombre}
                      </h4>

                      {negocio.descripcion && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {negocio.descripcion}
                        </p>
                      )}

                      {negocio.direccion && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-sevilla-albero-dark shrink-0" />
                          <span className="truncate">{negocio.direccion}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-sevilla-carmesi group-hover:underline">
                      <span>Ver detalles</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
