/**
 * Etiqueta de página mostrada en la cabecera pública (sustituye a «Páginas amarillas»).
 * La única ruta que conserva el texto clásico es /sevilla.
 */
export function getPageLabel(pathname: string): string {
  // Portada: conserva el texto clásico
  if (pathname === '/sevilla') return 'Páginas amarillas'

  // Listados principales
  if (pathname === '/sevilla/barrios') return 'Barrios'
  if (pathname === '/sevilla/buscar') return 'Buscador'

  // Panel de administración (todas sus rutas)
  if (pathname.startsWith('/admin')) return 'Panel Admin'

  // Páginas informativas
  if (pathname === '/contacto') return 'Contacto'
  if (pathname === '/aviso-legal') return 'Aviso Legal'
  if (pathname === '/privacidad') return 'Privacidad'
  if (pathname === '/terminos-y-condiciones') return 'Términos y Condiciones'

  // Detalle de barrio o de negocio: ambos muestran negocios
  if (pathname.startsWith('/sevilla/')) return 'Negocios'

  // Fallback genérico para páginas nuevas: deriva un nombre de la última ruta
  const segment = pathname.split('/').filter(Boolean).pop()
  if (segment) {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return 'Páginas amarillas'
}

/**
 * Los controles de sesión («Red Local Autenticada» y «Cerrar Sesión»)
 * solo se muestran dentro del panel de administración y nunca en /admin/login,
 * donde todavía no hay una sesión iniciada.
 */
export function shouldShowAdminControls(pathname: string): boolean {
  return pathname.startsWith('/admin') && pathname !== '/admin/login'
}