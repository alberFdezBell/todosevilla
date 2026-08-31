"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: Date | string;
}

interface LegalDocsManagerProps {
  initialDocs: LegalDocument[];
}

export default function LegalDocsManager({ initialDocs }: LegalDocsManagerProps) {
  const router = useRouter();
  const [docs, setDocs] = useState<LegalDocument[]>(initialDocs);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEdit = (doc: LegalDocument) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setError("");
  };

  const handleCancel = () => {
    setEditingDoc(null);
    setTitle("");
    setContent("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/documentos/${editingDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el documento.");
      }

      setDocs(docs.map((d) => (d.id === editingDoc.id ? data : d)));
      setEditingDoc(null);
      setTitle("");
      setContent("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al editar el texto legal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">⚖️ Textos Legales y Privacidad</h1>
        <p className="text-slate-500 text-sm mt-1">
          Modifica los documentos obligatorios de la web (Aviso Legal, RGPD, Cookies, Términos) de forma dinámica.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 font-medium">
          ⚠️ {error}
        </div>
      )}

      {editingDoc ? (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-800 text-lg">
              Editando: {editingDoc.title}
            </h3>
            <span className="text-xs text-slate-400 font-mono">slug: {editingDoc.slug}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Título del Documento</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Contenido (HTML permitido)
            </label>
            <p className="text-xs text-slate-400 -mt-1 mb-1">
              Puedes utilizar etiquetas HTML básicas como <code>&lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;</code> para dar formato.
              Para la dirección fiscal, puedes incluir la etiqueta de la imagen: <br />
              <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">
                &lt;img src="/images/direccion.webp" alt="Dirección postal de contacto" style="vertical-align: middle; max-height: 24px; display: inline-block;" /&gt;
              </code>
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={16}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono leading-relaxed"
            />
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-200 pt-4 mt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            Documentos legales del sitio
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docs.map((doc) => (
              <div 
                key={doc.id} 
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{doc.title}</h4>
                  <span className="text-xs text-slate-400 font-mono">URL: /legal/{doc.slug}</span>
                  <p className="text-xs text-slate-400 mt-2">
                    Última actualización: {new Date(doc.updatedAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
                
                <button
                  onClick={() => handleEdit(doc)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition text-center"
                >
                  📝 Editar texto legal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
