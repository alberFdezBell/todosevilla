import { db, ensureBusinessScheduleCompatibility } from "@/lib/db";
import { recordVisit } from "@/lib/analytics";
import Link from "next/link";

export const dynamic = "force-dynamic"; // Dinámico para registrar visitas en cada petición

interface BuscarPageProps {
  searchParams: {
    q?: string;
    cat?: string;
  };
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  await ensureBusinessScheduleCompatibility();

  const { q, cat } = searchParams;

  // Registrar visita para analítica
  await recordVisit({
    path: `/buscar${q ? `?q=${q}` : ""}${cat ? `&cat=${cat}` : ""}`,
  });

  // Filtros
  const whereConditions: any = {
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
      { zone: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const businesses = await db.business.findMany({
    where: whereConditions,
    include: {
      category: true,
      zone: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      <nav className="text-sm font-medium text-slate-500 flex gap-2">
        <Link href="/" className="hover:underline">Inicio</Link>
        <span>/</span>
        <span className="text-slate-800">Resultados de búsqueda</span>
      </nav>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-900">🔍 Resultados de búsqueda</h1>
        <p className="text-slate-500">
          {q || cat ? (
            <>
              Buscando {q && <strong className="text-slate-800">"{q}"</strong>}
              {cat && (
                <>
                  {" "}
                  en la categoría <strong className="text-slate-800">"{cat}"</strong>
                </>
              )}
            </>
          ) : (
            "Todos los negocios de la provincia de Sevilla"
          )}
        </p>
      </section>

      {businesses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500">
          No se han encontrado negocios que coincidan con la búsqueda. Intenta modificar los términos.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/${biz.zone.slug}/${biz.slug}`}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition duration-200 flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {biz.category.name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    📍 {biz.zone.name}
                  </span>
                </div>
                <h3 className="font-bold text-xl text-slate-800 line-clamp-1">
                  {biz.name}
                </h3>
                {biz.description && (
                  <p className="text-sm text-slate-500 line-clamp-3">
                    {biz.description}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                {biz.phone && <div>📞 {biz.phone}</div>}
                {biz.address && <div className="line-clamp-1">📍 {biz.address}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
