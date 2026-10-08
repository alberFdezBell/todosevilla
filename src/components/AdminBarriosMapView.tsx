'use client'

import { useEffect, useRef, useState } from 'react'
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type BaseLayerId = 'esri' | 'pnoa' | 'osm'

export interface BarrioItem {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagen: string | null
  geojson: object | null
  activo: boolean
  _count?: { negocios: number }
}

export interface AdminBarriosMapViewProps {
  barrios: BarrioItem[]
  selectedBarrioId: string | null
  onBarrioClick: (barrioId: string) => void
  baseLayer?: BaseLayerId
}

export const PROVINCE_GEOJSON_URL = '/sevilla-province.json'
const SEVILLA_CENTER: Leaflet.LatLngTuple = [37.3886, -5.9823]

// Estilo del contorno de la provincia de Sevilla
const PROVINCE_STYLE: Leaflet.PathOptions = {
  color: '#f3d044',
  weight: 2,
  opacity: 0.9,
  fill: false,
}

// Estilo de la máscara para tapar 100% opaco todo lo que está fuera de la provincia de Sevilla
const MASK_STYLE: Leaflet.PathOptions = {
  stroke: false,
  fillColor: '#0f172a',
  fillOpacity: 1.0,
  interactive: false,
}

// Estilo base de los barrios ACTIVOS (color normal)
const ACTIVE_STYLE: Leaflet.PathOptions = {
  color: '#f3d044',
  weight: 1.8,
  opacity: 0.9,
  fillColor: '#ff0000',
  fillOpacity: 0.25,
}

// Estilo de los barrios INACTIVOS (desactivados en gris)
const INACTIVE_STYLE: Leaflet.PathOptions = {
  color: '#64748b',
  weight: 1.8,
  opacity: 0.7,
  fillColor: '#94a3b8',
  fillOpacity: 0.35,
}

// Estilo de barrio SELECCIONADO al hacer clic
const SELECTED_STYLE: Leaflet.PathOptions = {
  color: '#dc2626',
  weight: 3.5,
  opacity: 1,
  fillColor: '#facc15',
  fillOpacity: 0.5,
}

const HOVER_ACTIVE_STYLE: Leaflet.PathOptions = {
  color: '#ffd400',
  weight: 3.5,
  opacity: 1,
  fillColor: '#ffd400',
  fillOpacity: 0.4,
}

const HOVER_INACTIVE_STYLE: Leaflet.PathOptions = {
  color: '#475569',
  weight: 3,
  opacity: 0.9,
  fillColor: '#64748b',
  fillOpacity: 0.45,
}

/** Construye una máscara GeoJSON (un polígono mundial con un hueco recortado con la provincia) */
function createInvertedMask(provinceFeature: Feature<Geometry>): FeatureCollection<Geometry> {
  const outerRing: [number, number][] = [
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
    [-180, 90],
  ]

  if (provinceFeature.geometry.type === 'Polygon') {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [outerRing, ...provinceFeature.geometry.coordinates],
          } as Polygon,
          properties: {},
        },
      ],
    }
  } else if (provinceFeature.geometry.type === 'MultiPolygon') {
    const features: Feature<Geometry>[] = provinceFeature.geometry.coordinates.map((polyCoords) => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [outerRing, ...polyCoords],
      } as Polygon,
      properties: {},
    }))
    return { type: 'FeatureCollection', features }
  }

  return { type: 'FeatureCollection', features: [] }
}

/** Parsea y normaliza cualquier GeoJSON (objeto o string) de la BD */
function parseGeoJSON(raw: unknown): Feature<Geometry> | FeatureCollection<Geometry> | Geometry | null {
  if (!raw) return null
  let obj = raw
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (typeof obj !== 'object' || obj === null) return null
  return obj as Feature<Geometry> | FeatureCollection<Geometry> | Geometry
}

