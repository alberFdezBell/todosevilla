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

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "#fff",
    border: "1px solid #d7e0ea",
    borderRadius: "10px",
    fontSize: ".9rem",
    color: "#1f2937",
    outline: "none",
    transition: "border-color .15s ease, box-shadow .15s ease",
    minHeight: "42px",
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: ".72rem",
    fontWeight: 800,
    color: "#516173",
    textTransform: "uppercase" as const,
    letterSpacing: ".06em",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-4 w-full max-w-4xl mx-auto -mt-10 relative z-10"
      style={{
        background: "#fff",
        border: "1px solid #d7e0ea",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,.10)",
        padding: "20px 24px",
      }}
    >
      {/* ¿Qué buscas? */}
      <div className="flex-1 flex flex-col">
        <label style={labelStyle}>¿Qué buscas?</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Papelería, restaurante, fontanero..."
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#f3d044";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(243,208,68,.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#d7e0ea";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* ¿En qué zona? */}
      <div className="md:w-56 flex flex-col">
        <label style={labelStyle}>¿En qué zona?</label>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#f3d044";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(243,208,68,.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#d7e0ea";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <option value="">Toda la zona</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.slug}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categoría */}
      <div className="md:w-52 flex flex-col">
        <label style={labelStyle}>Categoría</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#f3d044";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(243,208,68,.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#d7e0ea";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <option value="">Cualquier categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Botón buscar */}
      <div className="flex items-end">
        <button
          type="submit"
          style={{
            background: "#111",
            color: "#fff",
            fontWeight: 800,
            fontSize: ".9rem",
            padding: "10px 28px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            minHeight: "42px",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#333";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#111";
          }}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
