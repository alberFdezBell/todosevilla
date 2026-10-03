'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AdminLayout } from '@/components/AdminLayout'
import { Building2, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Loader2, Map } from 'lucide-react'
import { slugify } from '@/lib/utils'
import type { Feature, Geometry } from 'geojson'

// next/dynamic con ssr:false garantiza que Leaflet nunca se evalúa en el servidor
const BarrioMapDrawer = dynamic(() => import('@/components/BarrioMapDrawer'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 text-gray-400 text-sm">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando mapa…
    </div>
  ),
})

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

export default function AdminBarriosPage() {
  const [barrios, setBarrios] = useState<BarrioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBarrio, setEditingBarrio] = useState<BarrioItem | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    imagen: '',
    activo: true,
  })
  const [geojson, setGeojson] = useState<Feature<Geometry> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const fetchBarrios = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/barrios')
      if (res.ok) {
        const data = await res.json()
        setBarrios(data)
      } else {
        setError('Error al cargar la lista de barrios')
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBarrios()
  }, [])

  const handleOpenCreate = () => {
    setEditingBarrio(null)
    setFormData({ nombre: '', slug: '', descripcion: '', imagen: '', activo: true })
    setGeojson(null)
    setShowMap(false)
    setIsModalOpen(true)
    setError('')
    setSuccess('')
  }

  const handleOpenEdit = (barrio: BarrioItem) => {
    setEditingBarrio(barrio)
    setFormData({
      nombre: barrio.nombre,
      slug: barrio.slug,
      descripcion: barrio.descripcion || '',
      imagen: barrio.imagen || '',
      activo: barrio.activo,
    })
    setGeojson((barrio.geojson as Feature<Geometry>) ?? null)
    setShowMap(false)
    setIsModalOpen(true)
    setError('')
    setSuccess('')
  }

  const handleNombreChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      nombre: val,
      slug: !editingBarrio ? slugify(val) : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    const url = editingBarrio ? `/api/admin/barrios/${editingBarrio.id}` : '/api/admin/barrios'
    const method = editingBarrio ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, geojson }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar el barrio')
        return
      }

      setSuccess(editingBarrio ? 'Barrio actualizado correctamente' : 'Barrio creado correctamente')
      setIsModalOpen(false)
      fetchBarrios()
    } catch {
      setError('Error de comunicación con el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (barrio: BarrioItem) => {
    if (!confirm(`¿Estás seguro de eliminar el barrio "${barrio.nombre}"?`)) return

    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/barrios/${barrio.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo eliminar el barrio')
        return
      }

      setSuccess(`Barrio "${barrio.nombre}" eliminado con éxito`)
      fetchBarrios()
    } catch {
      setError('Error al eliminar el barrio')
    }
  }

  const handleToggleActivo = async (barrio: BarrioItem) => {
    try {
      const res = await fetch(`/api/admin/barrios/${barrio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: barrio.nombre,
          slug: barrio.slug,
          descripcion: barrio.descripcion,
          imagen: barrio.imagen,
          geojson: barrio.geojson,
          activo: !barrio.activo,
        }),
      })

      if (res.ok) {
        fetchBarrios()
      }
    } catch {
      setError('Error al cambiar el estado del barrio')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-sevilla-carmesi" />
              Gestión de Barrios
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Crea, edita y administra los barrios de Sevilla
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Barrio</span>
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Barrios Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-sevilla-carmesi" />
              <span className="text-xs font-semibold">Cargando barrios...</span>
            </div>
          ) : barrios.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay barrios registrados todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                    <th className="p-4">Barrio</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4 text-center">Mapa</th>
                    <th className="p-4 text-center">Negocios</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800 font-medium">
                  {barrios.map((b) => (
                    <tr key={b.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm">{b.nombre}</div>
                        {b.descripcion && (
                          <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{b.descripcion}</div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs text-amber-900 bg-amber-50/50 px-2 py-1 rounded inline-block my-3">
                        {b.slug}
                      </td>
                      <td className="p-4 text-center">
                        {b.geojson ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            <Map className="w-3 h-3" /> Definido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            Sin área
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded-full text-xs">
                          {b._count?.negocios || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActivo(b)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            b.activo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {b.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar barrio"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar barrio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingBarrio ? 'Editar Barrio' : 'Crear Nuevo Barrio'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Nombre del Barrio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    placeholder="Ej. Triana"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Slug (URL amigable)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                    placeholder="triana"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Breve descripción del barrio..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    URL de la Imagen (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.imagen}
                    onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                  />
                </div>

                {/* ── Sección de mapa ── */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Área del Barrio en el Mapa
                    </label>
                    <div className="flex items-center gap-2">
                      {geojson && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                          ✓ Área definida
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowMap((v) => !v)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 underline underline-offset-2"
                      >
                        <Map className="w-3.5 h-3.5" />
                        {showMap ? 'Ocultar mapa' : geojson ? 'Editar área' : 'Dibujar área'}
                      </button>
                    </div>
                  </div>

                  {showMap && (
                    <BarrioMapDrawer
                      key={editingBarrio?.id ?? 'new'}
                      value={geojson}
                      onChange={(feat) => setGeojson(feat)}
                      height={400}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-sevilla-carmesi rounded focus:ring-sevilla-carmesi"
                  />
                  <label htmlFor="activo" className="text-xs font-bold text-gray-800">
                    Barrio Activo (visible en la web pública)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingBarrio ? 'Guardar Cambios' : 'Crear Barrio'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
