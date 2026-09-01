import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import LogoutButton from "./LogoutButton";
import PasswordChangeRequired from "./PasswordChangeRequired";

const JWT_SECRET = process.env.JWT_SECRET || "un_secreto_super_seguro_y_largo_para_firmar_los_tokens_jwt_12345";
const key = new TextEncoder().encode(JWT_SECRET);

const NAV_ITEMS = [
  { href: "/panel",               icon: "📊", label: "Estadísticas" },
  { href: "/panel/negocios",      icon: "💼", label: "Negocios" },
  { href: "/panel/zonas",         icon: "📍", label: "Zonas" },
  { href: "/panel/categorias",    icon: "🏷️",  label: "Categorías" },
  { href: "/panel/documentos",    icon: "⚖️",  label: "Textos Legales" },
  { href: "/panel/usuarios",      icon: "👥", label: "Usuarios" },
  { href: "/panel/documentacion", icon: "📖", label: "Documentación" },
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
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#f4f6f9 0%,#f0f2f5 100%)" }}>

      {/* ── Sidebar (solo escritorio) ── */}
      <aside
        className="hidden lg:flex"
        style={{
          width: "256px",
          flexShrink: 0,
          flexDirection: "column",
          padding: "16px 12px",
          background: "linear-gradient(180deg,#1f1f1f 0%,#232323 100%)",
          boxShadow: "4px 0 18px rgba(0,0,0,.18)",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Brand */}
        <div style={{ paddingBottom: "16px", marginBottom: "8px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <p style={{ fontSize: ".65rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", lineHeight: 1, margin: 0 }}>
            Administración
          </p>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: "4px 0 0" }}>
            ⚙️ Todo Castilblanco
          </h2>
        </div>

        {/* Navegación — hover amarillo definido en globals.css (.panel-nav-link) */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, marginTop: "8px" }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="panel-nav-link">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top bar móvil */}
        <div
          className="lg:hidden"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#1f1f1f", borderBottom: "1px solid rgba(255,255,255,.08)" }}
        >
          <span style={{ color: "#fff", fontWeight: 700, fontSize: ".875rem" }}>⚙️ Todo Castilblanco · Admin</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <Link key={item.href} href={item.href} style={{ color: "#fff", fontSize: ".875rem", padding: "4px 6px", borderRadius: "8px" }} title={item.label}>
                {item.icon}
              </Link>
            ))}
          </div>
        </div>

        {/* Área de contenido */}
        <main style={{ flex: 1, padding: "24px 32px" }}>
          <div style={{ background: "#fff", border: "1px solid #dde2ea", borderRadius: "16px", boxShadow: "0 1px 8px rgba(0,0,0,.06)", padding: "32px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
