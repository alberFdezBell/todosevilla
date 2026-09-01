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
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-150"
      style={{
        background: "rgba(255,255,255,.06)",
        color: "rgba(255,255,255,.7)",
        border: "1px solid rgba(255,255,255,.08)",
        cursor: loading ? "wait" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLElement).style.background = "#dc2626";
          (e.currentTarget as HTMLElement).style.color = "#fff";
          (e.currentTarget as HTMLElement).style.border = "1px solid #dc2626";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.06)";
        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.7)";
        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,.08)";
      }}
    >
      🚪 {loading ? "Cerrando sesión..." : "Cerrar Sesión"}
    </button>
  );
}
