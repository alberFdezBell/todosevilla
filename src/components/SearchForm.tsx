"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchFormProps {
  zones: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
}

export default function SearchForm({ zones, categories }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (query.trim()) params.append("q", query.trim());
    if (selectedCategory) params.append("cat", selectedCategory);

    const queryString = params.toString() ? `?${params.toString()}` : "";

    if (selectedZone) {
      router.push(`/${selectedZone}${queryString}`);
    } else {
      router.push(`/buscar${queryString}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col md:flex-row gap-4 w-full max-w-4xl mx-auto -mt-10 relative z-10">
      <div className="flex-1 flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase px-1">¿Qué buscas?</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Papelería, restaurante, fontanero..."
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
        />
      </div>

      <div className="md:w-60 flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase px-1">¿En qué zona?</label>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
        >
          <option value="">Toda la provincia (Sevilla)</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.slug}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>

      <div className="md:w-60 flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase px-1">Categoría</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
        >
          <option value="">Cualquier categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm shadow-md shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
