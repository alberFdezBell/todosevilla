import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MapPin, Phone, Mail, Globe, Clock, Store, Building2, Calendar } from 'lucide-react'
import type { Metadata } from 'next'

interface BusinessPageProps {
  params: {
    barrioSlug: string
    businessSlug: string
  }
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const barrio = await prisma.barrio.findFirst({
    where: { slug: params.barrioSlug, activo: true },
  })

  if (!barrio) return { title: 'Negocio no encontrado — Todo Sevilla' }

  const negocio = await prisma.negocio.findFirst({
    where: {
      barrioId: barrio.id,
      slug: params.businessSlug,
      activo: true,
    },
  })

  if (!negocio) return { title: 'Negocio no encontrado — Todo Sevilla' }

  return {
    title: `${negocio.nombre} en ${barrio.nombre} — Todo Sevilla`,
    description: negocio.descripcion || `${negocio.nombre}, comercio local en ${barrio.nombre}, Sevilla. Direccion, telefono y horarios.`,
    openGraph: {
      title: `${negocio.nombre} (${barrio.nombre}, Sevilla)`,
      description: negocio.descripcion || `Negocio verificado en ${barrio.nombre}, Sevilla.`,
      images: negocio.imagen ? [{ url: negocio.imagen }] : [],
    },
  }
}

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function BusinessDetailPage({ params }: BusinessPageProps) {
  const barrio = await prisma.barrio.findFirst({
    where: { slug: params.barrioSlug, activo: true },
  })

  if (!barrio) {
    notFound()
  }

  const negocio = await prisma.negocio.findFirst({
    where: {
      barrioId: barrio.id,
      slug: params.businessSlug,
      activo: true,
    },
    include: {
      barrio: true,
      categorias: {
        where: { categoria: { activa: true } },
        include: { categoria: true },
      },
    },
  })

  if (!negocio) {
    notFound()
  }

  // Build JSON-LD Structured Data for LocalBusiness
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: negocio.nombre,
    description: negocio.descripcion || undefined,
    telephone: negocio.telefono || undefined,
    email: negocio.email || undefined,
    url: negocio.web || undefined,
    image: negocio.imagen || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: negocio.direccion || undefined,
      addressLocality: 'Sevilla',
      addressRegion: 'Sevilla',
      addressCountry: 'ES',
    },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* JSON-LD Script for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 font-medium flex items-center gap-2 flex-wrap">
        <Link href="/sevilla" className="hover:text-sevilla-carmesi">Inicio</Link>
        <span>/</span>
        <Link href="/sevilla/barrios" className="hover:text-sevilla-carmesi">Barrios</Link>
        <span>/</span>
        <Link href={`/sevilla/${barrio.slug}`} className="hover:text-sevilla-carmesi">{barrio.nombre}</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">{negocio.nombre}</span>
      </nav>

      {/* Business Card Container */}
      <article className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">
        {/* Optional Header Image / Banner */}
        {negocio.imagen && (
          <div className="relative h-64 sm:h-80 w-full bg-gray-100 overflow-hidden">
            <img
              src={negocio.imagen}
              alt={negocio.nombre}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-8">
          {/* Header Title & Categories */}
          <div className="space-y-3 border-b border-gray-100 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/sevilla/${barrio.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sevilla-carmesi bg-amber-50 px-3 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                Barrio {barrio.nombre}
              </Link>

              {negocio.categorias.map((c) => (
                <span
                  key={c.categoria.slug}
                  className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full"
                >
                  {c.categoria.nombre}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              {negocio.nombre}
            </h1>
          </div>

          {/* Description (Only render if present!) */}
          {negocio.descripcion && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Sobre este negocio
              </h2>
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {negocio.descripcion}
              </p>
            </div>
          )}

          {/* Contact & Location Details Grid (Only render non-empty fields!) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Información de contacto
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Dirección */}
              {negocio.direccion && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <MapPin className="w-5 h-5 text-sevilla-carmesi shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase">Dirección</span>
                    <span className="font-semibold text-gray-900">{negocio.direccion}</span>
                  </div>
                </div>
              )}

              {/* Teléfono */}
              {negocio.telefono && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <Phone className="w-5 h-5 text-sevilla-carmesi shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase">Teléfono</span>
                    <a
                      href={`tel:${negocio.telefono.replace(/\s+/g, '')}`}
                      className="font-semibold text-sevilla-carmesi hover:underline"
                    >
                      {negocio.telefono}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {negocio.email && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <Mail className="w-5 h-5 text-sevilla-carmesi shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase">Email</span>
                    <a
                      href={`mailto:${negocio.email}`}
                      className="font-semibold text-sevilla-carmesi hover:underline break-all"
                    >
                      {negocio.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Web */}
              {negocio.web && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <Globe className="w-5 h-5 text-sevilla-carmesi shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase">Página Web</span>
                    <a
                      href={negocio.web.startsWith('http') ? negocio.web : `https://${negocio.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sevilla-carmesi hover:underline break-all"
                    >
                      {negocio.web.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              {/* Horario */}
              {negocio.horario && (
                <div className="sm:col-span-2 flex items-start gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                  <Clock className="w-5 h-5 text-sevilla-albero-dark shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-amber-900 uppercase">Horario de atención</span>
                    <span className="font-semibold text-gray-900 whitespace-pre-line">{negocio.horario}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Badge & Timestamps */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
              ✓ Ficha verificada en Todo Sevilla
            </span>
            <span className="hidden sm:inline">
              Actualizado el {new Date(negocio.updated_at).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </article>

      {/* Back to barrio link */}
      <div className="text-center pt-4">
        <Link
          href={`/sevilla/${barrio.slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-sevilla-carmesi hover:underline"
        >
          ← Volver a todos los negocios de {barrio.nombre}
        </Link>
      </div>
    </div>
  )
}