export default function AdminBarriosMapView({
  barrios,
  selectedBarrioId,
  onBarrioClick,
  baseLayer = 'esri',
}: AdminBarriosMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mapInstance, setMapInstance] = useState<Leaflet.Map | null>(null)
  const barrioFeatureGroupRef = useRef<Leaflet.FeatureGroup | null>(null)
  const barrioLayersMapRef = useRef<Map<string, Leaflet.GeoJSON>>(new Map())
  const prevSelectedIdRef = useRef<string | null>(selectedBarrioId)

  const onBarrioClickRef = useRef(onBarrioClick)
  onBarrioClickRef.current = onBarrioClick

  // 1. Inicializar el mapa de Leaflet
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let disposed = false
    let map: Leaflet.Map | undefined

    ;(async () => {
      const mod = await import('leaflet')
      const L: typeof Leaflet = (mod as { default?: typeof Leaflet }).default ?? mod
      if (disposed) return

      map = L.map(el, {
        center: SEVILLA_CENTER,
        zoom: 11,
        minZoom: 9,
        maxZoom: 18,
        zoomControl: true,
        maxBoundsViscosity: 1.0,
        bounceAtZoomLimits: false,
      })

      // Capas base (Satélite Esri, PNOA, OSM)
      const esri = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 20, maxNativeZoom: 19, attribution: 'Imágenes &copy; Esri, Maxar' }
      )
      const pnoa = L.tileLayer(
        'https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0' +
          '&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg' +
          '&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileCol={x}&TileRow={y}',
        { maxZoom: 20, maxNativeZoom: 19, attribution: 'PNOA &copy; IGN' }
      )
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        maxNativeZoom: 19,
        attribution: '&copy; OpenStreetMap',
      })

      // Pane para etiquetas de calles y lugares
      const labelsPane = map.createPane('labels')
      labelsPane.style.zIndex = '450'
      labelsPane.style.pointerEvents = 'none'
      const labels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { pane: 'labels', maxZoom: 20, maxNativeZoom: 19 }
      )

      // Pane para Máscara de Sevilla (zIndex 460)
      const maskPane = map.createPane('maskPane')
      maskPane.style.zIndex = '460'
      maskPane.style.pointerEvents = 'none'

      // Pane para Barrios (zIndex 500)
      const barriosPane = map.createPane('barriosPane')
      barriosPane.style.zIndex = '500'

      const bases: Record<BaseLayerId, Leaflet.TileLayer> = { esri, pnoa, osm }
      bases[baseLayer].addTo(map)
      if (baseLayer !== 'osm') labels.addTo(map)

      L.control
        .layers(
          {
            'Satélite (Esri)': esri,
            'Satélite PNOA (IGN)': pnoa,
            'Callejero (OpenStreetMap)': osm,
          },
          { 'Nombres de calles y lugares': labels },
          { position: 'bottomright' }
        )
        .addTo(map)

      // Cargar contorno y máscara de la provincia de Sevilla
      try {
        const provRes = await fetch(PROVINCE_GEOJSON_URL).catch(() => null)
        if (disposed || !map) return

        if (provRes && provRes.ok) {
          const provGeoJson = (await provRes.json()) as Feature<Geometry>

          // 1. Aplicar Máscara en maskPane (tapa áreas fuera de Sevilla)
          const maskGeoJson = createInvertedMask(provGeoJson)
          L.geoJSON(maskGeoJson, {
            pane: 'maskPane',
            style: MASK_STYLE,
            interactive: false,
          }).addTo(map)

          // 2. Frontera de la provincia
          const provLayer = L.geoJSON(provGeoJson, {
            pane: 'maskPane',
            style: PROVINCE_STYLE,
            interactive: false,
          }).addTo(map)

          // 3. Límite de arrastre rígido ("pared")
          const provBounds = provLayer.getBounds()
          if (provBounds.isValid()) {
            map.setMaxBounds(provBounds)
            map.on('drag', () => {
              map?.panInsideBounds(provBounds, { animate: false })
            })
          }
        }
      } catch {
        // Ignorar si falla la provincia
      }

      // FeatureGroup donde se añadirán/limpiarán los barrios
      const barrioGroup = L.featureGroup([], { pane: 'barriosPane' }).addTo(map)
      barrioFeatureGroupRef.current = barrioGroup

      setMapInstance(map)
    })()

    return () => {
      disposed = true
      setMapInstance(null)
      map?.remove()
    }
  }, [baseLayer])

  // 2. Dibujar y actualizar los barrios en el mapa
  useEffect(() => {
    if (!mapInstance || !barrioFeatureGroupRef.current) return

    let disposed = false

    ;(async () => {
      const mod = await import('leaflet')
      const L: typeof Leaflet = (mod as { default?: typeof Leaflet }).default ?? mod
      if (disposed || !mapInstance || !barrioFeatureGroupRef.current) return

      const barrioGroup = barrioFeatureGroupRef.current
      barrioGroup.clearLayers()
      barrioLayersMapRef.current.clear()

      // ORDENACIÓN PARA CAPAS: Inactivos primero (abajo), Activos después (arriba)
      // Esto garantiza que el amarillo de los activos tape a los grises en caso de solapamiento.
      const sortedBarrios = [...barrios].sort((a, b) => {
        if (a.activo === b.activo) return 0
        return a.activo ? 1 : -1
      })

      sortedBarrios.forEach((barrio) => {
        const parsedGeo = parseGeoJSON(barrio.geojson)
        if (!parsedGeo) return

        try {
          const isSelected = selectedBarrioId === barrio.id

          // Determinar estilo base: Seleccionado -> Highlight, Activo -> Normal, Inactivo -> Gris
          const style = isSelected
            ? SELECTED_STYLE
            : barrio.activo
            ? ACTIVE_STYLE
            : INACTIVE_STYLE

          const geoLayer = L.geoJSON(parsedGeo, {
            pane: 'barriosPane',
            style: () => style,
            bubblingMouseEvents: false,
            onEachFeature: (_, layer) => {
              const path = layer as Leaflet.Path

              const estadoLabel = barrio.activo ? 'Activo' : 'Inactivo'
              const labelText = `${barrio.nombre} (${barrio._count?.negocios ?? 0} negocios · ${estadoLabel})`

              path.bindTooltip(labelText, {
                sticky: true,
                direction: 'top',
                className: 'custom-barrio-tooltip',
              })

              path.on({
                click: () => {
                  onBarrioClickRef.current(barrio.id)
                },
                mouseover: () => {
                  if (selectedBarrioId !== barrio.id) {
                    path.setStyle(barrio.activo ? HOVER_ACTIVE_STYLE : HOVER_INACTIVE_STYLE)
                  }
                  path.bringToFront()
                },
                mouseout: () => {
                  if (selectedBarrioId !== barrio.id) {
                    path.setStyle(barrio.activo ? ACTIVE_STYLE : INACTIVE_STYLE)
                  }
                },
              })
            },
          })

          barrioGroup.addLayer(geoLayer)
          barrioLayersMapRef.current.set(barrio.id, geoLayer)

          // Si este barrio está activo, nos aseguramos de que sus capas queden por encima
          if (barrio.activo) {
            geoLayer.eachLayer((l) => {
              if ('bringToFront' in l) (l as Leaflet.Path).bringToFront()
            })
          }
        } catch (err) {
          console.error(`Error rendering barrio ${barrio.nombre}:`, err)
        }
      })

      // El barrio seleccionado SIEMPRE queda en primerísima plana por encima de todos
      if (selectedBarrioId) {
        const selectedGeoLayer = barrioLayersMapRef.current.get(selectedBarrioId)
        if (selectedGeoLayer) {
          selectedGeoLayer.eachLayer((l) => {
            if ('bringToFront' in l) (l as Leaflet.Path).bringToFront()
          })
        }
      }

      // ── ZOOM SUAVE AL SELECCIONAR / DESELECCIONAR ──
      const isSelectionChanged = prevSelectedIdRef.current !== selectedBarrioId
      prevSelectedIdRef.current = selectedBarrioId

      if (isSelectionChanged) {
        if (selectedBarrioId) {
          // Volar suavemente al barrio seleccionado
          const selectedGeoLayer = barrioLayersMapRef.current.get(selectedBarrioId)
          if (selectedGeoLayer) {
            const bounds = selectedGeoLayer.getBounds()
            if (bounds.isValid()) {
              mapInstance.flyToBounds(bounds, {
                padding: [50, 50],
                maxZoom: 14.5,
                duration: 0.8,
              })
            }
          }
        } else {
          // Al deseleccionar ("salir"), volver suavemente a ver todos los barrios
          const allBounds = barrioGroup.getBounds()
          if (allBounds.isValid()) {
            mapInstance.flyToBounds(allBounds, {
              padding: [40, 40],
              maxZoom: 12.5,
              duration: 0.8,
            })
          } else {
            mapInstance.flyTo(SEVILLA_CENTER, 11, { duration: 0.8 })
          }
        }
      }
    })()

    return () => {
      disposed = true
    }
  }, [mapInstance, barrios, selectedBarrioId])

  return (
    <div style={{ position: 'relative', zIndex: 0, height: '100%', width: '100%' }}>
      <style>{`
        /* Eliminar el borde/cuadro negro de foco al hacer clic en los polígonos */
        .leaflet-container path,
        .leaflet-container path:focus,
        .leaflet-container path:focus-visible,
        .leaflet-interactive,
        .leaflet-interactive:focus,
        .leaflet-interactive:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%', cursor: 'pointer', backgroundColor: '#0f172a' }}
      />
    </div>
  )
}
