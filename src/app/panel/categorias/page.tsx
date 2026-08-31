import { db } from "@/lib/db";
import CategoriesManager from "@/components/CategoriesManager";

export const revalidate = 0; // Panel dinámico siempre

export default async function CategoriasPanelPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return <CategoriesManager initialCategories={categories} />;
}
