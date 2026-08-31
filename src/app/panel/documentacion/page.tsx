import { readFile } from "fs/promises";
import path from "path";

export const revalidate = 0;

export default async function DocumentacionPanelPage() {
  let readmeContent = "";

  try {
    const readmePath = path.join(process.cwd(), "README.md");
    readmeContent = await readFile(readmePath, "utf-8");
  } catch {
    readmeContent = "# Documentación no disponible\n\nNo se encontró el archivo `README.md` en la raíz del proyecto.";
  }

  // Renderizamos el README como pre-formatted text. En producción se podría añadir
  // una librería como `marked` para renderizarlo como HTML completo, pero esto evita
  // añadir dependencias adicionales manteniendo la función principal.
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">📖 Documentación</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manual de uso del directorio Todo Sevilla, extraído directamente del archivo <code>README.md</code>.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 overflow-x-auto">
        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
          {readmeContent}
        </pre>
      </div>
    </div>
  );
}
