import { db } from "@/lib/db";
import UsersManager from "@/components/UsersManager";

export const revalidate = 0; // Panel dinámico siempre

export default async function UsuariosPanelPage() {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { email: "asc" },
  });

  return <UsersManager initialUsers={users} />;
}
