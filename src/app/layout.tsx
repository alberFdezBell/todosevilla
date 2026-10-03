import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Todo Sevilla — Directorio de Negocios y Barrios de Sevilla',
    template: '%s | Todo Sevilla',
  },
  description:
    'Directorio local para descubrir comercios, restaurantes, bares, cafeterías y servicios por barrios en Sevilla.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/todosevilla.ico', sizes: 'any' },
      { url: '/todosevilla.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/todosevilla.ico',
    apple: '/todosevilla.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/sevilla',
    siteName: 'Todo Sevilla',
    title: 'Todo Sevilla — Directorio de Negocios y Barrios de Sevilla',
    description:
      'Descubre comercios, bares, peluquerías y servicios locales en Triana, Nervión, Macarena, Centro y todos los barrios de Sevilla.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className="flex flex-col min-h-screen antialiased">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
