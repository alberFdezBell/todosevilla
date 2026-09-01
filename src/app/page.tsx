import { db, ensureBusinessScheduleCompatibility } from "@/lib/db";
import { recordVisit } from "@/lib/analytics";
import SearchForm from "@/components/SearchForm";
import Link from "next/link";

export const dynamic = "force-dynamic"; // Dinámico para registrar visitas en cada petición

export default async function HomePage() {
  await ensureBusinessScheduleCompatibility();

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

      {/* ── Sección Hero ── */}
      <section
        className="py-20 px-6 rounded-3xl text-center relative overflow-hidden shadow-md"
        style={{ background: "#f3d044" }}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111]">
            Descubre Negocios en Castilblanco
          </h1>
          <p className="text-lg md:text-xl font-medium" style={{ color: "rgba(0,0,0,.65)" }}>
            Encuentra papelerías, fontaneros, restaurantes y todo tipo de servicios locales clasificados por zonas.
          </p>
        </div>
      </section>

      {/* ── Buscador ── */}
      <section className="px-4">
        <SearchForm zones={zones} categories={categories} />
      </section>

      {/* ── Listado de Zonas ── */}
      <section className="flex flex-col gap-6">
        <div className="border-b pb-3 flex justify-between items-end" style={{ borderColor: "#d7e0ea" }}>
          <h2 className="text-2xl font-bold" style={{ color: "#1f2937" }}>📍 Explorar por Zonas</h2>
          <span className="text-sm font-semibold" style={{ color: "#516173" }}>{zones.length} zonas disponibles</span>
        </div>

        {zones.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl border text-sm font-medium"
            style={{ background: "#fff", borderColor: "#d7e0ea", color: "#516173" }}
          >
            Aún no hay zonas creadas por el administrador.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {zones.map((zone) => (
              <Link
                key={zone.id}
                href={`/${zone.slug}`}
                className="group p-6 rounded-2xl border flex flex-col gap-2 transition duration-200"
                style={{
                  background: "#fff",
                  borderColor: "#d7e0ea",
                  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#f3d044";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(243,208,68,.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#d7e0ea";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.06)";
                }}
              >
                <h3 className="font-bold text-lg" style={{ color: "#1f2937" }}>
                  {zone.name}
                </h3>
                {zone.description && (
                  <p className="text-sm line-clamp-2" style={{ color: "#516173" }}>
                    {zone.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Negocios Recientes ── */}
      <section className="flex flex-col gap-6">
        <div className="border-b pb-3" style={{ borderColor: "#d7e0ea" }}>
          <h2 className="text-2xl font-bold" style={{ color: "#1f2937" }}>⭐ Negocios Recientes</h2>
        </div>

        {recentBusinesses.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl border text-sm font-medium"
            style={{ background: "#fff", borderColor: "#d7e0ea", color: "#516173" }}
          >
            Aún no hay negocios creados en el directorio.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBusinesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/${biz.zone.slug}/${biz.slug}`}
                className="p-6 rounded-2xl border flex flex-col justify-between gap-4 transition duration-200"
                style={{
                  background: "#fff",
                  borderColor: "#d7e0ea",
                  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#f3d044";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(243,208,68,.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#d7e0ea";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.06)";
                }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Badge categoría: amarillo suave estilo referencia */}
                    <span className="badge-brand">
                      {biz.category.name}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "#516173" }}>
                      📍 {biz.zone.name}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl line-clamp-1" style={{ color: "#1f2937" }}>
                    {biz.name}
                  </h3>
                  {biz.description && (
                    <p className="text-sm line-clamp-3" style={{ color: "#516173" }}>
                      {biz.description}
                    </p>
                  )}
                </div>

                {biz.phone && (
                  <div
                    className="text-sm font-semibold flex items-center gap-1.5 pt-2 border-t"
                    style={{ borderColor: "#f0f0f0", color: "#1f2937" }}
                  >
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
