"use client";

import { useState } from "react";

interface UpdateManagerProps {
  currentCommitSha: string;
}

export default function UpdateManager({ currentCommitSha }: UpdateManagerProps) {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean | null>(null);
  const [remoteSha, setRemoteSha] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const checkUpdates = async () => {
    setChecking(true);
    setError("");
    setMessage("");
    try {
      // Leer el último commit desde el repo público de GitHub
      const res = await fetch(
        "https://api.github.com/repos/alberFdezBell/todosevilla/commits/main"
      );
      if (!res.ok) {
        throw new Error("No se pudo conectar con la API de GitHub.");
      }
      const data = await res.json();
      const latestSha = data.sha;
      setRemoteSha(latestSha);

      // Limpiar los SHA para comparar de forma segura (los primeros 7 chars o completos)
      const currentClean = currentCommitSha.trim().substring(0, 7);
      const latestClean = latestSha.trim().substring(0, 7);

      if (currentClean !== latestClean && currentCommitSha !== "dev-local-sha") {
        setUpdateAvailable(true);
        setMessage(`¡Actualización pendiente detectada! Nueva versión: ${latestClean}`);
      } else {
        setUpdateAvailable(false);
        setMessage("El sistema ya está actualizado a la última versión.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al buscar actualizaciones.");
    } finally {
      setChecking(false);
    }
  };

  const triggerUpdate = async () => {
    if (!confirm("¿Estás seguro de que deseas iniciar la actualización del sistema?")) {
      return;
    }
    setUpdating(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/system/update", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al solicitar actualización.");
      }

      setMessage(
        "¡Actualización iniciada! Portainer está redesplegando el servicio en segundo plano con cero caídas. Esto puede tardar entre 1 y 2 minutos."
      );
      setUpdateAvailable(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al intentar actualizar.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
      <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Actualización del Sistema</h3>
          <p className="text-xs text-slate-500 mt-1">
            Versión actual (Git Commit):{" "}
            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs font-semibold">
              {currentCommitSha.substring(0, 7)}
            </code>
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={checkUpdates}
            disabled={checking || updating}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            {checking ? "Buscando..." : "Buscar actualizaciones"}
          </button>
          
          {updateAvailable && (
            <button
              onClick={triggerUpdate}
              disabled={updating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {updating ? "Actualizando..." : "Confirmar actualización"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-xl border border-red-100 font-medium">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="bg-blue-50 text-blue-700 text-xs px-3.5 py-2 rounded-xl border border-blue-100 font-medium">
          ℹ️ {message}
        </div>
      )}
    </div>
  );
}
