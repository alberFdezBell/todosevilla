import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";

/**
 * Mapa de Sevilla con resaltado de barrios al pasar el ratón.
 *
 * Dependencias:
 *   npm i leaflet react
 *   npm i -D @types/leaflet @types/geojson @types/react
 *
 * Necesita un GeoJSON (WGS84 / EPSG:4326) con un polígono por barrio.
 * Colócalo, por ejemplo, en /public/data/barrios-sevilla.geojson.
 */

type BarrioProps = Record<string, unknown>;
type BarrioFeature = Feature<Geometry, BarrioProps>;

export interface SevillaBarriosMapProps {
  /** URL del GeoJSON con los barrios. */
  geojsonUrl?: string;
  /**
   * Propiedad (o función) que devuelve el nombre del barrio.
   * Si no se indica, se prueban varias claves habituales.
   */
  nameProperty?: string | ((props: BarrioProps) => string | undefined);
  /** Altura del contenedor del mapa. */
  height?: number | string;
  className?: string;
}

const SEVILLA_CENTER: L.LatLngTuple = [37.3886, -5.9823];
const NAME_KEYS = ["nombre", "NOMBRE", "name", "NAME", "barrio", "BARRIO"];

const BASE_STYLE: L.PathOptions = {
  color: "#7a7a7a",
  weight: 1,
  fillColor: "#7a7a7a",
  fillOpacity: 0.04,
};

const HOVER_STYLE: L.PathOptions = {
  color: "#c8102e",
  weight: 3,
  fillColor: "#c8102e",
  fillOpacity: 0.25,
};

function getName(
  props: BarrioProps | null | undefined,
  nameProperty: SevillaBarriosMapProps["nameProperty"],
): string {
  if (!props) return "Barrio sin nombre";
  if (typeof nameProperty === "function") {
    return nameProperty(props) ?? "Barrio sin nombre";
  }
  const keys = nameProperty ? [nameProperty] : NAME_KEYS;
  for (const key of keys) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "Barrio sin nombre";
}

export default function SevillaBarriosMap({
  geojsonUrl = "/data/barrios-sevilla.geojson",
  nameProperty,
  height = 600,
  className,
}: SevillaBarriosMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Guardamos nameProperty en un ref para no reconstruir el mapa si cambia la función.
  const nameRef = useRef(nameProperty);
  nameRef.current = nameProperty;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: SEVILLA_CENTER,
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const controller = new AbortController();
    let layer: L.GeoJSON | null = null;

    (async () => {
      try {
        const res = await fetch(geojsonUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${geojsonUrl}`);
        const data = (await res.json()) as FeatureCollection<Geometry, BarrioProps>;
        if (!data.features?.length) throw new Error("El GeoJSON no contiene barrios.");

        layer = L.geoJSON<BarrioProps>(data, {
          style: () => BASE_STYLE,
          onEachFeature: (feature: BarrioFeature, lyr) => {
            const path = lyr as L.Path;
            const name = getName(feature.properties, nameRef.current);

            path.bindTooltip(name, { sticky: true, direction: "top" });

            path.on({
              mouseover: () => {
                path.setStyle(HOVER_STYLE);
                path.bringToFront();
                setHovered(name);
              },
              mouseout: () => {
                layer?.resetStyle(path);
                setHovered(null);
              },
              // En pantallas táctiles no hay hover: el toque hace de "pasar por encima".
              click: () => {
                layer?.eachLayer((l) => layer?.resetStyle(l as L.Path));
                path.setStyle(HOVER_STYLE);
                path.bringToFront();
                setHovered(name);
              },
            });
          },
        }).addTo(map);

        const bounds = layer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] });
        setStatus("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setErrorMsg((err as Error).message);
        setStatus("error");
      }
    })();

    return () => {
      controller.abort();
      map.remove();
    };
  }, [geojsonUrl]);

  return (
    <div
      className={className}
      style={{ position: "relative", height, width: "100%" }}
    >
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

      {/* Etiqueta con el barrio actual */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          padding: "8px 14px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          font: "600 14px system-ui, sans-serif",
          color: hovered ? "#c8102e" : "#666",
          pointerEvents: "none",
        }}
      >
        {status === "loading" && "Cargando barrios…"}
        {status === "error" && `Error: ${errorMsg}`}
        {status === "ready" && (hovered ?? "Pasa el ratón por un barrio")}
      </div>
    </div>
  );
}
