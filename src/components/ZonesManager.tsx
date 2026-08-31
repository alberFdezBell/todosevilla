"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Zone {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface ZonesManagerProps {
  initialZones: Zone[];
}

export default function ZonesManager({ initialZones }: ZonesManagerProps) {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-generar slug a partir de nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingId) {
      setSlug(
        val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // quitar acentos
          .replace(/[^a-z0-9 -]/g, "") // quitar carácteres inválidos
          .replace(/\s+/g, "-") // espacios por guiones
          .replace(/-+/g, "-") // colapsar guiones múltiples
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = editingId ? `/api/zonas/${editingId}` : "/api/zonas";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al guardar la zona.");
      }

      if (editingId) {
        setZones(zones.map((z) => (z.id === editingId ? data : z)));
        setEditingId(null);
      } else {
        setZones([...zones, data].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setName("");
      setSlug("");
      setDescription("");
      setSeoTitle("");
      setSeoDescription("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al procesar la zona.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zone: Zone) => {
    setEditingId(zone.id);
    setName(zone.name);
    setSlug(zone.slug);
    setDescription(zone.description || "");
    setSeoTitle(zone.seoTitle || "");
    setSeoDescription(zone.seoDescription || "");
    setError("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setSeoTitle("");
    setSeoDescription("");
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta zona?")) {
      return;
    }
    setError("");

    try {
      const res = await fetch(`/api/zonas/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar la zona.");
      }

      setZones(zones.filter((z) => z.id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al borrar la zona.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">📍 Gestión de Zonas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Crea, edita o elimina las zonas geográficas del directorio (ej. Castilblanco de los Arroyos).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulario Crear/Editar */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-200/60 pb-2">
            {editingId ? "Editar Zona" : "Nueva Zona"}
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="Ej. Castilblanco de los Arroyos"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Slug URL</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="Ej. castilblanco-de-los-arroyos"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción pública</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descripción breve de la localidad para los visitantes..."
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
            />
          </div>

          <div className="border-t border-slate-200/60 pt-4 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SEO Técnico</span>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Título SEO (meta title)</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Ej. Negocios en Castilblanco | Todo Sevilla"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción SEO (meta description)</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                placeholder="Descripción para resultados de motores de búsqueda..."
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {loading ? "Guardando..." : editingId ? "Guardar" : "Crear"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Listado de Zonas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            Zonas creadas ({zones.length})
          </h3>

          {zones.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Aún no hay zonas creadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Slug</th>
                    <th className="px-4 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{zone.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{zone.slug}</td>
                      <td className="px-4 py-3 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(zone)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
