'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AdminLayout } from '@/components/AdminLayout'
import { BarrioImportModal } from '@/components/BarrioImportModal'
import {
  Building2, Store, Tags, Plus, Upload, Edit2, Trash2,
  CheckCircle, AlertCircle, Loader2, XCircle, Search, X, ChevronRight
} from 'lucide-react'
import { slugify } from '@/lib/utils'
import type { Feature, Geometry } from 'geojson'

// Leaflet map con ssr:false
const BarrioMapDrawer = dynamic(() => import('@/components/BarrioMapDrawer'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 text-gray-400 text-sm">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando mapa…
    </div>
  ),
})

// Mapa de barrios coloreado usando Leaflet directamente
const AdminBarriosMap = dynamic(() => import('@/components/AdminBarriosMapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-400 text-sm">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando mapa…
    </div>
  ),
})

// ── Types ──────────────────────────────────────────────────────────────────────
interface BarrioItem {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagen: string | null
  geojson: object | null
  activo: boolean
  _count?: { negocios: number }
}

interface CategoriaSimple { id: string; nombre: string; slug: string }

interface NegocioItem {
  id: string
  nombre: string
  slug: string
  barrioId: string
  barrio: { id: string; nombre: string; slug: string }
  descripcion: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  web: string | null
  horario: string | null
  imagen: string | null
  activo: boolean
  categorias: Array<{ categoria: CategoriaSimple }>
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function BulkBar({
  count, total, onSelectAll, onActivate, onDeactivate, onDelete, busy
}: {
  count: number; total: number
  onSelectAll: () => void; onActivate: () => void
  onDeactivate: () => void; onDelete: () => void; busy: boolean
}) {
  if (count === 0) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
        <span className="bg-sevilla-carmesi text-white px-2 py-0.5 rounded-full text-[11px]">{count}</span>
        <button type="button" onClick={onSelectAll} className="text-blue-700 hover:underline">
          {count === total ? 'Deseleccionar todo' : 'Seleccionar todo'}
        </button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button disabled={busy} onClick={onActivate} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Activar
        </button>
        <button disabled={busy} onClick={onDeactivate} className="bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Desactivar
        </button>
        <button disabled={busy} onClick={onDelete} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1">
          <Trash2 className="w-3 h-3" /> Borrar
        </button>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [barrios, setBarrios] = useState<BarrioItem[]>([])
  const [negocios, setNegocios] = useState<NegocioItem[]>([])
  const [categorias, setCategorias] = useState<CategoriaSimple[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedBarrio, setSelectedBarrio] = useState<BarrioItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<{ barrios: BarrioItem[]; negocios: NegocioItem[] } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Modal: barrio ─────────────────────────────────────────────────────────
  const [isBarrioModalOpen, setIsBarrioModalOpen] = useState(false)
  const [editingBarrio, setEditingBarrio] = useState<BarrioItem | null>(null)
  const [barrioForm, setBarrioForm] = useState({ nombre: '', slug: '', descripcion: '', imagen: '', activo: true })
  const [barrioGeojson, setBarrioGeojson] = useState<Feature<Geometry> | null>(null)
  const [showBarrioMap, setShowBarrioMap] = useState(false)
  const [isSavingBarrio, setIsSavingBarrio] = useState(false)
  const [selectedBarrioIds, setSelectedBarrioIds] = useState<string[]>([])
  const [isBulkBarrioBusy, setIsBulkBarrioBusy] = useState(false)

  // ── Modal: negocio ────────────────────────────────────────────────────────
  const [isNegocioModalOpen, setIsNegocioModalOpen] = useState(false)
  const [editingNegocio, setEditingNegocio] = useState<NegocioItem | null>(null)
  const [negocioForm, setNegocioForm] = useState({
    nombre: '', slug: '', barrioId: '', descripcion: '', direccion: '',
    telefono: '', email: '', web: '', horario: '', imagen: '', activo: true, categoriaIds: [] as string[],
  })
  const [isSavingNegocio, setIsSavingNegocio] = useState(false)
  const [selectedNegocioIds, setSelectedNegocioIds] = useState<string[]>([])
  const [isBulkNegocios, setIsBulkNegocios] = useState(false)

  // ── Import modal ──────────────────────────────────────────────────────────
  const [isImportOpen, setIsImportOpen] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rb, rn, rc] = await Promise.all([
        fetch('/api/admin/barrios'),
        fetch('/api/admin/negocios'),
        fetch('/api/admin/categorias'),
      ])
      if (rb.ok && rn.ok && rc.ok) {
        const [db, dn, dc] = await Promise.all([rb.json(), rn.json(), rc.json()])
        setBarrios(db)
        setNegocios(dn)
        setCategorias(dc)
      }
    } catch { setError('Error de conexión') }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Search live filter ────────────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length < 1) { setSearchResults(null); setSearchOpen(false); return }
    const fb = barrios.filter(b => b.nombre.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q))
    const fn = negocios.filter(n =>
      n.nombre.toLowerCase().includes(q) ||
      n.barrio.nombre.toLowerCase().includes(q) ||
      (n.direccion ?? '').toLowerCase().includes(q)
    )
    setSearchResults({ barrios: fb, negocios: fn })
    setSearchOpen(true)
  }, [searchQuery, barrios, negocios])

  // ── Barrio select from map ─────────────────────────────────────────────────
  const handleMapBarrioClick = (barrioId: string) => {
    const b = barrios.find(b => b.id === barrioId)
    if (!b) return
    if (selectedBarrio?.id === barrioId) {
      setSelectedBarrio(null)
    } else {
      setSelectedBarrio(b)
      setSelectedNegocioIds([])
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }

  // ── Barrio CRUD ───────────────────────────────────────────────────────────
  const openCreateBarrio = () => {
    setEditingBarrio(null)
    setBarrioForm({ nombre: '', slug: '', descripcion: '', imagen: '', activo: true })
    setBarrioGeojson(null); setShowBarrioMap(false)
    setIsBarrioModalOpen(true); setError(''); setSuccess('')
  }
  const openEditBarrio = (b: BarrioItem) => {
    setEditingBarrio(b)
    setBarrioForm({ nombre: b.nombre, slug: b.slug, descripcion: b.descripcion || '', imagen: b.imagen || '', activo: b.activo })
    setBarrioGeojson((b.geojson as Feature<Geometry>) ?? null)
    setShowBarrioMap(false); setIsBarrioModalOpen(true); setError(''); setSuccess('')
  }
  const saveBarrio = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSavingBarrio(true); setError(''); setSuccess('')
    const url = editingBarrio ? `/api/admin/barrios/${editingBarrio.id}` : '/api/admin/barrios'
    const method = editingBarrio ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...barrioForm, geojson: barrioGeojson }) })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Error al guardar'); return }
      setSuccess(editingBarrio ? 'Barrio actualizado' : 'Barrio creado')
      setIsBarrioModalOpen(false); fetchAll()
    } catch { setError('Error de comunicación') } finally { setIsSavingBarrio(false) }
  }
  const deleteBarrio = async (b: BarrioItem) => {
    if (!confirm(`¿Eliminar barrio "${b.nombre}"?`)) return
    const res = await fetch(`/api/admin/barrios/${b.id}`, { method: 'DELETE' })
    const d = await res.json()
    res.ok ? (setSuccess(`Barrio "${b.nombre}" eliminado`), fetchAll()) : setError(d.error || 'Error al eliminar')
  }
  const toggleBarrioActivo = async (b: BarrioItem) => {
    await fetch(`/api/admin/barrios/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, activo: !b.activo }) })
    fetchAll()
    if (selectedBarrio?.id === b.id) setSelectedBarrio(prev => prev ? { ...prev, activo: !prev.activo } : null)
  }
  const bulkBarrios = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!selectedBarrioIds.length) return
    if (action === 'delete' && !confirm(`¿Eliminar ${selectedBarrioIds.length} barrio(s)?`)) return
    setIsBulkBarrioBusy(true)
    const res = await fetch('/api/admin/barrios/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids: selectedBarrioIds }) })
    const d = await res.json()
    res.ok ? (setSuccess(d.message || 'Hecho'), setSelectedBarrioIds([]), fetchAll()) : setError(d.error || 'Error')
    setIsBulkBarrioBusy(false)
  }

  // ── Negocio CRUD ──────────────────────────────────────────────────────────
  const openCreateNegocio = () => {
    setEditingNegocio(null)
    setNegocioForm({ nombre: '', slug: '', barrioId: selectedBarrio?.id || barrios[0]?.id || '', descripcion: '', direccion: '', telefono: '', email: '', web: '', horario: '', imagen: '', activo: true, categoriaIds: [] })
    setIsNegocioModalOpen(true); setError(''); setSuccess('')
  }
  const openEditNegocio = (n: NegocioItem) => {
    setEditingNegocio(n)
    setNegocioForm({ nombre: n.nombre, slug: n.slug, barrioId: n.barrioId, descripcion: n.descripcion || '', direccion: n.direccion || '', telefono: n.telefono || '', email: n.email || '', web: n.web || '', horario: n.horario || '', imagen: n.imagen || '', activo: n.activo, categoriaIds: n.categorias.map(c => c.categoria.id) })
    setIsNegocioModalOpen(true); setError(''); setSuccess('')
  }
  const saveNegocio = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSavingNegocio(true); setError(''); setSuccess('')
    const url = editingNegocio ? `/api/admin/negocios/${editingNegocio.id}` : '/api/admin/negocios'
    const method = editingNegocio ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(negocioForm) })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Error al guardar'); return }
      setSuccess(editingNegocio ? 'Negocio actualizado' : 'Negocio creado')
      setIsNegocioModalOpen(false); fetchAll()
    } catch { setError('Error de comunicación') } finally { setIsSavingNegocio(false) }
  }
  const deleteNegocio = async (n: NegocioItem) => {
    if (!confirm(`¿Eliminar negocio "${n.nombre}"?`)) return
    const res = await fetch(`/api/admin/negocios/${n.id}`, { method: 'DELETE' })
    res.ok ? (setSuccess(`Negocio "${n.nombre}" eliminado`), fetchAll()) : setError('Error al eliminar')
  }
  const toggleNegocioActivo = async (n: NegocioItem) => {
    await fetch(`/api/admin/negocios/${n.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...n, barrioId: n.barrioId, categoriaIds: n.categorias.map(c => c.categoria.id), activo: !n.activo }) })
    fetchAll()
  }
  const bulkNegocios = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!selectedNegocioIds.length) return
    if (action === 'delete' && !confirm(`¿Eliminar ${selectedNegocioIds.length} negocio(s)?`)) return
    setIsBulkNegocios(true)
    const res = await fetch('/api/admin/negocios/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids: selectedNegocioIds }) })
    const d = await res.json()
    res.ok ? (setSuccess(d.message || 'Hecho'), setSelectedNegocioIds([]), fetchAll()) : setError(d.error || 'Error')
    setIsBulkNegocios(false)
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const negociosDelBarrio = selectedBarrio
    ? negocios.filter(n => n.barrioId === selectedBarrio.id)
    : []

  const filteredBarriosPanel = barrios

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Top toolbar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults && setSearchOpen(true)}
              placeholder="Buscar barrios o negocios..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchOpen(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Dropdown results */}
            {searchOpen && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.barrios.length === 0 && searchResults.negocios.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">Sin resultados</div>
                ) : (
                  <>
                    {searchResults.barrios.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-bold uppercase text-gray-400 px-2 pb-1">Barrios</div>
                        {searchResults.barrios.map(b => (
                          <button key={b.id} onClick={() => { setSelectedBarrio(b); setSearchQuery(''); setSearchOpen(false) }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-xs font-semibold text-gray-800 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              {b.nombre}
                            </span>
                            <span className="text-gray-400">{b._count?.negocios || 0} negocios</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.negocios.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <div className="text-[10px] font-bold uppercase text-gray-400 px-2 pb-1">Negocios</div>
                        {searchResults.negocios.map(n => (
                          <button key={n.id} onClick={() => {
                            const b = barrios.find(b => b.id === n.barrioId)
                            if (b) setSelectedBarrio(b)
                            setSearchQuery(''); setSearchOpen(false)
                          }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-xs font-semibold text-gray-800 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Store className="w-3.5 h-3.5 text-gray-400" />
                              {n.nombre}
                            </span>
                            <span className="text-gray-400">{n.barrio.nombre}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Gestionar Categorías */}
          <Link href="/admin/categorias"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors shrink-0">
            <Tags className="w-4 h-4 text-gray-500" />
            Categorías ({categorias.length})
          </Link>
        </div>

        {/* ── Notifications ── */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
            <button onClick={() => setSuccess('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* ── Map + Panel layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* MAP */}
          <div className="h-[420px] lg:h-[580px] rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Cargando…
              </div>
            ) : (
              <AdminBarriosMap
                barrios={barrios}
                selectedBarrioId={selectedBarrio?.id ?? null}
                onBarrioClick={handleMapBarrioClick}
              />
            )}
          </div>

          {/* SIDE PANEL */}
          <div ref={panelRef} className="space-y-3">
            {selectedBarrio ? (
              /* ── NEGOCIOS del barrio seleccionado ── */
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={() => setSelectedBarrio(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-1">
                      ← Todos los barrios
                    </button>
                    <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-sevilla-carmesi" />
                      {selectedBarrio.nombre}
                    </h2>
                    <p className="text-xs text-gray-500">{negociosDelBarrio.length} negocio(s) · {selectedBarrio.activo ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditBarrio(selectedBarrio)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Editar barrio">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={openCreateNegocio}
                      className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Crear negocio
                    </button>
                  </div>
                </div>

                {/* Bulk bar negocios */}
                <BulkBar count={selectedNegocioIds.length} total={negociosDelBarrio.length}
                  onSelectAll={() => selectedNegocioIds.length === negociosDelBarrio.length ? setSelectedNegocioIds([]) : setSelectedNegocioIds(negociosDelBarrio.map(n => n.id))}
                  onActivate={() => bulkNegocios('activate')} onDeactivate={() => bulkNegocios('deactivate')}
                  onDelete={() => bulkNegocios('delete')} busy={isBulkNegocios} />

                {/* Negocio list */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-h-[440px] overflow-y-auto">
                  {negociosDelBarrio.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">
                      <Store className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                      Sin negocios en este barrio
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {/* Select all header */}
                      <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                        <input type="checkbox"
                          checked={negociosDelBarrio.length > 0 && selectedNegocioIds.length === negociosDelBarrio.length}
                          onChange={() => selectedNegocioIds.length === negociosDelBarrio.length ? setSelectedNegocioIds([]) : setSelectedNegocioIds(negociosDelBarrio.map(n => n.id))}
                          className="w-3.5 h-3.5 text-sevilla-carmesi rounded" />
                        <span className="text-[11px] text-gray-400 font-semibold uppercase">Negocio</span>
                      </div>
                      {negociosDelBarrio.map(n => (
                        <div key={n.id} className={`px-4 py-3 flex items-center gap-3 hover:bg-amber-50/30 transition-colors ${selectedNegocioIds.includes(n.id) ? 'bg-amber-50/50' : ''}`}>
                          <input type="checkbox" checked={selectedNegocioIds.includes(n.id)}
                            onChange={() => setSelectedNegocioIds(prev => prev.includes(n.id) ? prev.filter(id => id !== n.id) : [...prev, n.id])}
                            className="w-3.5 h-3.5 text-sevilla-carmesi rounded shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate">{n.nombre}</div>
                            {n.direccion && <div className="text-xs text-gray-400 truncate">{n.direccion}</div>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => toggleNegocioActivo(n)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${n.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                              {n.activo ? 'Activo' : 'Inact.'}
                            </button>
                            <button onClick={() => openEditNegocio(n)} className="p-1 rounded hover:bg-blue-50 text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteNegocio(n)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── LISTA DE BARRIOS ── */
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-sevilla-carmesi" />
                    Barrios <span className="text-sm font-normal text-gray-400">({barrios.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsImportOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 transition-colors">
                      <Upload className="w-3.5 h-3.5" /> GeoJSON
                    </button>
                    <button onClick={openCreateBarrio}
                      className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Crear barrio
                    </button>
                  </div>
                </div>

                {/* Bulk bar barrios */}
                <BulkBar count={selectedBarrioIds.length} total={filteredBarriosPanel.length}
                  onSelectAll={() => selectedBarrioIds.length === filteredBarriosPanel.length ? setSelectedBarrioIds([]) : setSelectedBarrioIds(filteredBarriosPanel.map(b => b.id))}
                  onActivate={() => bulkBarrios('activate')} onDeactivate={() => bulkBarrios('deactivate')}
                  onDelete={() => bulkBarrios('delete')} busy={isBulkBarrioBusy} />

                {/* Barrios list */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-h-[480px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" /> Cargando barrios…
                    </div>
                  ) : barrios.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">Sin barrios registrados</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {/* Select all */}
                      <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                        <input type="checkbox"
                          checked={filteredBarriosPanel.length > 0 && selectedBarrioIds.length === filteredBarriosPanel.length}
                          onChange={() => selectedBarrioIds.length === filteredBarriosPanel.length ? setSelectedBarrioIds([]) : setSelectedBarrioIds(filteredBarriosPanel.map(b => b.id))}
                          className="w-3.5 h-3.5 text-sevilla-carmesi rounded" />
                        <span className="text-[11px] text-gray-400 font-semibold uppercase">Barrio</span>
                      </div>
                      {filteredBarriosPanel.map(b => (
                        <div key={b.id} className={`px-4 py-3 flex items-center gap-3 hover:bg-amber-50/30 transition-colors ${selectedBarrioIds.includes(b.id) ? 'bg-amber-50/50' : ''}`}>
                          <input type="checkbox" checked={selectedBarrioIds.includes(b.id)}
                            onChange={() => setSelectedBarrioIds(prev => prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id])}
                            className="w-3.5 h-3.5 text-sevilla-carmesi rounded shrink-0" />
                          <button onClick={() => setSelectedBarrio(b)} className="flex-1 min-w-0 text-left">
                            <div className="font-semibold text-sm text-gray-900">{b.nombre}</div>
                            <div className="text-xs text-gray-400">{b._count?.negocios || 0} negocios</div>
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => toggleBarrioActivo(b)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${b.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                              {b.activo ? 'Activo' : 'Inact.'}
                            </button>
                            <button onClick={() => openEditBarrio(b)} className="p-1 rounded hover:bg-blue-50 text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteBarrio(b)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setSelectedBarrio(b)} className="p-1 rounded hover:bg-amber-50 text-amber-500" title="Ver negocios">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Modal: Barrio ── */}
        {isBarrioModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">{editingBarrio ? 'Editar Barrio' : 'Crear Barrio'}</h3>
                <button onClick={() => setIsBarrioModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
              <form onSubmit={saveBarrio} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Nombre *</label>
                  <input type="text" required value={barrioForm.nombre}
                    onChange={e => setBarrioForm(p => ({ ...p, nombre: e.target.value, slug: !editingBarrio ? slugify(e.target.value) : p.slug }))}
                    placeholder="Ej. Triana" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Slug</label>
                  <input type="text" value={barrioForm.slug}
                    onChange={e => setBarrioForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Descripción</label>
                  <textarea rows={3} value={barrioForm.descripcion} onChange={e => setBarrioForm(p => ({ ...p, descripcion: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">URL Imagen</label>
                  <input type="url" value={barrioForm.imagen} onChange={e => setBarrioForm(p => ({ ...p, imagen: e.target.value }))}
                    placeholder="https://..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Área en el Mapa</label>
                    <button type="button" onClick={() => setShowBarrioMap(v => !v)}
                      className="text-xs font-bold text-blue-600 hover:underline">{showBarrioMap ? 'Ocultar' : barrioGeojson ? 'Editar área' : 'Dibujar área'}</button>
                  </div>
                  {showBarrioMap && <BarrioMapDrawer key={editingBarrio?.id ?? 'new'} value={barrioGeojson} onChange={setBarrioGeojson} height={400} />}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="barrioActivo" checked={barrioForm.activo} onChange={e => setBarrioForm(p => ({ ...p, activo: e.target.checked }))} className="w-4 h-4 text-sevilla-carmesi rounded" />
                  <label htmlFor="barrioActivo" className="text-xs font-bold text-gray-800">Barrio Activo</label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsBarrioModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900">Cancelar</button>
                  <button type="submit" disabled={isSavingBarrio} className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-50">
                    {isSavingBarrio && <Loader2 className="w-4 h-4 animate-spin" />} {editingBarrio ? 'Guardar cambios' : 'Crear barrio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Negocio ── */}
        {isNegocioModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">{editingNegocio ? 'Editar Negocio' : 'Crear Negocio'}</h3>
                <button onClick={() => setIsNegocioModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
              <form onSubmit={saveNegocio} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Nombre *</label>
                    <input type="text" required value={negocioForm.nombre}
                      onChange={e => setNegocioForm(p => ({ ...p, nombre: e.target.value, slug: !editingNegocio ? slugify(e.target.value) : p.slug }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Slug</label>
                    <input type="text" value={negocioForm.slug} onChange={e => setNegocioForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Barrio *</label>
                    <select value={negocioForm.barrioId} onChange={e => setNegocioForm(p => ({ ...p, barrioId: e.target.value }))} required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white">
                      <option value="">— Seleccionar —</option>
                      {barrios.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                  </div>
                </div>
                {[['Descripción', 'descripcion', 'textarea'], ['Dirección', 'direccion', 'text'], ['Teléfono', 'telefono', 'tel'], ['Email', 'email', 'email'], ['Web', 'web', 'url'], ['Horario', 'horario', 'text'], ['URL Imagen', 'imagen', 'url']].map(([label, key, type]) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">{label}</label>
                    {type === 'textarea'
                      ? <textarea rows={3} value={(negocioForm as unknown as Record<string, string>)[key]} onChange={e => setNegocioForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                      : <input type={type} value={(negocioForm as unknown as Record<string, string>)[key]} onChange={e => setNegocioForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white" />
                    }
                  </div>
                ))}
                {categorias.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Categorías</label>
                    <div className="flex flex-wrap gap-2">
                      {categorias.map(c => (
                        <button key={c.id} type="button"
                          onClick={() => setNegocioForm(p => ({ ...p, categoriaIds: p.categoriaIds.includes(c.id) ? p.categoriaIds.filter(id => id !== c.id) : [...p.categoriaIds, c.id] }))}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${negocioForm.categoriaIds.includes(c.id) ? 'bg-sevilla-carmesi text-white border-sevilla-carmesi' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                          {c.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="negActivo" checked={negocioForm.activo} onChange={e => setNegocioForm(p => ({ ...p, activo: e.target.checked }))} className="w-4 h-4 text-sevilla-carmesi rounded" />
                  <label htmlFor="negActivo" className="text-xs font-bold text-gray-800">Negocio Activo</label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsNegocioModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900">Cancelar</button>
                  <button type="submit" disabled={isSavingNegocio} className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-50">
                    {isSavingNegocio && <Loader2 className="w-4 h-4 animate-spin" />} {editingNegocio ? 'Guardar cambios' : 'Crear negocio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Import Modal ── */}
        <BarrioImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)}
          onSuccess={() => { setSuccess('Importación completada'); fetchAll() }} />
      </div>
    </AdminLayout>
  )
}
