import { db } from "@/lib/db";
import LegalDocsManager from "@/components/LegalDocsManager";

export const revalidate = 0; // Panel dinámico siempre

export default async function DocumentosPanelPage() {
  const docs = await db.legalDocument.findMany({
    orderBy: { slug: "asc" },
  });

  return <LegalDocsManager initialDocs={docs} />;
}
