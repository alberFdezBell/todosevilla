import { db, ensureBusinessScheduleCompatibility } from "@/lib/db";
import { recordVisit } from "@/lib/analytics";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // Dinámico para registrar visitas en cada petición

interface ZonePageProps {
  params: {
    zone_slug: string;
  };
  searchParams: {
    q?: string;
    cat?: string;
  };
}

// Cargar SEO dinámico para la zona
export async function generateMetadata({ params }: ZonePageProps): Promise<Metadata> {
  await ensureBusinessScheduleCompatibility();

  const zone = await db.zone.findUnique({
    where: { slug: params.zone_slug },
  });

  if (!zone) return {};

  return {
    title: zone.seoTitle || `Negocios en ${zone.name} | Todo Sevilla`,
    description: zone.seoDescription || `Directorio de comercios, profesionales y negocios locales en ${zone.name}, Sevilla.`,
  };
}

export default async function ZonePage({ params, searchParams }: ZonePageProps) {
  await ensureBusinessScheduleCompatibility();

  const { zone_slug } = params;
  const { q, cat } = searchParams;

  // Obtener detalles de la zona
  const zone = await db.zone.findUnique({
    where: { slug: zone_slug },
  });

  if (!zone) {
    notFound();
  }

  // Registrar visita server-side cookieless asociada a la zona
  await recordVisit({
    path: `/${zone_slug}`,
    zoneId: zone.id,
  });

  // Cargar categorías disponibles para filtrar en esta zona
  const categories = await db.category.findMany({
    where: {
      businesses: {
        some: {
          zoneId: zone.id,
          published: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Construir filtros de búsqueda
  const whereConditions: any = {
    zoneId: zone.id,
    published: true,
  };

  if (cat) {
    whereConditions.category = {
      slug: cat,
    };
  }

  if (q) {
    whereConditions.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  // Obtener negocios filtrados
  const businesses = await db.business.findMany({
    where: whereConditions,
    include: {
      category: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Navegación de migas de pan */}
      <nav className="text-sm font-medium text-slate-500 flex gap-2">
        <Link href="/" className="hover:underline">Inicio</Link>
        <span>/</span>
        <span className="text-slate-800">{zone.name}</span>
      </nav>

      {/* Cabecera de la Zona */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3">
        <h1 className="text-3xl font-extrabold text-slate-900">📍 {zone.name}</h1>
        {zone.description ? (
          <p className="text-slate-600 text-lg leading-relaxed max-w-4xl">
            {zone.description}
          </p>
        ) : (
          <p className="text-slate-500 text-lg italic">
            Directorio completo de negocios locales, comercios y profesionales en {zone.name}.
          </p>
        )}
      </section>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filtros Lateral (Categorías) */}
        <aside className="w-full lg:w-64 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <h2 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            Categorías
          </h2>
          <div className="flex flex-wrap lg:flex-col gap-2">
            <Link
              href={`/${zone.slug}${q ? `?q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm transition font-medium ${
                !cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Todos los negocios
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/${zone.slug}?cat=${c.slug}${q ? `&q=${q}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition font-medium ${
                  cat === c.slug
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Listado de Negocios */}
        <section className="flex-1 flex flex-col gap-6 w-full">
          {/* Buscador interno de la zona */}
          <form method="GET" className="flex gap-2 w-full">
            {cat && <input type="hidden" name="cat" value={cat} />}
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder={`Buscar en ${zone.name}...`}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition"
            >
              Filtrar
            </button>
          </form>

          {businesses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500">
              No se han encontrado negocios que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/${zone.slug}/${biz.slug}`}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition duration-200 flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {biz.category.name}
                      </span>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800">
                      {biz.name}
                    </h3>
                    {biz.description && (
                      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                        {biz.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                    {biz.phone && <div>📞 Teléfono: {biz.phone}</div>}
                    {biz.address && <div className="line-clamp-1">📍 Dirección: {biz.address}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
