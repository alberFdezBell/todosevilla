"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordChangeRequired({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading("Guardando...");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error.");
        setLoading("");
        return;
      }

      setSuccess("Contraseña cambiada con éxito. Redirigiendo...");
      setTimeout(() => {
        router.push("/panel/login");
        router.refresh();
      }, 2000);
    } catch {
      setError("Error de conexión.");
      setLoading("");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl max-w-md w-full border border-slate-200">
        <div className="text-center mb-6">
          <span className="text-4xl">🔒</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">Cambio de Contraseña Requerido</h1>
          <p className="text-slate-500 text-sm mt-2">
            Por motivos de seguridad, debe cambiar la contraseña temporal asignada en el primer inicio de sesión.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 text-sm p-4 rounded-xl mb-4 border border-green-100">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nueva Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
              required
              disabled={!!success}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Repite la contraseña"
              required
              disabled={!!success}
            />
          </div>

          <button
            type="submit"
            disabled={!!loading || !!success}
            className="mt-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition duration-200 shadow-md shadow-blue-500/10 disabled:opacity-50"
          >
            {loading || "Cambiar contraseña y cerrar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
