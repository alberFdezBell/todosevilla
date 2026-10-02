import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso Legal — Todo Sevilla',
  description: 'Aviso legal e información regulatoria del sitio web Todo Sevilla.',
}

export default function AvisoLegalPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Aviso Legal</h1>
        <p className="text-xs text-gray-500 mt-1">Cumplimiento de la Ley 34/2002 (LSSI-CE)</p>
      </div>

      <div className="prose prose-amber max-w-none text-sm text-gray-700 space-y-6 leading-relaxed bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">1. Datos Identificativos</h2>
          <p>
            En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico, se exponen a continuación los datos identificativos del titular del sitio web:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Titular:</strong> [NOMBRE DEL TITULAR]</li>
            <li><strong>NIF/CIF:</strong> [NIF]</li>
            <li><strong>Domicilio Social:</strong> [DOMICILIO]</li>
            <li><strong>Correo Electrónico de Contacto:</strong> [EMAIL]</li>
            <li><strong>Nombre del Dominio:</strong> todo-sevilla.es</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">2. Objeto y Ámbito de Aplicación</h2>
          <p>
            El presente sitio web, **Todo Sevilla**, constituye un directorio digital informativo de libre acceso orientado a dar visibilidad a establecimientos, servicios y comercios locales de los distintos barrios de Sevilla.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">3. Propiedad Intelectual e Industrial</h2>
          <p>
            Todos los contenidos del sitio web (textos, fotografías, gráficos, código fuente, diseño de interfaz y logotipos) son propiedad del Titular o disponen de las licencias y autorizaciones correspondientes para su reproducción. Queda prohibida su reproducción total o parcial sin autorización explícita.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">4. Exención de Responsabilidad</h2>
          <p>
            El Titular no se hace responsable de la exactitud ni de la actualización en tiempo real de los datos facilitados por los comercios (horarios, teléfonos, ubicaciones), si bien realiza esfuerzos razonables por mantener la información veraz y corregir erratas notificadas.
          </p>
        </section>
      </div>
    </div>
  )
}
