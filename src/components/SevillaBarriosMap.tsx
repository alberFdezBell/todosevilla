'use client'

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Mapa de Sevilla con los barrios definidos en la BD.
 * - Posición inicial: Ciudad de Sevilla encuadrada en primer plano (zoom 12.5).
 * - Altura predeterminada más amplia (680px).
 * - Máscara invertida (zIndex 460): tapa las imágenes del mapa Y las etiquetas
 *   de lugares/fronteras fuera de la provincia de Sevilla.
 * - Bloqueo rígido ("pared"): impide que la cámara se desplace fuera de la provincia.
 * - Muestra nombre del barrio y nº de negocios al pasar el ratón.
 * - Al hacer clic en un barrio, navega a la página del barrio (/sevilla/[slug]).
 */

type BarrioProps = { id: string; nombre: string; slug: string; negocios: number } & Record<string, unknown>;
type BarrioFeature = Feature<Geometry, BarrioProps>;

export type BaseLayerId = "esri" | "pnoa" | "osm";

export interface SevillaBarriosMapProps {
  geojsonUrl?: string;
  baseLayer?: BaseLayerId;
  height?: number | string;
  className?: string;
}

export const BARRIOS_API_URL = "/api/barrios/geojson";
export const PROVINCE_GEOJSON_URL = "/sevilla-province.json";

const SEVILLA_CENTER: Leaflet.LatLngTuple = [37.3886, -5.9823];

// Estilo del contorno de la provincia de Sevilla
const PROVINCE_STYLE: Leaflet.PathOptions = {
  color: "#f3d044",
  weight: 2,
  opacity: 0.9,
  fill: false,
};

// Estilo de la máscara para tapar 100% opaco todo lo que está fuera de la provincia de Sevilla
const MASK_STYLE: Leaflet.PathOptions = {
  stroke: false,
  fillColor: "#0f172a",
  fillOpacity: 1.0,
  interactive: false,
};

// Estilo base de los barrios
const BASE_STYLE: Leaflet.PathOptions = {
  color: "#f3d044",
  weight: 1.8,
  opacity: 0.9,
  fillColor: "#ff0000",
  fillOpacity: 0.25,
};

const HOVER_STYLE: Leaflet.PathOptions = {
  color: "#ffd400",
  weight: 3.5,
  opacity: 1,
  fillColor: "#ffd400",
  fillOpacity: 0.38,
};

interface Info {
  name: string;
  slug: string;
  negocios: number;
}

/** Construye una máscara GeoJSON (un polígono mundial con un hueco recortado con la provincia) */
function createInvertedMask(provinceFeature: Feature<Geometry>): FeatureCollection<Geometry> {
  const outerRing: [number, number][] = [
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
    [-180, 90],
  ];

  if (provinceFeature.geometry.type === "Polygon") {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [outerRing, ...provinceFeature.geometry.coordinates],
          } as Polygon,
          properties: {},
        },
      ],
    };
  } else if (provinceFeature.geometry.type === "MultiPolygon") {
    const features: Feature<Geometry>[] = provinceFeature.geometry.coordinates.map((polyCoords) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [outerRing, ...polyCoords],
      } as Polygon,
      properties: {},
    }));
    return { type: "FeatureCollection", features };
  }

  return { type: "FeatureCollection", features: [] };
}

