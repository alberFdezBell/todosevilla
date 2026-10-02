'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { Tags, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { slugify } from '@/lib/utils'

interface CategoriaItem {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  icono: string | null
  activa: boolean
  _count?: { negocios: number }
}

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaItem | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    icono: '',
    activa: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  const fetchCategorias = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/categorias')
      if (res.ok) {
        const data = await res.json()
        setCategorias(data)
      } else {
        setError('Error al cargar categorías')
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const handleOpenCreate = () => {
    setEditingCategoria(null)
    setFormData({ nombre: '', slug: '', descripcion: '', icono: '', activa: true })
    setIsModalOpen(true)
    setError('')
    setSuccess('')
  }

  const handleOpenEdit = (cat: CategoriaItem) => {
    setEditingCategoria(cat)
    setFormData({
      nombre: cat.nombre,
      slug: cat.slug,
      descripcion: cat.descripcion || '',
      icono: cat.icono || '',
      activa: cat.activa,
    })
    setIsModalOpen(true)
    setError('')
    setSuccess('')
  }

  const handleNombreChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      nombre: val,
      slug: !editingCategoria ? slugify(val) : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    const url = editingCategoria ? `/api/admin/categorias/${editingCategoria.id}` : '/api/admin/categorias'
    const method = editingCategoria ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar la categoría')
        return
      }

      setSuccess(editingCategoria ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente')
      setIsModalOpen(false)
      fetchCategorias()
    } catch {
      setError('Error de comunicación con el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (cat: CategoriaItem) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"?`)) return

    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/categorias/${cat.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSuccess(`Categoría "${cat.nombre}" eliminada correctamente`)
        fetchCategorias()
      } else {
        const data = await res.json()
        setError(data.error || 'Error al eliminar categoría')
      }
    } catch {
      setError('Error al comunicarse con la API')
    }
  }

  const handleToggleActiva = async (cat: CategoriaItem) => {
    try {
      const res = await fetch(`/api/admin/categorias/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: cat.nombre,
          slug: cat.slug,
          descripcion: cat.descripcion,
          icono: cat.icono,
          activa: !cat.activa,
        }),
      })

      if (res.ok) {
        fetchCategorias()
      }
    } catch {
      setError('Error al cambiar el estado de la categoría')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Tags className="w-8 h-8 text-sevilla-carmesi" />
              Gestión de Categorías
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Organiza los negocios por áreas de actividad (Restauración, Servicios, etc.)
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nueva Categoría</span>
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

        {/* Categorías Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-sevilla-carmesi" />
              <span className="text-xs font-semibold">Cargando categorías...</span>
            </div>
          ) : categorias.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay categorías registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4 text-center">Negocios Vinculados</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800 font-medium">
                  {categorias.map((c) => (
                    <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-4 font-bold text-gray-900 text-sm">
                        {c.nombre}
                        {c.descripcion && (
                          <div className="text-xs text-gray-500 font-normal line-clamp-1">{c.descripcion}</div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs text-amber-900 bg-amber-50/50 px-2 py-1 rounded inline-block my-3">
                        {c.slug}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded-full text-xs">
                          {c._count?.negocios || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActiva(c)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            c.activa
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {c.activa ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar categoría"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar categoría"
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

        {/* Modal Create/Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}
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
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    placeholder="Ej. Restaurantes y Bares"
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
                    placeholder="restaurantes-y-bares"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción opcional..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="w-4 h-4 text-sevilla-carmesi rounded focus:ring-sevilla-carmesi"
                  />
                  <label htmlFor="activa" className="text-xs font-bold text-gray-800">
                    Categoría Activa
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
                    <span>{editingCategoria ? 'Guardar Cambios' : 'Crear Categoría'}</span>
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
