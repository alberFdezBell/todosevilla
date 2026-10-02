import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Todo Sevilla',
  description: 'Términos y condiciones de uso de la plataforma Todo Sevilla.',
}

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Términos y Condiciones</h1>
        <p className="text-xs text-gray-500 mt-1">Condiciones de uso de la plataforma de directorio local</p>
      </div>

      <div className="prose prose-amber max-w-none text-sm text-gray-700 space-y-6 leading-relaxed bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">1. Aceptación de los Términos</h2>
          <p>
            Al navegar y utilizar **Todo Sevilla**, el usuario acepta íntegramente las presentes condiciones de uso.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">2. Publicación y Verificación de Fichas de Negocio</h2>
          <p>
            Las fichas publicadas en el directorio son recopiladas o facilitadas por los propios establecimientos. El titular se reserva el derecho de rechazar o retirar fichas de negocios con contenido inadecuado, ilícito o fraudulento.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">3. Gratuidad del Servicio</h2>
          <p>
            La consulta del directorio para usuarios finales es completamente gratuita.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">4. Modificaciones de las Condiciones</h2>
          <p>
            El Titular [NOMBRE DEL TITULAR] podrá modificar estas condiciones en cualquier momento para adaptarlas a novedades legislativas o mejoras técnicas.
          </p>
        </section>
      </div>
    </div>
  )
}
