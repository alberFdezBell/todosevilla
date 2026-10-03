import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShieldAlert } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-950 text-gray-300 border-t-4 border-[#f3d044] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/todosevilla.svg"
                alt="Logo Todo Sevilla"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="font-extrabold text-xl tracking-tight text-white">
                TODO <span className="text-[#f3d044]">SEVILLA</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Directorio local para descubrir comercios, bares, cafeterías y servicios tradicionales en cada barrio de Sevilla. Potenciando el comercio de proximidad.
            </p>
            <div className="text-xs text-amber-200/90 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl inline-flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#f3d044]" />
              <span>Sin cookies de rastreo ni publicidad molestia. Privacidad 100% garantizada.</span>
            </div>
          </div>

          {/* Col 2: Explorar */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#f3d044] mb-4">
              Explorar
            </h3>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link href="/sevilla" className="hover:text-[#f3d044] transition-colors">
                  Portada
                </Link>
              </li>
              <li>
                <Link href="/sevilla/barrios" className="hover:text-[#f3d044] transition-colors">
                  Barrios de Sevilla
                </Link>
              </li>
              <li>
                <Link href="/sevilla/buscar" className="hover:text-[#f3d044] transition-colors">
                  Buscador de Negocios
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-[#f3d044] transition-colors">
                  Contactar / Sugerir negocio
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#f3d044] mb-4">
              Información Legal
            </h3>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link href="/aviso-legal" className="hover:text-[#f3d044] transition-colors">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-[#f3d044] transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-[#f3d044] transition-colors">
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
