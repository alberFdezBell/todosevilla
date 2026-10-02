'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { Store, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Loader2, MapPin } from 'lucide-react'
import { slugify } from '@/lib/utils'

interface BarrioSimple {
  id: string
  nombre: string
  slug: string
}

interface CategoriaSimple {
  id: string
  nombre: string
  slug: string
}

interface NegocioItem {
  id: string
  nombre: string
  slug: string
  barrioId: string
  barrio: BarrioSimple
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

export default function AdminNegociosPage() {
  const [negocios, setNegocios] = useState<NegocioItem[]>([])
  const [barrios, setBarrios] = useState<BarrioSimple[]>([])
  const [categorias, setCategorias] = useState<CategoriaSimple[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNegocio, setEditingNegocio] = useState<NegocioItem | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    barrioId: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    email: '',
    web: '',
    horario: '',
    imagen: '',
    activo: true,
    categoriaIds: [] as string[],
  })
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [resN, resB, resC] = await Promise.all([
        fetch('/api/admin/negocios'),
        fetch('/api/admin/barrios'),
        fetch('/api/admin/categorias'),
      ])

      if (resN.ok && resB.ok && resC.ok) {
        const [dataN, dataB, dataC] = await Promise.all([resN.json(), resB.json(), resC.json()])
        setNegocios(dataN)
        setBarrios(dataB)
        setCategorias(dataC)
      } else {
        setError('Error al cargar datos desde la API')
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditingNegocio(null)
    setFormData({
      nombre: '',
      slug: '',
      barrioId: barrios[0]?.id || '',
      descripcion: '',
      direccion: '',
      telefono: '',
      email: '',
      web: '',
      horario: '',
      imagen: '',
      activo: true,
      categoriaIds: [],
    })
    setIsModalOpen(true)
    setError('')
    setSuccess('')
  }

  const handleOpenEdit = (negocio: NegocioItem) => {
    setEditingNegocio(negocio)
    setFormData({
      nombre: negocio.nombre,
      slug: negocio.slug,
      barrioId: negocio.barrioId,
      descripcion: negocio.descripcion || '',
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      email: negocio.email || '',
      web: negocio.web || '',
      horario: negocio.horario || '',
      imagen: negocio.imagen || '',
      activo: negocio.activo,
      categoriaIds: negocio.categorias.map((c) => c.categoria.id),
    })
    setIsModalOpen(true)
    setError('')
    setSuccess('')
  }

  const handleNombreChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      nombre: val,
      slug: !editingNegocio ? slugify(val) : prev.slug,
    }))
  }

  const handleCategoryToggle = (catId: string) => {
    setFormData((prev) => {
      const exists = prev.categoriaIds.includes(catId)
      return {
        ...prev,
        categoriaIds: exists
          ? prev.categoriaIds.filter((id) => id !== catId)
          : [...prev.categoriaIds, catId],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      setError('El nombre del negocio es obligatorio')
      return
    }
    if (!formData.barrioId) {
      setError('Debe seleccionar un barrio')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    const url = editingNegocio ? `/api/admin/negocios/${editingNegocio.id}` : '/api/admin/negocios'
    const method = editingNegocio ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar el negocio')
        return
      }

      setSuccess(editingNegocio ? 'Negocio actualizado correctamente' : 'Negocio creado correctamente')
      setIsModalOpen(false)
      fetchData()
    } catch {
      setError('Error de comunicación con el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (negocio: NegocioItem) => {
    if (!confirm(`¿Estás seguro de eliminar el negocio "${negocio.nombre}"?`)) return

    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/negocios/${negocio.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSuccess(`Negocio "${negocio.nombre}" eliminado correctamente`)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Error al eliminar el negocio')
      }
    } catch {
      setError('Error al comunicarse con la API')
    }
  }

  const handleToggleActivo = async (negocio: NegocioItem) => {
    try {
      const res = await fetch(`/api/admin/negocios/${negocio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: negocio.nombre,
          slug: negocio.slug,
          barrioId: negocio.barrioId,
          descripcion: negocio.descripcion,
          direccion: negocio.direccion,
          telefono: negocio.telefono,
          email: negocio.email,
          web: negocio.web,
          horario: negocio.horario,
          imagen: negocio.imagen,
          activo: !negocio.activo,
          categoriaIds: negocio.categorias.map((c) => c.categoria.id),
        }),
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      setError('Error al cambiar el estado del negocio')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Store className="w-8 h-8 text-sevilla-albero-dark" />
              Gestión de Negocios
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Administra las fichas de comercios y profesionales en Sevilla
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Negocio</span>
          </button>
        </div>

        {/* Global Messages */}
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

        {/* Negocios Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-sevilla-carmesi" />
              <span className="text-xs font-semibold">Cargando negocios...</span>
            </div>
          ) : negocios.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay negocios registrados. Haz clic en &quot;+ Crear Nuevo Negocio&quot; para añadir uno.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                    <th className="p-4">Negocio</th>
                    <th className="p-4">Barrio</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800 font-medium">
                  {negocios.map((n) => (
                    <tr key={n.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm">{n.nombre}</div>
                        <div className="text-[11px] text-gray-400 font-mono">/sevilla/{n.barrio.slug}/{n.slug}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          <MapPin className="w-3 h-3 text-sevilla-carmesi" />
                          {n.barrio.nombre}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {n.telefono && <div>Tel: {n.telefono}</div>}
                        {n.direccion && <div className="text-[11px] text-gray-500 truncate max-w-xs">{n.direccion}</div>}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActivo(n)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            n.activo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {n.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(n)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar negocio"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(n)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar negocio"
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
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingNegocio ? 'Editar Negocio' : 'Crear Nuevo Negocio'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Nombre del Negocio *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => handleNombreChange(e.target.value)}
                      placeholder="Ej. Bar El Comercio"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Barrio *
                    </label>
                    <select
                      required
                      value={formData.barrioId}
                      onChange={(e) => setFormData({ ...formData, barrioId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    >
                      <option value="">-- Seleccionar barrio --</option>
                      {barrios.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                    placeholder="bar-el-comercio"
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
                    placeholder="Descripción detallada del negocio..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Calle Sierpes 10"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="954001122"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contacto@ejemplo.es"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Web (URL)
                    </label>
                    <input
                      type="url"
                      value={formData.web}
                      onChange={(e) => setFormData({ ...formData, web: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Horario
                    </label>
                    <input
                      type="text"
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      placeholder="Lunes a Sábado: 09:00 - 21:00"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Imagen / Logo (URL)
                    </label>
                    <input
                      type="url"
                      value={formData.imagen}
                      onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sevilla-carmesi focus:bg-white"
                    />
                  </div>
                </div>

                {/* Categories Assignment */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Asignar Categorías
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categorias.map((c) => {
                      const isSelected = formData.categoriaIds.includes(c.id)
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => handleCategoryToggle(c.id)}
                          className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-sevilla-carmesi text-white border-sevilla-carmesi font-bold'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {c.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="negocioActivo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-sevilla-carmesi rounded focus:ring-sevilla-carmesi"
                  />
                  <label htmlFor="negocioActivo" className="text-xs font-bold text-gray-800">
                    Negocio Activo (visible públicamente)
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
                    <span>{editingNegocio ? 'Guardar Cambios' : 'Crear Negocio'}</span>
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
