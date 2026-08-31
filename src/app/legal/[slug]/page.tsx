import { db } from "@/lib/db";
import { recordVisit } from "@/lib/analytics";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60; // Revalidar documentos legales cada minuto

interface LegalPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const doc = await db.legalDocument.findUnique({
    where: { slug: params.slug },
  });

  if (!doc) return {};

  return {
    title: `${doc.title} | Todo Sevilla`,
    description: `Texto oficial de ${doc.title} del directorio Todo Sevilla.`,
  };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = params;

  // Obtener el documento legal desde la base de datos
  const doc = await db.legalDocument.findUnique({
    where: { slug },
  });

  if (!doc) {
    notFound();
  }

  // Registrar visita server-side
  await recordVisit({ path: `/legal/${slug}` });

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <nav className="text-sm font-medium text-slate-500 flex gap-2">
        <Link href="/" className="hover:underline">Inicio</Link>
        <span>/</span>
        <span className="text-slate-800">{doc.title}</span>
      </nav>

      <article className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">
        {/* Usamos prose para estilos de artículos en HTML de forma simple */}
        <div 
          className="prose prose-slate max-w-none 
            prose-headings:font-bold prose-headings:text-slate-900
            prose-h1:text-3xl prose-h1:mb-6 prose-h1:border-b prose-h1:pb-4
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:text-slate-600
            prose-li:mb-1.5"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />
        
        <div className="text-xs text-slate-400 mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-2">
          <span>Última actualización: {new Date(doc.updatedAt).toLocaleDateString("es-ES")}</span>
          <span>Este texto legal sirve como base y debe ser revisado por profesionales jurídicos.</span>
        </div>
      </article>
    </div>
  );
}
