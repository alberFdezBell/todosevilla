import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Todo Sevilla',
  description: 'Información sobre protección de datos personales y privacidad en Todo Sevilla.',
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Política de Privacidad</h1>
        <p className="text-xs text-gray-500 mt-1">Cumplimiento del Reglamento General de Protección de Datos (RGPD) y LOPDGDD</p>
      </div>

      <div className="prose prose-amber max-w-none text-sm text-gray-700 space-y-6 leading-relaxed bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">1. Responsable del Tratamiento</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Identidad:</strong> [NOMBRE DEL TITULAR]</li>
            <li><strong>NIF:</strong> [NIF]</li>
            <li><strong>Dirección Postal:</strong> [DOMICILIO]</li>
            <li><strong>Correo Electrónico:</strong> [EMAIL]</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">2. Finalidad del Tratamiento y Uso de Cookies</h2>
          <p>
            En **Todo Sevilla** **NO utilizamos cookies de terceros, analíticas de rastreo (Google Analytics, Meta Pixel) ni tecnologías publicitarias**.
          </p>
          <p>
            Únicamente se pueden emplear cookies técnicas estrictamente necesarias para el correcto funcionamiento del servidor o para la sesión segura del área de administración.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">3. Formulario de Contacto o Registro de Negocios</h2>
          <p>
            Si se pone en contacto con nosotros vía email o mediante formulario, sus datos se utilizarán exclusivamente para responder a la consulta o procesar el alta/modificación del negocio. Los datos no se cederán a terceros salvo obligación legal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">4. Derechos del Usuario</h2>
          <p>
            Puede ejercer sus derechos de acceso, rectificación, supresión, limitación y oposición mediante escrito dirigido al correo electrónico **[EMAIL]** adjuntando copia de su documento de identidad.
          </p>
        </section>
      </div>
    </div>
  )
}
