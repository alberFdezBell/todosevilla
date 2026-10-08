import type { Feature, Geometry } from 'geojson'

/**
 * Cuenta el número total de vértices/coordenadas en un Feature o Geometry GeoJSON
 */
export function countGeoJsonVertices(feat: Feature<Geometry> | Geometry | null): number {
  if (!feat) return 0
  const geom = feat.type === 'Feature' ? feat.geometry : feat
  if (!geom || !('coordinates' in geom) || !Array.isArray(geom.coordinates)) return 0

  if (geom.type === 'Polygon') {
    return (geom.coordinates as number[][][]).reduce((sum, ring) => sum + ring.length, 0)
  }
  if (geom.type === 'MultiPolygon') {
    return (geom.coordinates as number[][][][]).reduce(
      (sum, poly) => sum + poly.reduce((s, ring) => s + ring.length, 0),
      0
    )
  }
  return 0
}
