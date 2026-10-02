import Link from 'next/link'
import { MapPin, Heart, ShieldAlert } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 border-t-4 border-sevilla-albero mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-sevilla-carmesi text-white p-1.5 rounded-md">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                TODO <span className="text-sevilla-albero">SEVILLA</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Las Páginas Amarillas modernas para descubrir comercios, bares, cafeterías y servicios tradicionales en cada barrio de Sevilla. Potenciando el comercio local de proximidad.
            </p>
            <div className="text-xs text-amber-300/80 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-lg inline-flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-sevilla-albero" />
              <span>Sin cookies de rastreo ni publicidad no esencial. Respetamos tu privacidad.</span>
            </div>
          </div>

          {/* Col 2: Explorar */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sevilla-albero mb-4">
              Explorar
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sevilla" className="hover:text-amber-400 transition-colors">
                  Portada
                </Link>
              </li>
              <li>
                <Link href="/sevilla/barrios" className="hover:text-amber-400 transition-colors">
                  Barrios de Sevilla
                </Link>
              </li>
              <li>
                <Link href="/sevilla/buscar" className="hover:text-amber-400 transition-colors">
                  Buscador de Negocios
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-amber-400 transition-colors">
                  Contactar / Sugerir negocio
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sevilla-albero mb-4">
              Información Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/aviso-legal" className="hover:text-amber-400 transition-colors">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-amber-400 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-amber-400 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-xs text-gray-400 hover:text-white transition-colors">
                  Acceso Privado / Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {currentYear} Todo Sevilla — Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-sevilla-carmesi fill-sevilla-carmesi inline" /> para la ciudad de Sevilla
          </p>
        </div>
      </div>
    </footer>
  )
}
