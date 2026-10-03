'use client'

import { useEffect, useRef } from 'react'
import type { Feature, Geometry } from 'geojson'
// Estos imports de CSS solo se ejecutan en el navegador porque el componente
// siempre se carga con next/dynamic + ssr:false desde el padre.
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

/**
 * Mini-mapa Leaflet con herramienta de dibujo de polígonos.
 *
 * SIEMPRE importar este componente con:
 *   const BarrioMapDrawer = dynamic(() => import('./BarrioMapDrawer'), { ssr: false })
 *
 * Características:
 * - Solo un polígono a la vez; dibujar uno nuevo reemplaza el anterior.
 * - Si se pasa `value` con un Feature ya guardado, lo muestra y permite editarlo.
 * - Se destruye y re-crea limpiamente cada vez que el componente se monta
 *   (útil cuando está dentro de un modal que se abre/cierra).
 */

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
  // Ref para el callback — evita re-crear el mapa cuando onChange cambia de referencia
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let map: import('leaflet').Map | undefined
    let disposed = false

    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet-draw')

      if (disposed) return

      // ── Mapa base ────────────────────────────────────────────────────
      map = L.map(el, { center: SEVILLA_CENTER, zoom: 13 })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // El mapa puede tener tamaño 0 al montarse dentro de un flex/modal.
      // Dos llamadas escalonadas garantizan que se recalcula correctamente.
      setTimeout(() => map?.invalidateSize(), 0)
      setTimeout(() => map?.invalidateSize(), 250)

      // ── FeatureGroup gestionado por leaflet-draw ─────────────────────
      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)

      // Referencia a la layer activa (la que está en drawnItems)
      let activeLayer: import('leaflet').Layer | null = null

      // ── Cargar polígono previo si existe ─────────────────────────────
      if (value) {
        const geo = L.geoJSON(value, {
          style: { color: '#b91c1c', weight: 2.5, fillOpacity: 0.18 },
        })
        // Añadimos cada layer individual al featureGroup (no el wrapper)
        geo.eachLayer((l) => {
          drawnItems.addLayer(l)
          activeLayer = l
        })
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
          polyline:     false,
          rectangle:    false,
          circle:       false,
          circlemarker: false,
          marker:       false,
        },
      })
      map.addControl(drawControl)

      // ── Eventos ──────────────────────────────────────────────────────

      // Nuevo polígono dibujado — reemplaza el anterior
      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        if (activeLayer) drawnItems.removeLayer(activeLayer)
        activeLayer = e.layer
        drawnItems.addLayer(e.layer)
        onChangeRef.current((e.layer as any).toGeoJSON())
      })

      // Polígono editado
      map.on((L as any).Draw.Event.EDITED, (e: any) => {
        e.layers.eachLayer((layer: any) => {
          activeLayer = layer
          onChangeRef.current(layer.toGeoJSON())
        })
      })

      // Polígono borrado
      map.on((L as any).Draw.Event.DELETED, () => {
        activeLayer = null
        onChangeRef.current(null)
      })
    })()

    // Limpieza: destruir el mapa al desmontar (modal cerrado)
    return () => {
      disposed = true
      map?.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1.5">
      <div
        ref={containerRef}
        style={{ width: '100%', height }}
        className="rounded-xl overflow-hidden border border-gray-200"
      />
      <p className="text-[11px] text-gray-400 leading-snug px-0.5">
        Usa el icono <strong className="text-gray-600">polígono</strong> de la barra del mapa para dibujar el área del barrio.
        Con el resto de botones puedes editarla o borrarla.
      </p>
    </div>
  )
}
