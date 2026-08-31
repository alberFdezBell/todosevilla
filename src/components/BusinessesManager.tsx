"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  schedule: string | null;
  website: string | null;
  published: boolean;
  categoryId: string;
  zoneId: string;
  ownerId: string | null;
  category: Category;
  zone: Zone;
}

interface BusinessesManagerProps {
  initialBusinesses: Business[];
  categories: Category[];
  zones: Zone[];
  users: User[];
}

export default function BusinessesManager({
  initialBusinesses,
  categories,
  zones,
  users,
}: BusinessesManagerProps) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  
  // Formulario
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [schedule, setSchedule] = useState("");
  const [website, setWebsite] = useState("");
  const [published, setPublished] = useState(true);
  const [ownerId, setOwnerId] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Auto-generar slug a partir de nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingId) {
      setSlug(
        val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9 -]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!categoryId || !zoneId) {
      setError("Debes seleccionar una categoría y una zona válidas.");
      setLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/negocios/${editingId}` : "/api/negocios";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          categoryId,
          zoneId,
          description: description || null,
          address: address || null,
          phone: phone || null,
          schedule: schedule || null,
          website: website || null,
          published,
          ownerId: ownerId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el negocio.");
      }

      if (editingId) {
        setBusinesses(businesses.map((b) => (b.id === editingId ? data : b)));
        setEditingId(null);
      } else {
        setBusinesses([...businesses, data].sort((a, b) => a.name.localeCompare(b.name)));
      }

      // Limpiar y ocultar form
      resetForm();
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al procesar el negocio.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setCategoryId("");
    setZoneId("");
    setDescription("");
    setAddress("");
    setPhone("");
    setSchedule("");
    setWebsite("");
    setPublished(true);
    setOwnerId("");
    setEditingId(null);
    setError("");
  };

  const handleEdit = (biz: Business) => {
    setEditingId(biz.id);
    setName(biz.name);
    setSlug(biz.slug);
    setCategoryId(biz.categoryId);
    setZoneId(biz.zoneId);
    setDescription(biz.description || "");
    setAddress(biz.address || "");
    setPhone(biz.phone || "");
    setSchedule(biz.schedule || "");
    setWebsite(biz.website || "");
    setPublished(biz.published);
    setOwnerId(biz.ownerId || "");
    setError("");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este negocio?")) {
      return;
    }
    setError("");

    try {
      const res = await fetch(`/api/negocios/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar el negocio.");
      }

      setBusinesses(businesses.filter((b) => b.id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al borrar el negocio.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">💼 Gestión de Negocios</h1>
          <p className="text-slate-500 text-sm mt-1">
            Crea y administra las fichas de los comercios y profesionales en el directorio.
          </p>
        </div>
        
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-200"
        >
          {showForm ? "Ocultar formulario" : "Añadir Negocio"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 font-medium">
          ⚠️ {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 flex flex-col gap-6">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-200 pb-2">
            {editingId ? "Editar Negocio" : "Nuevo Negocio"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                required
                placeholder="Ej. Papelería Cervantes"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Slug URL</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="Ej. papeleria-cervantes"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Selecciona categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Selecciona zona</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descripción detallada del negocio..."
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Calle Real, 14, Castilblanco de los Arroyos"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 954000000"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Horario</label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Ej. Lunes a Viernes: 9:00 - 14:00 y 17:00 - 20:00"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sitio Web / Redes</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Ej. www.papeleriacervantes.com"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario Propietario (Opcional)</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Sin propietario (Sólo admin)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mt-4 px-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="published" className="text-sm font-semibold text-slate-700">
                Publicar ficha inmediatamente
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-200 pt-4 mt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition text-sm"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar Negocio"}
            </button>
          </div>
        </form>
      )}

      {/* Listado de Negocios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
        <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
          Negocios registrados ({businesses.length})
        </h3>

        {businesses.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Aún no hay negocios creados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Zona</th>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{biz.name}</td>
                    <td className="px-4 py-3 text-slate-500">{biz.zone.name}</td>
                    <td className="px-4 py-3 text-slate-500">{biz.category.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          biz.published
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {biz.published ? "Publicado" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(biz)}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(biz.id)}
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
  );
}
