import { db } from "@/lib/db";
import BusinessesManager from "@/components/BusinessesManager";

export const revalidate = 0; // Panel dinámico siempre

export default async function NegociosPanelPage() {
  const businesses = await db.business.findMany({
    include: {
      category: true,
      zone: true,
    },
    orderBy: { name: "asc" },
  });

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  const zones = await db.zone.findMany({
    orderBy: { name: "asc" },
  });

  const users = await db.user.findMany({
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  return (
    <BusinessesManager
      initialBusinesses={businesses}
      categories={categories}
      zones={zones}
      users={users}
    />
  );
}
