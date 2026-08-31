"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesManagerProps {
  initialCategories: Category[];
}

export default function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-generar slug a partir de nombre si no está editando el slug manualmente
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
      const url = editingId ? `/api/categorias/${editingId}` : "/api/categorias";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al guardar la categoría.");
      }

      if (editingId) {
        setCategories(categories.map((c) => (c.id === editingId ? data : c)));
        setEditingId(null);
      } else {
        setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setName("");
      setSlug("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al procesar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setError("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      return;
    }
    setError("");

    try {
      const res = await fetch(`/api/categorias/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar la categoría.");
      }

      setCategories(categories.filter((c) => c.id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al borrar la categoría.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">🏷️ Gestión de Categorías</h1>
        <p className="text-slate-500 text-sm mt-1">
          Crea, edita o elimina las categorías de negocios que se mostrarán en el directorio.
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
            {editingId ? "Editar Categoría" : "Nueva Categoría"}
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="Ej. Papelerías"
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
              placeholder="Ej. papelerias"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800 font-mono"
            />
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

        {/* Listado de Categorías */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            Categorías creadas ({categories.length})
          </h3>

          {categories.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Aún no hay categorías creadas.</p>
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
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{cat.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                      <td className="px-4 py-3 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
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
