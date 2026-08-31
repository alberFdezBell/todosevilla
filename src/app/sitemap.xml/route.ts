import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /sitemap.xml
 * Genera el sitemap dinámicamente con todas las zonas y fichas de negocios.
 * Esto es fundamental para el SEO local del directorio.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://todosevilla.aferbel.es";

  // Obtener zonas y negocios publicados
  const zones = await db.zone.findMany({
    orderBy: { name: "asc" },
  });

  const businesses = await db.business.findMany({
    where: { published: true },
    include: { zone: true },
    orderBy: { updatedAt: "desc" },
  });

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/buscar", priority: "0.8", changefreq: "daily" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${siteUrl}${page.url}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
  </url>`
    )
    .join("")}
  ${zones
    .map(
      (zone) => `
  <url>
    <loc>${siteUrl}/${zone.slug}</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`
    )
    .join("")}
  ${businesses
    .map(
      (biz) => `
  <url>
    <loc>${siteUrl}/${biz.zone.slug}/${biz.slug}</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${biz.updatedAt.toISOString().split("T")[0]}</lastmod>
  </url>`
    )
    .join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
