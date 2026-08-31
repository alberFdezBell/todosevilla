import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import LogoutButton from "./LogoutButton";
import PasswordChangeRequired from "./PasswordChangeRequired";

const JWT_SECRET = process.env.JWT_SECRET || "un_secreto_super_seguro_y_largo_para_firmar_los_tokens_jwt_12345";
const key = new TextEncoder().encode(JWT_SECRET);

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  let mustChangePassword = false;
  let userId = "";

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      mustChangePassword = !!payload.mustChangePassword;
      userId = payload.userId as string;
    } catch {
      // Ignorar, el middleware manejará la expiración
    }
  }

  if (mustChangePassword) {
    return <PasswordChangeRequired userId={userId} />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12">
      {/* Sidebar de Navegación del Panel */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-6 self-start">
        <div className="border-b border-slate-800 pb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modo Administrador</p>
          <h2 className="text-xl font-bold text-white mt-1">⚙️ Todo Sevilla</h2>
        </div>

        <nav className="flex flex-col gap-1">
          <Link 
            href="/panel" 
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            📊 Estadísticas
          </Link>
          
          <Link 
            href="/panel/negocios" 
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            💼 Negocios
          </Link>

          <Link 
            href="/panel/zonas" 
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            📍 Zonas
          </Link>

          <Link 
            href="/panel/categorias" 
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            🏷️ Categorías
          </Link>

          <Link 
            href="/panel/documentos" 
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            ⚖️ Textos Legales
          </Link>

          <Link 
            href="/panel/usuarios" 
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            👥 Usuarios
          </Link>

          <Link 
            href="/panel/documentacion" 
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            📖 Documentación
          </Link>
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-auto">
          {/* Botón Logout */}
          <LogoutButton />
        </div>
      </aside>

      {/* Contenido Principal */}
      <section className="flex-1 w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        {children}
      </section>
    </div>
  );
}
