import { db, ensureBusinessScheduleCompatibility } from "@/lib/db";
import UpdateManager from "@/components/UpdateManager";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: {
    y?: string; // año
    m?: string; // mes (1-12)
    d?: string; // día (1-31)
  };
}

export const revalidate = 0; // El panel nunca debe cachearse, siempre muestra datos en vivo

export default async function PanelPage({ searchParams }: DashboardPageProps) {
  await ensureBusinessScheduleCompatibility();

  const currentYear = new Date().getFullYear();
  
  // Parsea parámetros de filtro, por defecto vacío (muestra histórico completo)
  const filterYear = searchParams.y ? parseInt(searchParams.y) : null;
  const filterMonth = searchParams.m ? parseInt(searchParams.m) : null;
  const filterDay = searchParams.d ? parseInt(searchParams.d) : null;

  // Construir rango de fechas para el filtro de visitas
  let dateFilter: any = {};
  if (filterYear) {
    let start: Date;
    let end: Date;

    if (filterMonth) {
      if (filterDay) {
        start = new Date(filterYear, filterMonth - 1, filterDay, 0, 0, 0);
        end = new Date(filterYear, filterMonth - 1, filterDay, 23, 59, 59);
      } else {
        start = new Date(filterYear, filterMonth - 1, 1, 0, 0, 0);
        end = new Date(filterYear, filterMonth, 0, 23, 59, 59); // Día 0 del mes siguiente es el último día del mes actual
      }
    } else {
      start = new Date(filterYear, 0, 1, 0, 0, 0);
      end = new Date(filterYear, 11, 31, 23, 59, 59);
    }
    
    dateFilter = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };
  }

  // 1. Estadísticas Generales (Totales absolutos)
  const totalBusinesses = await db.business.count();
  const totalZones = await db.zone.count();
  const totalCategories = await db.category.count();
  const totalUsers = await db.user.count();

  // 2. Visitas en el periodo filtrado
  const totalVisitsPeriod = await db.pageVisit.count({
    where: dateFilter,
  });

  // 3. Negocios creados en el periodo filtrado (evolución)
  let businessCreatedFilter = {};
  if (filterYear) {
    businessCreatedFilter = {
      createdAt: dateFilter.createdAt,
    };
  }
  const businessesCreatedPeriod = await db.business.count({
    where: businessCreatedFilter,
  });

  // 4. Desglose de visitas por página (ruta / path) - Top 10
  const pathVisits = await db.pageVisit.groupBy({
    by: ["path"],
    where: dateFilter,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  // 5. Desglose de visitas por Zona - Top 10
  const zoneVisitsGroup = await db.pageVisit.groupBy({
    by: ["zoneId"],
    where: {
      ...dateFilter,
      zoneId: { not: null },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  // Obtener nombres de las zonas agrupadas
  const zoneIds = zoneVisitsGroup.map((g) => g.zoneId as string);
  const zonesInfo = await db.zone.findMany({
    where: { id: { in: zoneIds } },
    select: { id: true, name: true },
  });

  const zoneVisits = zoneVisitsGroup.map((g) => {
    const zone = zonesInfo.find((z) => z.id === g.zoneId);
    return {
      name: zone ? zone.name : "Desconocido",
      count: g._count.id,
    };
  });

  // 6. Desglose de visitas por Negocio Individual - Top 10
  const businessVisitsGroup = await db.pageVisit.groupBy({
    by: ["businessId"],
    where: {
      ...dateFilter,
      businessId: { not: null },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  // Obtener nombres y zonas de los negocios agrupados
  const businessIds = businessVisitsGroup.map((g) => g.businessId as string);
  const businessesInfo = await db.business.findMany({
    where: { id: { in: businessIds } },
    select: { id: true, name: true, zone: { select: { name: true } } },
  });

  const businessVisits = businessVisitsGroup.map((g) => {
    const biz = businessesInfo.find((b) => b.id === g.businessId);
    return {
      name: biz ? biz.name : "Desconocido",
      zone: biz ? biz.zone.name : "",
      count: g._count.id,
    };
  });

  // Lista de años para el filtro
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col gap-8">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">📊 Dashboard Estadísticas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Analiza el rendimiento del directorio y los negocios.
          </p>
        </div>
      </div>

      {/* Actualizador del Sistema */}
      <UpdateManager currentCommitSha={process.env.GIT_COMMIT_SHA || "dev-local-sha"} />

      {/* Formulario de Filtros de Fecha */}
      <form method="GET" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Año</label>
          <select
            name="y"
            defaultValue={searchParams.y || ""}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todo el histórico</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mes</label>
          <select
            name="m"
            defaultValue={searchParams.m || ""}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("es-ES", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Día</label>
          <select
            name="d"
            defaultValue={searchParams.d || ""}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los días</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
        >
          Filtrar estadísticas
        </button>
        
        {(searchParams.y || searchParams.m || searchParams.d) && (
          <Link
            href="/panel"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      {/* Tarjetas de Resumen del Periodo / General */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-2xl">👥</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Visitas en el Periodo</span>
          <span className="text-3xl font-extrabold text-slate-900">{totalVisitsPeriod}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-2xl">💼</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Altas en el Periodo</span>
          <span className="text-3xl font-extrabold text-slate-900">{businessesCreatedPeriod}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-2xl">📈</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Total Negocios Activos</span>
          <span className="text-3xl font-extrabold text-slate-900">{totalBusinesses}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <span className="text-2xl">🔑</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">Total Administradores</span>
          <span className="text-3xl font-extrabold text-slate-900">{totalUsers}</span>
        </div>
      </div>

      {/* Gráficos / Tablas de Desglose de Visitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tabla: Visitas a Negocios */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            🔥 Negocios más visitados (Top 10)
          </h3>
          {businessVisits.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No hay registros de visitas en este periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-2">Negocio</th>
                    <th className="px-4 py-2">Zona</th>
                    <th className="px-4 py-2 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {businessVisits.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{v.name}</td>
                      <td className="px-4 py-3 text-xs">{v.zone}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{v.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabla: Visitas por Zona */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            📍 Visitas por Zonas (Top 10)
          </h3>
          {zoneVisits.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No hay registros de visitas en este periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-2">Zona</th>
                    <th className="px-4 py-2 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zoneVisits.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{v.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{v.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabla: Páginas más populares (Paths) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            🌐 Páginas más visitadas (Top 10 URLs)
          </h3>
          {pathVisits.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No hay registros de visitas en este periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-2">Ruta de la página (URL Path)</th>
                    <th className="px-4 py-2 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pathVisits.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{v.path}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{v._count.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
