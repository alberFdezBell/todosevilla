"use client";

import { useState, useEffect } from "react";

interface UpdateManagerProps {
  currentCommitSha: string;
}

// Repositorio de GitHub a comprobar — configurable vía variable de entorno
// Si no se define NEXT_PUBLIC_GITHUB_REPO, usa el repo del proyecto actual
const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "alberFdezBell/todosevilla";

export default function UpdateManager({ currentCommitSha }: UpdateManagerProps) {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean | null>(null);
  const [remoteSha, setRemoteSha] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDevMode] = useState(currentCommitSha === "dev-local-sha");

  const checkUpdates = async () => {
    setChecking(true);
    setError("");
    setMessage("");

    try {
      // Consultar el último commit del repositorio público en GitHub
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/commits/main`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          cache: "no-store",
        }
      );

      if (res.status === 403) {
        throw new Error(
          "Límite de peticiones de la API de GitHub alcanzado. Espera unos minutos e inténtalo de nuevo."
        );
      }
      if (res.status === 404) {
        throw new Error(
          `Repositorio '${GITHUB_REPO}' no encontrado. Comprueba la variable NEXT_PUBLIC_GITHUB_REPO.`
        );
      }
      if (!res.ok) {
        throw new Error(`Error de la API de GitHub (estado ${res.status}).`);
      }

      const data = await res.json();
      const latestSha: string = data.sha;
      setRemoteSha(latestSha);

      const currentShort = currentCommitSha.trim().substring(0, 7);
      const latestShort = latestSha.trim().substring(0, 7);

      if (isDevMode) {
        setUpdateAvailable(false);
        setMessage(
          `Modo desarrollo detectado. SHA remoto: ${latestShort}. En producción se compararán los SHAs automáticamente.`
        );
      } else if (currentShort !== latestShort) {
        setUpdateAvailable(true);
        setMessage(
          `¡Nueva versión disponible! Versión remota: ${latestShort} · Versión actual: ${currentShort}`
        );
      } else {
        setUpdateAvailable(false);
        setMessage(`✅ El sistema está actualizado a la última versión (${currentShort}).`);
      }
    } catch (err: any) {
      console.error("[UpdateManager] Error al comprobar actualizaciones:", err);
      setError(err.message || "Error al buscar actualizaciones. Revisa la conexión.");
    } finally {
      setChecking(false);
    }
  };

  const triggerUpdate = async () => {
    if (
      !confirm(
        "¿Confirmas el inicio de la actualización?\n\nPortainer redesplegará el servicio en segundo plano con cero caídas. El proceso tarda 1-2 minutos."
      )
    ) {
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
        throw new Error(data.error || "Error al solicitar la actualización.");
      }

      setMessage(
        "🚀 Actualización iniciada. Portainer está redesplegando el servicio con cero caídas. Espera 1-2 minutos y recarga la página."
      );
      setUpdateAvailable(false);
    } catch (err: any) {
      console.error("[UpdateManager] Error al actualizar:", err);
      setError(err.message || "Error al intentar actualizar. Revisa que PORTAINER_WEBHOOK_URL esté configurada.");
    } finally {
      setUpdating(false);
    }
  };

  // ── Estilos inline ──────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #dde2ea",
    borderRadius: "14px",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };

  const btnPrimary: React.CSSProperties = {
    background: "#111",
    color: "#fff",
    fontWeight: 800,
    fontSize: ".82rem",
    padding: "9px 18px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    minHeight: "38px",
    whiteSpace: "nowrap",
    transition: "background .15s ease, transform .15s ease",
    opacity: checking || updating ? 0.5 : 1,
  };

  const btnAccent: React.CSSProperties = {
    background: "#f3d044",
    color: "#111",
    fontWeight: 800,
    fontSize: ".82rem",
    padding: "9px 18px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    minHeight: "38px",
    whiteSpace: "nowrap",
    transition: "background .15s ease, transform .15s ease",
    opacity: updating ? 0.5 : 1,
    boxShadow: "0 4px 12px rgba(243,208,68,.4)",
  };

  const alertSuccess: React.CSSProperties = {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderLeft: "4px solid #16a34a",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: ".82rem",
    color: "#166534",
    fontWeight: 600,
  };

  const alertWarn: React.CSSProperties = {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderLeft: "4px solid #f3d044",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: ".82rem",
    color: "#92400e",
    fontWeight: 600,
  };

  const alertError: React.CSSProperties = {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderLeft: "4px solid #dc2626",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: ".82rem",
    color: "#991b1b",
    fontWeight: 600,
  };

  return (
    <div style={card}>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 style={{ fontWeight: 800, color: "#1f2937", fontSize: "1rem", margin: 0 }}>
            🔄 Actualización del Sistema
          </h3>
          <p style={{ color: "#516173", fontSize: ".8rem", marginTop: "4px" }}>
            Versión actual:{" "}
            <code
              style={{
                background: "#f5f7fb",
                border: "1px solid #d7e0ea",
                borderRadius: "6px",
                padding: "1px 7px",
                fontFamily: "monospace",
                fontWeight: 700,
                color: "#1f2937",
                fontSize: ".78rem",
              }}
            >
              {isDevMode ? "dev-local" : currentCommitSha.substring(0, 7)}
            </code>
            {isDevMode && (
              <span
                style={{
                  marginLeft: "8px",
                  background: "#fff7d1",
                  border: "1px solid #ecd37b",
                  borderRadius: "999px",
                  padding: "1px 8px",
                  fontSize: ".72rem",
                  fontWeight: 800,
                  color: "#92400e",
                }}
              >
                Modo local
              </span>
            )}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={checkUpdates}
            disabled={checking || updating}
            style={btnPrimary}
            onMouseEnter={(e) => { if (!checking && !updating) (e.currentTarget as HTMLElement).style.background = "#333"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#111"; }}
          >
            {checking ? "⏳ Buscando..." : "🔍 Buscar actualizaciones"}
          </button>

          {updateAvailable && (
            <button
              onClick={triggerUpdate}
              disabled={updating}
              style={btnAccent}
              onMouseEnter={(e) => { if (!updating) (e.currentTarget as HTMLElement).style.background = "#e8c63c"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f3d044"; }}
            >
              {updating ? "⏳ Actualizando..." : "🚀 Confirmar actualización"}
            </button>
          )}
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div style={alertError}>
          ⚠️ {error}
        </div>
      )}

      {message && !error && (
        <div style={updateAvailable ? alertWarn : alertSuccess}>
          {message}
        </div>
      )}

      {/* Información adicional */}
      <div style={{ fontSize: ".75rem", color: "#94a3b8", marginTop: "-6px" }}>
        Repositorio: <code style={{ fontFamily: "monospace" }}>{GITHUB_REPO}</code>
        {remoteSha && (
          <> · SHA remoto: <code style={{ fontFamily: "monospace" }}>{remoteSha.substring(0, 7)}</code></>
        )}
      </div>
    </div>
  );
}
