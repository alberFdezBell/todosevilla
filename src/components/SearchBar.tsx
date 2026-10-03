'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Store, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  query: string
  barrios: Array<{ id: string; nombre: string; slug: string; _count?: { negocios: number } }>
  negocios: Array<{
    id: string
    nombre: string
    slug: string
    barrio: { nombre: string; slug: string }
    direccion?: string
  }>
}

export function SearchBar({ placeholder = 'Buscar cafetería, peluquería, Triana, Nervión...' }: { placeholder?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      setIsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setIsOpen(true)
        }
      } catch (err) {
        console.error('Search fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      router.push(`/sevilla/buscar?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center shadow-md rounded-2xl overflow-hidden border-2 border-[#f3d044] focus-within:border-[#d4b123] bg-white transition-all">
        <div className="pl-4 pr-2 text-gray-700">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#d4b123]" />
          ) : (
            <Search className="w-5 h-5 text-gray-600" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full py-3.5 pr-4 text-gray-900 placeholder-gray-400 font-medium text-base sm:text-lg focus:outline-none bg-transparent"
        />
        <button
          type="submit"
          className="mr-1.5 bg-[#f3d044] hover:bg-[#e5c234] text-gray-950 font-extrabold px-5 py-2.5 rounded-xl text-sm sm:text-base transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <span>Buscar</span>
          <ArrowRight className="w-4 h-4 hidden sm:inline" />
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {results.barrios.length === 0 && results.negocios.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Barrio matches */}
              {results.barrios.length > 0 && (
                <div className="p-3 bg-[#fff7d1]/50">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-800 mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-700" />
                    Barrios encontrados ({results.barrios.length})
                  </div>
                  <div className="space-y-1">
                    {results.barrios.map((b) => (
                      <Link
                        key={b.id}
                        href={`/sevilla/${b.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white text-sm font-semibold text-gray-900 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#d4b123]" />
                          Barrio {b.nombre}
                        </span>
                        {b._count && (
                          <span className="text-xs font-bold text-gray-700 bg-white border border-[#ecd37b] px-2 py-0.5 rounded-full">
                            {b._count.negocios} negocios
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Negocio matches */}
              {results.negocios.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-800 mb-2 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-[#d4b123]" />
                    Negocios ({results.negocios.length})
                  </div>
                  <div className="space-y-1">
                    {results.negocios.map((n) => (
                      <Link
                        key={n.id}
                        href={`/sevilla/${n.barrio.slug}/${n.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#fff7d1]/40 text-sm font-medium text-gray-900 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-gray-900">{n.nombre}</div>
                          {n.direccion && (
                            <div className="text-xs text-gray-500">{n.direccion}</div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-800 bg-[#fff7d1] border border-[#ecd37b] px-2 py-0.5 rounded-md">
                          {n.barrio.nombre}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-gray-50 text-center">
                <Link
                  href={`/sevilla/buscar?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-gray-900 hover:text-sevilla-carmesi"
                >
                  Ver todos los resultados de &quot;{query}&quot; →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
