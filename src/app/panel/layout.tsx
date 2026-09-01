import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import LogoutButton from "./LogoutButton";
import PasswordChangeRequired from "./PasswordChangeRequired";

const JWT_SECRET = process.env.JWT_SECRET || "un_secreto_super_seguro_y_largo_para_firmar_los_tokens_jwt_12345";
const key = new TextEncoder().encode(JWT_SECRET);

const NAV_ITEMS = [
  { href: "/panel",              icon: "📊", label: "Estadísticas" },
  { href: "/panel/negocios",     icon: "💼", label: "Negocios" },
  { href: "/panel/zonas",        icon: "📍", label: "Zonas" },
  { href: "/panel/categorias",   icon: "🏷️",  label: "Categorías" },
  { href: "/panel/documentos",   icon: "⚖️",  label: "Textos Legales" },
  { href: "/panel/usuarios",     icon: "👥", label: "Usuarios" },
  { href: "/panel/documentacion",icon: "📖", label: "Documentación" },
];

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
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #f4f6f9 0%, #f0f2f5 100%)" }}>

      {/* ── Sidebar de Navegación del Panel ── */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 py-4 px-3"
        style={{
          background: "linear-gradient(180deg, #1f1f1f 0%, #232323 100%)",
          boxShadow: "4px 0 18px rgba(0,0,0,.18)",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-2 pb-4 mb-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}
        >
          <span style={{ fontSize: "1.3rem" }}>⚙️</span>
          <div>
            <p style={{ fontSize: ".65rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", lineHeight: 1 }}>
              Administración
            </p>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.3 }}>
              Todo Castilblanco
            </h2>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex flex-col gap-1.5 flex-1 mt-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="panel-nav-link flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-150"
              style={{ color: "#fff", textDecoration: "none" }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div
          className="mt-auto pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}
        >
          <LogoutButton />
        </div>
      </aside>

        <div
          className="lg:hidden flex items-center justify-between px-4 py-3"
          style={{ background: "#1f1f1f", borderBottom: "1px solid rgba(255,255,255,.08)" }}
        >
          <span className="text-white font-bold text-sm">⚙️ Todo Castilblanco · Admin</span>
          {/* Nav móvil simplificada */}
          <div className="flex gap-2">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="p-1.5 rounded-lg text-sm"
                style={{ color: "#fff" }}
                title={item.label}
              >
                {item.icon}
              </Link>
            ))}
          </div>
        </div>

        <main
          className="flex-1 p-6 md:p-8"
          style={{ background: "transparent" }}
        >
          <div
            className="w-full rounded-2xl p-6 md:p-8"
            style={{
              background: "#fff",
              border: "1px solid #dde2ea",
              boxShadow: "0 1px 8px rgba(0,0,0,.06)",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
