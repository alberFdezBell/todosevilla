'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error internally without exposing details to user
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-gray-200 shadow-lg space-y-6">
        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
            Error en el Servidor
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Algo no ha salido bien
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            Hemos registrado la incidencia. No se han expuesto datos sensibles por seguridad. Por favor, reintenta la acción.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="w-full bg-sevilla-carmesi hover:bg-sevilla-carmesi-dark text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>

          <Link
            href="/sevilla"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center transition-colors"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
