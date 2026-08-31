import { db } from "@/lib/db";
import { recordVisit } from "@/lib/analytics";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // Dinámico para registrar visitas en cada petición

interface BusinessPageProps {
  params: {
    zone_slug: string;
    business_slug: string;
  };
}

// Cargar SEO dinámico para el negocio
export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const business = await db.business.findUnique({
    where: { slug: params.business_slug },
    include: { zone: true, category: true }
  });

  if (!business || business.zone.slug !== params.zone_slug) return {};

  return {
    title: `${business.name} | ${business.category.name} en ${business.zone.name} | Todo Sevilla`,
    description: business.description 
      ? business.description.substring(0, 160) 
      : `${business.name} - Negocio de ${business.category.name} en ${business.zone.name}, Sevilla. Encuentra dirección, teléfono, horario y opiniones.`,
  };
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { zone_slug, business_slug } = params;

  // Obtener detalles del negocio
  const business = await db.business.findUnique({
    where: { slug: business_slug },
    include: {
      zone: true,
      category: true,
    },
  });

  // Validar existencia y que pertenezca a la zona indicada en la URL
  if (!business || business.zone.slug !== zone_slug || !business.published) {
    notFound();
  }

  // Registrar visita server-side cookieless asociada a este negocio y zona
  await recordVisit({
    path: `/${zone_slug}/${business_slug}`,
    zoneId: business.zone.id,
    businessId: business.id,
  });

  // Estructura de datos Schema.org (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": business.name,
    "description": business.description || `Negocio de ${business.category.name} en ${business.zone.name}`,
    "image": "https://todosevilla.aferbel.es/images/icon.png", // Reemplazar con imagen real si se sube
    "telephone": business.phone || undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": business.address || "",
      "addressLocality": business.zone.name,
      "addressRegion": "Sevilla",
      "addressCountry": "ES"
    },
    "url": business.website || undefined,
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": business.zone.name
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Script JSON-LD para SEO técnico LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Migas de pan */}
      <nav className="text-sm font-medium text-slate-500 flex gap-2">
        <Link href="/" className="hover:underline">Inicio</Link>
        <span>/</span>
        <Link href={`/${business.zone.slug}`} className="hover:underline">
          {business.zone.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 line-clamp-1">{business.name}</span>
      </nav>

      {/* Tarjeta del Negocio */}
      <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Cuerpo de información principal */}
        <div className="flex-1 p-8 flex flex-col gap-6">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {business.category.name}
            </span>
            <Link 
              href={`/${business.zone.slug}`}
              className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-slate-200 transition"
            >
              📍 {business.zone.name}
            </Link>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {business.name}
          </h1>

          {business.description && (
            <div className="text-slate-700 leading-relaxed text-base whitespace-pre-line border-t border-slate-100 pt-6">
              {business.description}
            </div>
          )}
        </div>

        {/* Tarjeta lateral de contacto (Responsive y Sticky en Desktop) */}
        <div className="w-full md:w-80 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-900">Información de contacto</h2>
          
          <div className="flex flex-col gap-4 text-sm">
            {business.phone && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teléfono</span>
                <a 
                  href={`tel:${business.phone}`} 
                  className="text-blue-600 hover:underline font-semibold text-lg"
                >
                  {business.phone}
                </a>
              </div>
            )}

            {business.address && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dirección</span>
                <span className="text-slate-700 font-medium">{business.address}</span>
              </div>
            )}

            {business.schedule && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Horario</span>
                <span className="text-slate-700 font-medium whitespace-pre-line">{business.schedule}</span>
              </div>
            )}

            {business.website && (
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sitio Web / Redes</span>
                <a 
                  href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="inline-flex justify-center items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-center transition"
                >
                  Visitar web oficial
                </a>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Sección para volver atrás */}
      <div className="flex justify-center mt-4">
        <Link 
          href={`/${business.zone.slug}`}
          className="text-slate-600 hover:text-blue-600 font-semibold text-sm transition flex items-center gap-1"
        >
          ← Volver a ver todos los negocios de {business.zone.name}
        </Link>
      </div>
    </div>
  );
}
