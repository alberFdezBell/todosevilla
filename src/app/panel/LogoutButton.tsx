"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900/40 hover:text-red-300 transition text-left flex items-center gap-2"
    >
      {loading ? "Cerrando..." : "🚪 Cerrar Sesión"}
    </button>
  );
}
