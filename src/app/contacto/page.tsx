import type { Metadata } from 'next'
import { Mail, MapPin, Store, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto y Sugerencia de Negocios — Todo Sevilla',
  description: 'Ponte en contacto con el equipo de Todo Sevilla para añadir o modificar tu negocio en el directorio.',
}

export default function ContactoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-gray-200 pb-4 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Contacto y Sugerencias</h1>
        <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
          ¿Tienes un negocio en Sevilla y quieres aparecer en el directorio? ¿Quieres actualizar los datos de tu ficha? Escríbenos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-sevilla-carmesi" />
            Información de Contacto
          </h2>

          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-sevilla-albero-dark shrink-0 mt-0.5" />
              <div>
                <strong className="block text-gray-900">Correo Electrónico:</strong>
                <span className="text-sevilla-carmesi font-medium">[EMAIL]</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-sevilla-albero-dark shrink-0 mt-0.5" />
              <div>
                <strong className="block text-gray-900">Ubicación principal:</strong>
                <span>Sevilla, España</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-sevilla-albero-dark shrink-0 mt-0.5" />
              <div>
                <strong className="block text-gray-900">Alta de negocios:</strong>
                <span>El registro en Todo Sevilla es 100% gratuito en esta primera versión v0.1.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 p-8 rounded-3xl space-y-4">
          <h2 className="text-xl font-bold text-amber-950 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sevilla-carmesi" />
            ¿Qué datos incluir al escribirnos?
          </h2>
          <p className="text-xs text-amber-900/90 leading-relaxed">
            Para dar de alta tu comercio o actualizar una ficha existente, indícanos:
          </p>
          <ul className="text-xs text-amber-900 space-y-2 list-disc pl-4">
            <li>Nombre comercial del negocio</li>
            <li>Barrio de Sevilla donde se ubica</li>
            <li>Dirección exacta y número de teléfono</li>
            <li>Horario de atención al público</li>
            <li>Categoría o tipo de servicio (ej: Cafetería, Peluquería, Abancería)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
