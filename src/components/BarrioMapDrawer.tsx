'use client'

import { useEffect, useRef, useState } from 'react'
import type { Feature, Geometry } from 'geojson'
import { simplify } from '@turf/turf'
import { MapPin, MousePointerClick, Sparkles, RotateCcw } from 'lucide-react'
import { countGeoJsonVertices } from '@/lib/geo-utils'

// Estos imports de CSS solo se ejecutan en el navegador porque el componente
// siempre se carga con next/dynamic + ssr:false desde el padre.
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

export interface BarrioMapDrawerProps {
  value: Feature<Geometry> | null
  onChange: (feature: Feature<Geometry> | null) => void
  height?: number | string
}

const SEVILLA_CENTER: [number, number] = [37.3886, -5.9823]

export default function BarrioMapDrawer({
  value,
  onChange,
  height = 400,
}: BarrioMapDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  
  // Refs de estado de Leaflet
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const mapRef = useRef<import('leaflet').Map | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const drawnItemsRef = useRef<import('leaflet').FeatureGroup | null>(null)
  const activeLayerRef = useRef<any>(null)

  // Estados UI
  const [vertexCount, setVertexCount] = useState<number>(() => countGeoJsonVertices(value))
  const [initialVertexCount, setInitialVertexCount] = useState<number>(() => countGeoJsonVertices(value))
  const [isEditingVertices, setIsEditingVertices] = useState(false)
  const [showSmoothMenu, setShowSmoothMenu] = useState(false)
  const [originalGeojson, setOriginalGeojson] = useState<Feature<Geometry> | null>(null)
  const [toleranceSlider, setToleranceSlider] = useState<number>(0.0003)

  // Actualizar el número de vértices cuando cambie la prop 'value'
  useEffect(() => {
    const cnt = countGeoJsonVertices(value)
    setVertexCount(cnt)
    if (!originalGeojson && value) {
      setInitialVertexCount(cnt)
    }
  }, [value, originalGeojson])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let disposed = false

    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet-draw')

      if (disposed) return

      LRef.current = L

      // ── Mapa base ────────────────────────────────────────────────────
      const map = L.map(el, { center: SEVILLA_CENTER, zoom: 13 })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      setTimeout(() => map.invalidateSize(), 0)
      setTimeout(() => map.invalidateSize(), 250)

      // ── FeatureGroup gestionado por leaflet-draw ─────────────────────
      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)
      drawnItemsRef.current = drawnItems

      let activeLayer: any = null

      const attachLayerEvents = (layer: any) => {
        // Evento cuando se arrastra o modifica un vértice del polígono
        layer.on('edit', () => {
          const geo = layer.toGeoJSON()
          onChangeRef.current(geo)
          setVertexCount(countGeoJsonVertices(geo))
        })
      }

      // ── Cargar polígono previo si existe ─────────────────────────────
      if (value) {
        const geo = L.geoJSON(value, {
          style: { color: '#b91c1c', weight: 2.5, fillOpacity: 0.18 },
        })
        geo.eachLayer((l: any) => {
          drawnItems.addLayer(l)
          activeLayer = l
          attachLayerEvents(l)
        })
        activeLayerRef.current = activeLayer

        const bounds = (geo as import('leaflet').GeoJSON).getBounds()
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32] })
      }

      // ── Control de dibujo ────────────────────────────────────────────
      const drawControl = new (L.Control as any).Draw({
        edit: { featureGroup: drawnItems },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: { color: '#b91c1c', weight: 2.5, fillOpacity: 0.18 },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
        },
      })
      map.addControl(drawControl)

      // ── Eventos Leaflet Draw ─────────────────────────────────────────

      // Nuevo polígono dibujado — reemplaza el anterior
      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        if (activeLayerRef.current) drawnItems.removeLayer(activeLayerRef.current)
        activeLayer = e.layer
        activeLayerRef.current = e.layer
        drawnItems.addLayer(e.layer)
        attachLayerEvents(e.layer)

        const geo = e.layer.toGeoJSON()
        onChangeRef.current(geo)
        setVertexCount(countGeoJsonVertices(geo))
        setInitialVertexCount(countGeoJsonVertices(geo))
        setOriginalGeojson(null)
      })

      // Polígono editado a través de la barra Leaflet Draw
      map.on((L as any).Draw.Event.EDITED, (e: any) => {
        e.layers.eachLayer((layer: any) => {
          activeLayerRef.current = layer
          const geo = layer.toGeoJSON()
          onChangeRef.current(geo)
          setVertexCount(countGeoJsonVertices(geo))
        })
      })

      // Polígono borrado
      map.on((L as any).Draw.Event.DELETED, () => {
        activeLayerRef.current = null
        onChangeRef.current(null)
        setVertexCount(0)
        setInitialVertexCount(0)
        setOriginalGeojson(null)
        setIsEditingVertices(false)
      })
    })()

    // Limpieza
    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Activar / Desactivar edición directa de vértices
  const toggleEditMode = () => {
    const layer = activeLayerRef.current
    if (!layer || !layer.editing) return

    if (isEditingVertices) {
      layer.editing.disable()
      setIsEditingVertices(false)
    } else {
      layer.editing.enable()
      setIsEditingVertices(true)
    }
  }

  // Simplificar / Suavizar el polígono usando algoritmo Douglas-Peucker de Turf
  const handleSimplify = (tolerance: number) => {
    if (!value) return

    // Guardar el original si no se ha guardado ya
    if (!originalGeojson) {
      setOriginalGeojson(value)
      setInitialVertexCount(countGeoJsonVertices(value))
    }

    try {
      const source = originalGeojson || value
      const simplified = simplify(source, {
        tolerance,
        highQuality: true,
        mutate: false,
      }) as Feature<Geometry>

      const newCount = countGeoJsonVertices(simplified)
      if (newCount < 3) {
        alert('El nivel de suavizado seleccionado es demasiado alto para esta forma. Elige una opción más suave.')
        return
      }

      // Reemplazar la capa en el mapa de Leaflet
      if (drawnItemsRef.current && LRef.current) {
        const L = LRef.current
        const drawnItems = drawnItemsRef.current

        drawnItems.clearLayers()

        const geoLayer = L.geoJSON(simplified, {
          style: { color: '#b91c1c', weight: 2.5, fillOpacity: 0.18 },
        })

        let newActive: any = null
        geoLayer.eachLayer((l: any) => {
          drawnItems.addLayer(l)
          newActive = l
          l.on('edit', () => {
            const updatedGeo = l.toGeoJSON()
            onChangeRef.current(updatedGeo)
            setVertexCount(countGeoJsonVertices(updatedGeo))
          })
        })

        activeLayerRef.current = newActive

        // Si estaba en modo edición de vértices, re-activarlo en la nueva capa
        if (isEditingVertices && newActive?.editing) {
          newActive.editing.enable()
        }
      }

      onChangeRef.current(simplified)
      setVertexCount(newCount)
      setShowSmoothMenu(false)
    } catch (err) {
      console.error('Error al suavizar el polígono:', err)
    }
  }

  // Restablecer al GeoJSON original antes de suavizar
  const handleRestoreOriginal = () => {
    if (!originalGeojson) return

    if (drawnItemsRef.current && LRef.current) {
      const L = LRef.current
      const drawnItems = drawnItemsRef.current

      drawnItems.clearLayers()

      const geoLayer = L.geoJSON(originalGeojson, {
        style: { color: '#b91c1c', weight: 2.5, fillOpacity: 0.18 },
      })

      let newActive: any = null
      geoLayer.eachLayer((l: any) => {
        drawnItems.addLayer(l)
        newActive = l
        l.on('edit', () => {
          const updatedGeo = l.toGeoJSON()
          onChangeRef.current(updatedGeo)
          setVertexCount(countGeoJsonVertices(updatedGeo))
        })
      })

      activeLayerRef.current = newActive

      if (isEditingVertices && newActive?.editing) {
        newActive.editing.enable()
      }
    }

    onChangeRef.current(originalGeojson)
    setVertexCount(countGeoJsonVertices(originalGeojson))
    setOriginalGeojson(null)
  }

  return (
    <div className="space-y-2 relative">
      {/* Barra de Herramientas superior de Edición y Suavizado */}
      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs relative z-[1001]">
        {/* Contador de Puntos */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sevilla-carmesi" />
            {vertexCount > 0 ? (
              <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 font-mono text-[11px] text-gray-800 shadow-2xs">
                {vertexCount} puntos
              </span>
            ) : (
              <span className="text-gray-400 font-normal">Sin área definida</span>
            )}
          </span>

          {initialVertexCount > 0 && vertexCount !== initialVertexCount && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              {vertexCount < initialVertexCount
                ? `Reducido un ${Math.round(((initialVertexCount - vertexCount) / initialVertexCount) * 100)}%`
                : `Original: ${initialVertexCount} pts`}
            </span>
          )}
        </div>

        {/* Botones de Acción */}
        {value && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Activar/Desactivar Edición de Puntos */}
            <button
              type="button"
              onClick={toggleEditMode}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                isEditingVertices
                  ? 'bg-amber-600 text-white hover:bg-amber-700 ring-2 ring-amber-300'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
              title="Muestra los puntos blancos en el mapa. Haz clic sobre uno para ELIMINARLO."
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>{isEditingVertices ? 'Ocultar puntos' : 'Modo Editar / Eliminar puntos'}</span>
            </button>

            {/* Menú de Suavizado / Reducción */}
            <div className="relative z-[1002]">
              <button
                type="button"
                onClick={() => setShowSmoothMenu((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sevilla-carmesi text-white hover:bg-sevilla-carmesi-dark transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suavizar puntos</span>
              </button>

              {/* Panel Desplegable de Suavizado */}
              {showSmoothMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-[2500] bg-white border border-gray-200 rounded-xl shadow-2xl p-3.5 w-72 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-900 text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Suavizar área (Reducir puntos)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSmoothMenu(false)}
                      className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-tight">
                    Elimina picos e imperfecciones en la frontera para facilitar la edición manual.
                  </p>

                  {/* Niveles Rápidos */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Nivel recomendado:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSimplify(0.0001)}
                        className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-200 transition-colors text-center"
                      >
                        Leve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimplify(0.0003)}
                        className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-300 transition-colors text-center"
                      >
                        Medio
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimplify(0.0008)}
                        className="px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors text-center"
                      >
                        Fuerte
                      </button>
                    </div>
                  </div>

                  {/* Deslizador Personalizado */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-[11px] text-gray-700 font-semibold">
                      <span>Ajuste fino:</span>
                      <span className="font-mono text-sevilla-carmesi">{toleranceSlider}</span>
                    </div>
                    <input
                      type="range"
                      min="0.00005"
                      max="0.001"
                      step="0.00005"
                      value={toleranceSlider}
                      onChange={(e) => setToleranceSlider(parseFloat(e.target.value))}
                      onMouseUp={() => handleSimplify(toleranceSlider)}
                      onTouchEnd={() => handleSimplify(toleranceSlider)}
                      className="w-full accent-sevilla-carmesi cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Más detallado</span>
                      <span>Más esquemático</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Restablecer Original */}
            {originalGeojson && (
              <button
                type="button"
                onClick={handleRestoreOriginal}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Restablecer el área original antes de suavizar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Banner de Ayuda de Edición de Puntos */}
      {isEditingVertices && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] px-3 py-2 rounded-xl flex items-center justify-between font-medium shadow-2xs">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>Modo edición activo:</strong> Haz clic en cualquier punto blanco para <u>ELIMINARLO</u>. Arrastra los puntos para mover la frontera.
            </span>
          </span>
        </div>
      )}

      {/* Contenedor del Mapa */}
      <div
        ref={containerRef}
        style={{ width: '100%', height }}
        className="rounded-xl overflow-hidden border border-gray-200"
      />
      <p className="text-[11px] text-gray-400 leading-snug px-0.5">
        Usa el icono <strong className="text-gray-600">polígono</strong> de la barra del mapa para dibujar el área del barrio. Haz clic en &quot;Modo Editar / Eliminar puntos&quot; para borrar o ajustar vértices individualmente.
      </p>
    </div>
  )
}