export default function SevillaBarriosMap({
  geojsonUrl = BARRIOS_API_URL,
  baseLayer = "esri",
  height = 680,
  className,
}: SevillaBarriosMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const controller = new AbortController();
    let disposed = false;
    let map: Leaflet.Map | undefined;

    (async () => {
      const mod = await import("leaflet");
      const L: typeof Leaflet = (mod as { default?: typeof Leaflet }).default ?? mod;
      if (disposed) return;

      // Encuadre inicial en la ciudad de Sevilla (zoom 11)
      map = L.map(el, {
        center: SEVILLA_CENTER,
        zoom: 11,
        minZoom: 9,
        maxZoom: 18,
        zoomControl: true,
        maxBoundsViscosity: 1.0,
        bounceAtZoomLimits: false,
      });

      // --- Capas base ---
      const esri = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution: "Imágenes &copy; Esri, Maxar",
        },
      );
      const pnoa = L.tileLayer(
        "https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0" +
          "&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg" +
          "&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileCol={x}&TileRow={y}",
        {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution: "PNOA &copy; Instituto Geográfico Nacional",
        },
      );
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        maxNativeZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });

      // Pane para las etiquetas de nombres de lugares
      const labelsPane = map.createPane("labels");
      labelsPane.style.zIndex = "450";
      labelsPane.style.pointerEvents = "none";
      const labels = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { pane: "labels", maxZoom: 20, maxNativeZoom: 19 },
      );

      // Pane para la Máscara (zIndex 460) -> Estará POR ENCIMA de labels (450)
      const maskPane = map.createPane("maskPane");
      maskPane.style.zIndex = "460";
      maskPane.style.pointerEvents = "none";

      // Pane para los Barrios (zIndex 500) -> Estará por encima de la máscara
      const barriosPane = map.createPane("barriosPane");
      barriosPane.style.zIndex = "500";

      const bases: Record<BaseLayerId, Leaflet.TileLayer> = { esri, pnoa, osm };
      bases[baseLayer].addTo(map);
      if (baseLayer !== "osm") labels.addTo(map);

      const layersControl = L.control
        .layers(
          {
            "Satélite (Esri)": esri,
            "Satélite PNOA (IGN)": pnoa,
            "Callejero (OpenStreetMap)": osm,
          },
          { "Nombres de calles y lugares": labels },
          { position: "bottomright" },
        )
        .addTo(map);

      // --- Cargar Provincia de Sevilla y Máscara ---
      try {
        const [provRes, barriosRes] = await Promise.all([
          fetch(PROVINCE_GEOJSON_URL, { signal: controller.signal }).catch(() => null),
          fetch(geojsonUrl, { signal: controller.signal }),
        ]);

        if (disposed || !map) return;

        if (provRes && provRes.ok) {
          const provGeoJson = (await provRes.json()) as Feature<Geometry>;
          
          // 1. Aplicar Máscara en maskPane (tapa imágenes Y nombres/fronteras fuera de Sevilla)
          const maskGeoJson = createInvertedMask(provGeoJson);
          L.geoJSON(maskGeoJson, {
            pane: "maskPane",
            style: MASK_STYLE,
            interactive: false,
          }).addTo(map);

          // 2. Dibujar línea de la frontera de Sevilla
          const provLayer = L.geoJSON(provGeoJson, {
            pane: "maskPane",
            style: PROVINCE_STYLE,
            interactive: false,
          }).addTo(map);
          
          // 3. Bloqueo estricto ("Pared"): fija límites sin padding y detiene el arrastre inmediatamente
          const provBounds = provLayer.getBounds();
          if (provBounds.isValid()) {
            map.setMaxBounds(provBounds);

            // En cada movimiento de arrastre, bloqueamos de forma síncrona sin animación
            map.on("drag", () => {
              map?.panInsideBounds(provBounds, { animate: false });
            });
          }
        }

        // --- Cargar Barrios de la BD ---
        if (!barriosRes.ok) throw new Error(`HTTP ${barriosRes.status} al cargar barrios`);

        const data = (await barriosRes.json()) as FeatureCollection<Geometry, BarrioProps>;
        if (!data.features?.length) {
          setStatus("empty");
          return;
        }

        const infos = new Map<Leaflet.Path, Info>();
        let hovered: Leaflet.Path | null = null;

        const geo: Leaflet.GeoJSON<BarrioProps> = L.geoJSON<BarrioProps>(data, {
          pane: "barriosPane",
          style: () => BASE_STYLE,
          bubblingMouseEvents: false,
          onEachFeature: (feature: BarrioFeature, layer) => {
            const path = layer as Leaflet.Path;
            const nombre = feature.properties?.nombre ?? "Barrio";
            const slug = feature.properties?.slug ?? "";
            const negocios = feature.properties?.negocios ?? 0;
            const entry: Info = { name: nombre, slug, negocios };
            infos.set(path, entry);

            const labelText = `${nombre} (${negocios} ${negocios === 1 ? 'negocio' : 'negocios'})`;
            path.bindTooltip(labelText, {
              sticky: true,
              direction: "top",
              className: "custom-barrio-tooltip",
            });

            path.on({
              mouseover: () => {
                if (hovered && hovered !== path) geo.resetStyle(hovered);
                hovered = path;
                path.setStyle(HOVER_STYLE);
                path.bringToFront();
                setInfo(entry);
              },
              mouseout: () => {
                geo.resetStyle(path);
                if (hovered === path) hovered = null;
                setInfo(null);
              },
              click: () => {
                if (slug) {
                  router.push(`/sevilla/${slug}`);
                }
              },
            });
          },
        }).addTo(map);

        layersControl.addOverlay(geo, "Barrios");

        // Encuadre en la ciudad de Sevilla con distancia adecuada
        const bounds = geo.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12.5 });
        } else {
          map.setView(SEVILLA_CENTER, 11);
        }

        setStatus("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setErrorMsg((err as Error).message);
        setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      controller.abort();
      map?.remove();
    };
  }, [geojsonUrl, baseLayer, router]);

  return (
    <div className={className} style={{ position: "relative", height, width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%", cursor: "pointer", backgroundColor: "#0f172a" }} />

      {/* Info Floating Panel */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          maxWidth: "min(320px, 65%)",
          padding: "10px 16px",
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          fontFamily: "system-ui, sans-serif",
          pointerEvents: "none",
        }}
      >
        {status === "loading" && <span className="text-xs text-gray-600 font-semibold">Cargando mapa de Sevilla…</span>}
        {status === "error" && <span className="text-xs text-red-600 font-semibold">Error: {errorMsg}</span>}
        {status === "empty" && <span className="text-xs text-gray-500 font-semibold">Aún no hay barrios con área definida</span>}
        {status === "ready" && (
          info ? (
            <div className="space-y-0.5">
              <div className="font-extrabold text-gray-900 text-sm">{info.name}</div>
              <div className="text-xs font-semibold text-gray-600">
                {info.negocios} {info.negocios === 1 ? 'negocio registrado' : 'negocios registrados'}
              </div>
              <div className="text-[11px] font-bold text-amber-700 pt-0.5">
                Haz clic para explorar el barrio →
              </div>
            </div>
          ) : (
            <span className="text-xs font-semibold text-gray-500">Pasa el ratón o haz clic sobre un barrio</span>
          )
        )}
      </div>
    </div>
  );
}
