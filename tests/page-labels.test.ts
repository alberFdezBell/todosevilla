import { describe, it, expect } from 'vitest'
import { getPageLabel, shouldShowAdminControls } from '../src/lib/page-labels'

describe('Header — getPageLabel', () => {
  it('conserva "Páginas amarillas" únicamente en /sevilla', () => {
    expect(getPageLabel('/sevilla')).toBe('Páginas amarillas')
  })

  it('etiqueta los listados principales', () => {
    expect(getPageLabel('/sevilla/barrios')).toBe('Barrios')
    expect(getPageLabel('/sevilla/buscar')).toBe('Buscador')
  })

  it('etiqueta todas las rutas del panel de administración', () => {
    expect(getPageLabel('/admin')).toBe('Panel Admin')
    expect(getPageLabel('/admin/negocios')).toBe('Panel Admin')
    expect(getPageLabel('/admin/barrios')).toBe('Panel Admin')
    expect(getPageLabel('/admin/categorias')).toBe('Panel Admin')
    expect(getPageLabel('/admin/login')).toBe('Panel Admin')
  })

  it('etiqueta la ficha de barrio y de negocio como "Negocios"', () => {
    expect(getPageLabel('/sevilla/triana')).toBe('Negocios')
    expect(getPageLabel('/sevilla/triana/cafeteria-la-hermosa')).toBe('Negocios')
  })

  it('etiqueta las páginas informativas', () => {
    expect(getPageLabel('/contacto')).toBe('Contacto')
    expect(getPageLabel('/aviso-legal')).toBe('Aviso Legal')
    expect(getPageLabel('/privacidad')).toBe('Privacidad')
    expect(getPageLabel('/terminos-y-condiciones')).toBe('Términos y Condiciones')
  })

  it('deriva una etiqueta legible para páginas nuevas (fallback)', () => {
    expect(getPageLabel('/nueva-pagina')).toBe('Nueva Pagina')
    expect(getPageLabel('/guia/compras-moda')).toBe('Compras Moda')
  })

  it('devuelve "Páginas amarillas" como último recurso', () => {
    expect(getPageLabel('/')).toBe('Páginas amarillas')
  })
})

describe('Header — shouldShowAdminControls', () => {
  it('muestra los controles de sesión en todo /admin excepto /admin/login', () => {
    expect(shouldShowAdminControls('/admin')).toBe(true)
    expect(shouldShowAdminControls('/admin/negocios')).toBe(true)
    expect(shouldShowAdminControls('/admin/login')).toBe(false)
  })

  it('oculta los controles de sesión fuera del panel', () => {
    expect(shouldShowAdminControls('/sevilla')).toBe(false)
    expect(shouldShowAdminControls('/sevilla/barrios')).toBe(false)
    expect(shouldShowAdminControls('/contacto')).toBe(false)
  })
})