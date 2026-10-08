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
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    (window as unknown as { __navigateToBarrio?: (slug: string) => void }).__navigateToBarrio = (slug: string) => {
      if (slug) router.push(`/sevilla/${slug}`);
    };
  }, [router]);

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

            const labelText = `${nombre} (${negocios} ${negocios === 1 ? 'negocio' : 'negocios'})`;
            path.bindTooltip(labelText, {
              sticky: true,
              direction: "top",
              className: "custom-barrio-tooltip",
            });

            const popupContent = `
              <div style="padding: 10px 12px 6px 12px; text-align: center; font-family: system-ui, -apple-system, sans-serif; min-width: 210px;">
                <h3 style="margin: 0 0 4px 0; font-size: 1.2rem; font-weight: 800; color: #0f172a; line-height: 1.25;">
                  ${nombre}
                </h3>
                <p style="margin: 0 0 14px 0; font-size: 0.875rem; font-weight: 600; color: #64748b;">
                  ${negocios} ${negocios === 1 ? 'negocio registrado' : 'negocios registrados'}
                </p>
                <a href="/sevilla/${slug}" onclick="event.preventDefault(); window.__navigateToBarrio && window.__navigateToBarrio('${slug}');" class="barrio-ver-mas-btn" style="color: #000000 !important;">
                  Ver más
                </a>
              </div>
            `;

            path.bindPopup(popupContent, {
              className: "custom-barrio-popup",
              closeButton: true,
              maxWidth: 280,
              minWidth: 210,
              autoPan: true,
              autoPanPadding: [30, 30],
            });

            path.on({
              mouseover: () => {
                if (hovered && hovered !== path) geo.resetStyle(hovered);
                hovered = path;
                path.setStyle(HOVER_STYLE);
                path.bringToFront();
                if (path.isPopupOpen()) {
                  path.closeTooltip();
                }
              },
              mousemove: () => {
                if (path.isPopupOpen()) {
                  path.closeTooltip();
                }
              },
              mouseout: () => {
                geo.resetStyle(path);
                if (hovered === path) hovered = null;
              },
              popupopen: () => {
                path.closeTooltip();
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
    // `zIndex: 0` crea un stacking context aislado: los z-index internos de
    // Leaflet (panes 400-500, info panel 1000) quedan contenidos en este
    // contenedor y no pueden pintar por encima del header sticky (z-40).
    <div className={className} style={{ position: "relative", zIndex: 0, height: height ?? "100%", width: "100%" }}>
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
        .custom-barrio-popup .leaflet-popup-content-wrapper {
          background: #ffffff;
          border-radius: 16px;
          padding: 4px;
          box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.08);
        }
        .custom-barrio-popup .leaflet-popup-content {
          margin: 6px 8px;
          line-height: 1.4;
        }
        .custom-barrio-popup .leaflet-popup-tip-container {
          width: 24px;
          height: 12px;
        }
        .custom-barrio-popup .leaflet-popup-tip {
          background: #ffffff;
        }
        .custom-barrio-popup a.leaflet-popup-close-button {
          top: 8px;
          right: 8px;
          color: #94a3b8;
          font-size: 18px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          transition: all 0.15s ease;
        }
        .custom-barrio-popup a.leaflet-popup-close-button:hover {
          color: #0f172a;
          background-color: #f1f5f9;
        }
        .leaflet-container a.barrio-ver-mas-btn,
        .barrio-ver-mas-btn {
          display: block;
          width: 100%;
          background-color: #facc15;
          color: #000000 !important;
          font-weight: 800;
          font-size: 0.95rem;
          padding: 10px 18px;
          border-radius: 12px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(250, 204, 21, 0.4);
          transition: all 0.15s ease;
          box-sizing: border-box;
          text-align: center;
          cursor: pointer;
        }
        .leaflet-container a.barrio-ver-mas-btn:hover,
        .barrio-ver-mas-btn:hover {
          background-color: #eab308 !important;
          color: #000000 !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(250, 204, 21, 0.55) !important;
        }
        .barrio-ver-mas-btn:active {
          transform: translateY(0);
        }
      `}</style>
      <div ref={containerRef} style={{ height: "100%", width: "100%", cursor: "pointer", backgroundColor: "#0f172a" }} />

      {/* Status Notification - only shown on loading/error/empty */}
      {status !== "ready" && (
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
        </div>
      )}
    </div>
  );
}
