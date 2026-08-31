import { db } from "@/lib/db";
import { recordVisit } from "@/lib/analytics";
import SearchForm from "@/components/SearchForm";
import Link from "next/link";

export const dynamic = "force-dynamic"; // Dinámico para registrar visitas en cada petición

export default async function HomePage() {
  // Registrar la visita a la landing principal
  await recordVisit({ path: "/" });

  // Obtener zonas y categorías de la base de datos
  const zones = await db.zone.findMany({
    orderBy: { name: "asc" },
  });

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  // Obtener últimos negocios agregados (destacados/nuevos)
  const recentBusinesses = await db.business.findMany({
    where: { published: true },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      zone: true,
    },
  });

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Sección Hero */}
      <section className="header-gradient text-white py-20 px-6 rounded-3xl text-center relative overflow-hidden shadow-lg">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Descubre Negocios en Sevilla
          </h1>
          <p className="text-lg md:text-xl text-blue-100 font-light">
            Encuentra papelerías, fontaneros, restaurantes y todo tipo de servicios locales clasificados por zonas de la provincia.
          </p>
        </div>
      </section>

      {/* Buscador */}
      <section className="px-4">
        <SearchForm zones={zones} categories={categories} />
      </section>

      {/* Listado de Zonas */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
          <h2 className="text-2xl font-bold text-slate-800">📍 Explorar por Zonas</h2>
          <span className="text-sm text-slate-500 font-medium">{zones.length} zonas disponibles</span>
        </div>
        
        {zones.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
            Aún no hay zonas creadas por el administrador.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {zones.map((zone) => (
              <Link
                key={zone.id}
                href={`/${zone.slug}`}
                className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.02] transition duration-200 flex flex-col gap-2"
              >
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600">
                  {zone.name}
                </h3>
                {zone.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {zone.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Negocios Recientes */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-2xl font-bold text-slate-800">⭐ Negocios Recientes</h2>
        </div>

        {recentBusinesses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
            Aún no hay negocios creados en el directorio.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBusinesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/${biz.zone.slug}/${biz.slug}`}
                className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition duration-200 flex flex-col justify-between gap-4"
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
                
                {biz.phone && (
                  <div className="text-sm text-slate-600 font-medium flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    📞 {biz.phone}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
