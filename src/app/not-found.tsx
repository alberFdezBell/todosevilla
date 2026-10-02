import Link from 'next/link'
import { MapPin, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-gray-200 shadow-lg space-y-6">
        <div className="bg-amber-100 text-sevilla-carmesi w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <MapPin className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-sevilla-carmesi">
            Error 404
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Página o Negocio no encontrado
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            La calle, barrio o negocio que buscas no existe o ha sido modificado en Todo Sevilla.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/sevilla"
            className="w-full bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Portada</span>
          </Link>

          <Link
            href="/sevilla/barrios"
            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4 text-sevilla-albero-dark" />
            <span>Ver Barrios de Sevilla</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
