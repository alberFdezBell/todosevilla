import { db } from "@/lib/db";
import ZonesManager from "@/components/ZonesManager";

export const revalidate = 0; // Panel dinámico siempre

export default async function ZonasPanelPage() {
  const zones = await db.zone.findMany({
    orderBy: { name: "asc" },
  });

  return <ZonesManager initialZones={zones} />;
}
