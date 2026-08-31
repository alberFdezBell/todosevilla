import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Todo Sevilla | Directorio de Negocios Locales",
  description: "Encuentra los mejores negocios, profesionales y comercios en la provincia de Sevilla clasificados por zonas y categorías.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://todosevilla.aferbel.es"),
  openGraph: {
    title: "Todo Sevilla | Directorio Local",
    description: "Encuentra comercios y negocios cerca de ti en Sevilla.",
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
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <header className="header-gradient text-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-90">
              📍 Todo Sevilla
            </Link>
            <nav className="flex gap-6 items-center text-sm font-medium">
              <Link href="/" className="hover:underline">Inicio</Link>
              <a 
                href="/panel" 
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 transition"
              >
                Panel Admin
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
          <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="font-semibold text-slate-300">Todo Sevilla © {new Date().getFullYear()}</p>
              <p className="text-xs text-slate-500 mt-1">El directorio local definitivo de Sevilla.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              <Link href="/legal/aviso-legal" className="hover:text-white transition">Aviso Legal</Link>
              <Link href="/legal/privacidad" className="hover:text-white transition">Política de Privacidad</Link>
              <Link href="/legal/cookies" className="hover:text-white transition">Política de Cookies</Link>
              <Link href="/legal/terminos" className="hover:text-white transition">Condiciones de Uso</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
