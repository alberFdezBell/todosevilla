import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Todo Castilblanco | Directorio de Negocios Locales",
  description: "Encuentra los mejores negocios, profesionales y comercios en Castilblanco de los Arroyos y alrededores.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://todosevilla.aferbel.es"),
  openGraph: {
    title: "Todo Castilblanco | Directorio Local",
    description: "Encuentra comercios y negocios cerca de ti en Castilblanco de los Arroyos.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="flex flex-col min-h-screen" style={{ background: "linear-gradient(180deg,#fff 0%,#f5f7fb 100%)", color: "#1f2937" }}>

        {/* ── Header ── */}
        <header className="header-brand">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#111] hover:opacity-80 transition">
              📍 Todo Castilblanco
            </Link>
            <nav className="flex gap-3 items-center text-sm font-semibold">
              <Link href="/" className="text-[#111] hover:underline underline-offset-4 transition">
                Inicio
              </Link>
              <a
                href="/panel"
                className="bg-[#111] hover:bg-[#333] text-white px-4 py-2 rounded-[10px] transition text-sm font-bold"
                style={{ transition: "background .18s ease, transform .16s ease", display: "inline-block" }}
              >
                Panel Admin
              </a>
            </nav>
          </div>
        </header>

        {/* ── Contenido principal ── */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="footer-brand text-[#111]">
          <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-extrabold text-[#111] text-sm">Todo Castilblanco © {new Date().getFullYear()}</p>
              <p className="text-xs text-[#444] mt-0.5">El directorio local de Castilblanco de los Arroyos.</p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-sm font-bold">
              <Link href="/legal/aviso-legal" className="text-[#111] hover:underline underline-offset-4 transition">Aviso Legal</Link>
              <Link href="/legal/privacidad" className="text-[#111] hover:underline underline-offset-4 transition">Política de Privacidad</Link>
              <Link href="/legal/cookies" className="text-[#111] hover:underline underline-offset-4 transition">Política de Cookies</Link>
              <Link href="/legal/terminos" className="text-[#111] hover:underline underline-offset-4 transition">Condiciones de Uso</Link>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
