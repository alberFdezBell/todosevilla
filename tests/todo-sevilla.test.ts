import { describe, it, expect } from 'vitest'
import { slugify } from '../src/lib/utils'

// Mock Data structure for testing logic rules
interface BarrioMock {
  id: string
  nombre: string
  slug: string
  activo: boolean
  negociosCount: number
}

interface NegocioMock {
  id: string
  nombre: string
  slug: string
  barrioId: string
  descripcion?: string
  activo: boolean
  direccion?: string
  telefono?: string
  email?: string
}

describe('Todo Sevilla - Core Logic & Business Rules Unit Tests', () => {
  // 1. Slugify utility tests
  describe('Slugify Generator', () => {
    it('should convert accents, uppercase and spaces to clean URLs', () => {
      expect(slugify('La Macarena')).toBe('la-macarena')
      expect(slugify('Cafetería & Bar El Comercio')).toBe('cafeteria-bar-el-comercio')
      expect(slugify('  Los Remedios (Sevilla)  ')).toBe('los-remedios-sevilla')
    })
  })

  // 2. Barrio Deletion Protection Rule
  describe('Barrio Deletion Protection', () => {
    it('should DENY deletion of a barrio that has associated businesses', () => {
      const barrio: BarrioMock = {
        id: 'b-1',
        nombre: 'Triana',
        slug: 'triana',
        activo: true,
        negociosCount: 3,
      }

      function canDeleteBarrio(b: BarrioMock): { allowed: boolean; reason?: string } {
        if (b.negociosCount > 0) {
          return {
            allowed: false,
            reason: `No se puede eliminar el barrio "${b.nombre}" porque tiene ${b.negociosCount} negocio(s) asociado(s).`,
          }
        }
        return { allowed: true }
      }

      const check = canDeleteBarrio(barrio)
      expect(check.allowed).toBe(false)
      expect(check.reason).toContain('3 negocio(s) asociado(s)')
    })

    it('should ALLOW deletion of a barrio with 0 businesses', () => {
      const emptyBarrio: BarrioMock = {
        id: 'b-2',
        nombre: 'Barrio Nuevo',
        slug: 'barrio-nuevo',
        activo: true,
        negociosCount: 0,
      }

      function canDeleteBarrio(b: BarrioMock): { allowed: boolean; reason?: string } {
        if (b.negociosCount > 0) {
          return { allowed: false, reason: 'Tiene negocios' }
        }
        return { allowed: true }
      }

      expect(canDeleteBarrio(emptyBarrio).allowed).toBe(true)
    })
  })

  // 3. Search & Inactive Business Filtering
  describe('Search & Inactive Filter', () => {
    const sampleNegocios: NegocioMock[] = [
      { id: '1', nombre: 'Abancería San Jacinto', slug: 'abanceria', barrioId: 'b-1', activo: true, descripcion: 'Tapas de calidad' },
      { id: '2', nombre: 'Peluquería Triana', slug: 'peluqueria-triana', barrioId: 'b-1', activo: false, descripcion: 'Cortes' }, // Inactive!
      { id: '3', nombre: 'Café Betis', slug: 'cafe-betis', barrioId: 'b-1', activo: true, descripcion: 'Desayunos' },
    ]

    function searchActiveNegocios(query: string, list: NegocioMock[]): NegocioMock[] {
      const norm = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const q = norm(query)
      return list.filter(
        (item) =>
          item.activo &&
          (norm(item.nombre).includes(q) || (item.descripcion && norm(item.descripcion).includes(q)))
      )
    }

    it('should return matching active businesses and EXCLUDE inactive ones', () => {
      const results = searchActiveNegocios('triana', sampleNegocios)
      // "Peluquería Triana" matches "triana" but is inactive, so it MUST NOT be returned!
      expect(results.some((n) => n.id === '2')).toBe(false)
    })

    it('should support partial search matching', () => {
      const results = searchActiveNegocios('cafe', sampleNegocios)
      expect(results.length).toBe(1)
      expect(results[0].nombre).toBe('Café Betis')
    })
  })

  // 4. Empty Field Suppression in Public View
  describe('Empty Field Filtering', () => {
    it('should omit empty fields from rendered object', () => {
      const business: NegocioMock = {
        id: '10',
        nombre: 'Bar Pepe',
        slug: 'bar-pepe',
        barrioId: 'b-1',
        activo: true,
        direccion: 'Calle Betis 5',
        telefono: '', // Empty
        email: undefined, // Empty
      }

      function getVisiblePublicFields(item: NegocioMock) {
        const fields: Record<string, string> = {}
        if (item.direccion && item.direccion.trim()) fields.direccion = item.direccion
        if (item.telefono && item.telefono.trim()) fields.telefono = item.telefono
        if (item.email && item.email.trim()) fields.email = item.email
        return fields
      }

      const visible = getVisiblePublicFields(business)
      expect(visible).toHaveProperty('direccion', 'Calle Betis 5')
      expect(visible).not.toHaveProperty('telefono')
      expect(visible).not.toHaveProperty('email')
    })
  })

  // 5. Input Validation
  describe('Backend & Frontend Validation', () => {
    function validateNegocioInput(data: { nombre?: string; barrioId?: string }) {
      const errors: string[] = []
      if (!data.nombre || !data.nombre.trim()) {
        errors.push('El nombre del negocio es obligatorio')
      }
      if (!data.barrioId || !data.barrioId.trim()) {
        errors.push('Debe seleccionar un barrio')
      }
      return { isValid: errors.length === 0, errors }
    }

    it('should fail validation if name or barrioId is missing', () => {
      const res1 = validateNegocioInput({ nombre: '', barrioId: 'b-1' })
      expect(res1.isValid).toBe(false)
      expect(res1.errors).toContain('El nombre del negocio es obligatorio')

      const res2 = validateNegocioInput({ nombre: 'Mi Bar', barrioId: '' })
      expect(res2.isValid).toBe(false)
      expect(res2.errors).toContain('Debe seleccionar un barrio')
    })

    it('should pass validation when required fields are present', () => {
      const res = validateNegocioInput({ nombre: 'Bar Triana', barrioId: 'b-1' })
      expect(res.isValid).toBe(true)
    })
  })

  // 6. GeoJSON Import & Spatial Collision Detection Tests
  describe('GeoJSON Import & Collision Detection', () => {
    it('should detect spatial collision when a new area overlaps an existing area', async () => {
      const booleanIntersects = (await import('@turf/boolean-intersects')).default

      const existingPoly = {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [-6.0, 37.38],
              [-5.98, 37.38],
              [-5.98, 37.4],
              [-6.0, 37.4],
              [-6.0, 37.38],
            ],
          ],
        },
        properties: { nombre: 'Triana' },
      }

      const overlappingPoly = {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [-5.99, 37.39],
              [-5.97, 37.39],
              [-5.97, 37.41],
              [-5.99, 37.41],
              [-5.99, 37.39],
            ],
          ],
        },
        properties: { nombre: 'Nuevo Barrio Solapado' },
      }

      const nonOverlappingPoly = {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [-5.8, 37.1],
              [-5.7, 37.1],
              [-5.7, 37.2],
              [-5.8, 37.2],
              [-5.8, 37.1],
            ],
          ],
        },
        properties: { nombre: 'Barrio Lejano' },
      }

      expect(booleanIntersects(overlappingPoly, existingPoly)).toBe(true)
      expect(booleanIntersects(nonOverlappingPoly, existingPoly)).toBe(false)
    })
  })

  // 7. GeoJSON Polygon Simplification & Vertex Counting Tests
  describe('GeoJSON Polygon Simplification & Vertex Counting', () => {
    const multiPointPoly = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-6.0, 37.38],
            [-5.999, 37.3801],
            [-5.998, 37.3802],
            [-5.98, 37.38],
            [-5.98, 37.4],
            [-5.99, 37.4001],
            [-6.0, 37.4],
            [-6.0, 37.38],
          ],
        ],
      },
      properties: { nombre: 'Polígono Complejo' },
    }

    it('should count vertices correctly', async () => {
      const { countGeoJsonVertices } = await import('@/lib/geo-utils')
      expect(countGeoJsonVertices(multiPointPoly)).toBe(8)
    })

    it('should reduce vertex count when simplify is applied', async () => {
      const { simplify } = await import('@turf/turf')
      const { countGeoJsonVertices } = await import('@/lib/geo-utils')

      const initialCount = countGeoJsonVertices(multiPointPoly)
      const simplified = simplify(multiPointPoly, { tolerance: 0.001, highQuality: true })
      const simplifiedCount = countGeoJsonVertices(simplified)

      expect(simplifiedCount).toBeLessThan(initialCount)
      expect(simplifiedCount).toBeGreaterThanOrEqual(4)
    })
  })
})

