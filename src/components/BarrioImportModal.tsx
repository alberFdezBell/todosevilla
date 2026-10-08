'use client'

import { useState } from 'react'
import {
  Upload,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  FileCheck2,
  Check,
  Ban,
  Layers,
  MapPin,
} from 'lucide-react'
import type { Feature, Geometry } from 'geojson'

export interface ImportItem {
  id: string
  index: number
  nombre: string
  slug: string
  feature: Feature<Geometry>
  existingBarrioId: string | null
  existingBarrioNombre: string | null
  conflicts: { id: string; nombre: string; slug: string }[]
  hasConflict: boolean
  approved: boolean
}

interface BarrioImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BarrioImportModal({ isOpen, onClose, onSuccess }: BarrioImportModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<object | null>(null)
  const [fileName, setFileName] = useState<string>('')
  
  const [isChecking, setIsChecking] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  
  const [items, setItems] = useState<ImportItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [conflictsCount, setConflictsCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'all' | 'conflicts' | 'clean'>('all')

  if (!isOpen) return null

  const resetModal = () => {
    setStep('upload')
    setFile(null)
    setFileContent(null)
    setFileName('')
    setIsChecking(false)
    setIsImporting(false)
    setError('')
    setItems([])
    setTotalCount(0)
    setConflictsCount(0)
    setActiveTab('all')
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  // Cargar archivo local subido por el usuario
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFileName(selectedFile.name)
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        setFileContent(parsed)
      } catch {
        setError('El archivo seleccionado no es un JSON/GeoJSON válido.')
        setFileContent(null)
      }
    }
    reader.readAsText(selectedFile)
  }

  // Acción rápida: Cargar public/barrios_sevilla.geojson directamente
  const handleLoadPresetFile = async () => {
    setError('')
    setIsChecking(true)
    setFileName('public/barrios_sevilla.geojson')

    try {
      const res = await fetch('/barrios_sevilla.geojson')
      if (!res.ok) {
        throw new Error('No se pudo cargar el archivo public/barrios_sevilla.geojson')
      }
      const parsed = await res.json()
      setFileContent(parsed)
      await analyzeGeoJSON(parsed)
    } catch (err) {
      setError((err as Error).message || 'Error al cargar el archivo predeterminado')
      setIsChecking(false)
    }
  }

  // Enviar el GeoJSON al servidor para analizar choques/solapamientos
  const analyzeGeoJSON = async (contentToAnalyze?: object) => {
    const targetGeoJSON = contentToAnalyze || fileContent
    if (!targetGeoJSON) {
      setError('Por favor selecciona o carga un archivo GeoJSON válido.')
      return
    }

    setIsChecking(true)
    setError('')

    try {
      const res = await fetch('/api/admin/barrios/check-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geojson: targetGeoJSON }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al analizar el archivo GeoJSON.')
        return
      }

      setItems(data.items || [])
      setTotalCount(data.total || 0)
      setConflictsCount(data.conflictsCount || 0)
      setStep('review')
    } catch {
      setError('Error de comunicación con el servidor al verificar choques.')
    } finally {
      setIsChecking(false)
    }
  }

  // Alternar aprobación individual de un área
  const toggleApproval = (itemId: string, approved: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, approved } : item))
    )
  }

  // Acciones en lote
  const handleApproveAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, approved: true })))
  }

  const handleApproveCleanOnly = () => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, approved: !item.hasConflict }))
    )
  }

  const handleDenyConflicts = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.hasConflict ? { ...item, approved: false } : item
      )
    )
  }

  // Confirmar e importar áreas seleccionadas en BD
  const handleConfirmImport = async () => {
    const approvedItems = items.filter((item) => item.approved)
    if (approvedItems.length === 0) {
      setError('No hay ningún área aprobada para importar.')
      return
    }

    setIsImporting(true)
    setError('')

    try {
      const payload = approvedItems.map((item) => ({
        nombre: item.nombre,
        slug: item.slug,
        feature: item.feature,
        existingBarrioId: item.existingBarrioId,
      }))

      const res = await fetch('/api/admin/barrios/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar las áreas en la base de datos.')
        return
      }

      onSuccess()
      handleClose()
    } catch {
      setError('Error de conexión al procesar la importación.')
    } finally {
      setIsImporting(false)
    }
  }

  // Filtrado de la lista en la pestaña activa
  const filteredItems = items.filter((item) => {
    if (activeTab === 'conflicts') return item.hasConflict
    if (activeTab === 'clean') return !item.hasConflict
    return true
  })

  const approvedCount = items.filter((i) => i.approved).length

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gray-900 to-black text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sevilla-carmesi rounded-xl">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Importación de Áreas GeoJSON
              </h2>
              <p className="text-xs text-gray-300">
                Detecta y gestiona automáticamente los solapamientos con las áreas actuales
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'upload' ? (
            /* STEP 1: UPLOAD FILE */
            <div className="space-y-6 py-4">
              <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center bg-gray-50 hover:bg-amber-50/30 hover:border-sevilla-carmesi/40 transition-all flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-white rounded-2xl shadow-xs border border-gray-200">
                  <Upload className="w-8 h-8 text-sevilla-carmesi" />
                </div>
                <div>
                  <label htmlFor="geojson-file-input" className="cursor-pointer text-sm font-extrabold text-sevilla-carmesi hover:underline">
                    Selecciona un archivo GeoJSON
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Formatos admitidos: .geojson, .json (FeatureCollection o Feature)
                  </p>
                </div>
                <input
                  id="geojson-file-input"
                  type="file"
                  accept=".geojson,.json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-xs">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span>{fileName}</span>
                  </div>
                )}
              </div>

              {/* Botón directo de Preset para public/barrios_sevilla.geojson */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <FileCheck2 className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>
                    ¿Quieres usar el archivo oficial predeterminado <strong>public/barrios_sevilla.geojson</strong>?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadPresetFile}
                  disabled={isChecking}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-2 disabled:opacity-50"
                >
                  {isChecking && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Cargar barrios_sevilla.geojson</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: REVIEW & APPROVE/DENY CONFLICTS */
            <div className="space-y-6">
              {/* Summary Stats Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Encontradas</div>
                    <div className="text-2xl font-black text-gray-900 mt-0.5">{totalCount} áreas</div>
                  </div>
                  <Layers className="w-6 h-6 text-gray-400" />
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  conflictsCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Con Solapamientos</div>
                    <div className="text-2xl font-black mt-0.5">{conflictsCount} áreas</div>
                  </div>
                  <AlertTriangle className={`w-6 h-6 ${conflictsCount > 0 ? 'text-amber-600' : 'text-emerald-500'}`} />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between text-blue-900">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Aprobadas para Importar</div>
                    <div className="text-2xl font-black mt-0.5">{approvedCount} de {totalCount}</div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              {/* Batch Quick Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 px-1">Acciones rápidas:</span>
                  <button
                    onClick={handleApproveAll}
                    className="text-xs font-bold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aprobar Todas</span>
                  </button>
                  <button
                    onClick={handleApproveCleanOnly}
                    className="text-xs font-bold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Aprobar solo sin choques</span>
                  </button>
                  <button
                    onClick={handleDenyConflicts}
                    className="text-xs font-bold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5 text-red-600" />
                    <span>Denegar conflictivas</span>
                  </button>
                </div>
              </div>

              {/* Tab Filters */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    activeTab === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Todas ({items.length})
                </button>
                <button
                  onClick={() => setActiveTab('conflicts')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                    activeTab === 'conflicts'
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Con choques ({items.filter((i) => i.hasConflict).length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('clean')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                    activeTab === 'clean'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sin choques ({items.filter((i) => !i.hasConflict).length})</span>
                </button>
              </div>

              {/* Review Items List */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs font-semibold">
                    No hay áreas en esta pestaña.
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        !item.approved
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : item.hasConflict
                          ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                          : 'bg-white border-gray-200 shadow-2xs hover:border-blue-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-gray-900 text-sm">
                            {item.nombre}
                          </span>
                          <span className="font-mono text-[11px] text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded font-bold">
                            {item.slug}
                          </span>

                          {item.existingBarrioId && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                              Barrio existente en BD
                            </span>
                          )}
                        </div>

                        {/* Detalle de Conflictos de Solapamiento */}
                        {item.hasConflict ? (
                          <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 pt-1">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>¡Solapamiento detectado!</strong> Choca espacialmente con:{' '}
                              <u className="decoration-amber-500">{item.conflicts.map((c) => c.nombre).join(', ')}</u>
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Geometría limpia (sin solapamientos con las áreas actuales)</span>
                          </div>
                        )}
                      </div>

                      {/* Approval / Denial Switch */}
                      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => toggleApproval(item.id, true)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                            item.approved
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleApproval(item.id, false)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                            !item.approved
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Denegar</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
          {step === 'upload' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => analyzeGeoJSON()}
                disabled={!fileContent || isChecking}
                className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-colors"
              >
                {isChecking && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Analizar y Verificar Choques</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                ← Seleccionar otro archivo
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={approvedCount === 0 || isImporting}
                className="bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-colors"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Importar {approvedCount} área(s) seleccionadas</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
