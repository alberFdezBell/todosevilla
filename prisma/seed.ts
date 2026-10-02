import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos de Todo Sevilla...')

  // 1. Admin default user
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSevilla2026!ChangeMe'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hashedPassword },
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
    },
  })
  console.log('✅ Usuario administrador predeterminado preparado (username: admin)')

  // 2. Categorías
  const categoriasData = [
    { nombre: 'Restaurantes y Bares', slug: 'restaurantes-y-bares', descripcion: 'Tapas, restaurantes, abancerías y terrazas', icono: 'Utensils' },
    { nombre: 'Cafeterías y Pastelerías', slug: 'cafeterias-y-pastelerias', descripcion: 'Desayunos, café de especialidad y dulces tradicionales', icono: 'Coffee' },
    { nombre: 'Comercio Local', slug: 'comercio-local', descripcion: 'Tiendas de barrio, moda, alimentación y artesanía', icono: 'ShoppingBag' },
    { nombre: 'Peluquerías y Estética', slug: 'peluquerias-y-estetica', descripcion: 'Cuidado personal, barberías y estética', icono: 'Scissors' },
    { nombre: 'Salud y Farmacia', slug: 'salud-y-farmacia', descripcion: 'Farmacias, clínicas y salud', icono: 'HeartPulse' },
    { nombre: 'Servicios Profesionales', slug: 'servicios-profesionales', descripcion: 'Asesorías, informática, reformas y talleres', icono: 'Briefcase' },
  ]

  const categoriasMap = new Map<string, string>()
  for (const cat of categoriasData) {
    const created = await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: { nombre: cat.nombre, descripcion: cat.descripcion, icono: cat.icono },
      create: cat,
    })
    categoriasMap.set(cat.slug, created.id)
  }
  console.log(`✅ ${categoriasData.length} Categorías creadas/actualizadas`)

  // 3. Barrios de Sevilla
  const barriosData = [
    {
      nombre: 'Triana',
      slug: 'triana',
      descripcion: 'Barrio histórico a orillas del Guadalquivir, famoso por sus alfarerías, tapas y ambiente flamenco.',
      imagen: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=800&q=80',
    },
    {
      nombre: 'Nervión',
      slug: 'nervion',
      descripcion: 'Zona comercial y residencial moderna de Sevilla, excelente conectividad y gran oferta hostelera.',
      imagen: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    },
    {
      nombre: 'La Macarena',
      slug: 'la-macarena',
      descripcion: 'Barrio tradicional con sus murallas almohades, la Basílica de la Macarena y calles llenas de vida.',
      imagen: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
    },
    {
      nombre: 'Centro / Casco Antiguo',
      slug: 'centro',
      descripcion: 'Corazón monumental y comercial de Sevilla, cerca de la Catedral, Giralda y la Plaza Nueva.',
      imagen: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    },
    {
      nombre: 'Los Remedios',
      slug: 'los-remedios',
      descripcion: 'Barrio señorial situado al sur de Triana, célebre por la Feria de Abril y la Calle Asunción.',
      imagen: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    },
    {
      nombre: 'Alameda - San Lorenzo',
      slug: 'alameda-san-lorenzo',
      descripcion: 'Zona vanguardista y cultural con amplias plazas, terrazas al aire libre y gastronomía alternativa.',
      imagen: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=80',
    },
  ]

  const barriosMap = new Map<string, string>()
  for (const b of barriosData) {
    const created = await prisma.barrio.upsert({
      where: { slug: b.slug },
      update: { nombre: b.nombre, descripcion: b.descripcion, imagen: b.imagen },
      create: b,
    })
    barriosMap.set(b.slug, created.id)
  }
  console.log(`✅ ${barriosData.length} Barrios creados/actualizados`)

  // 4. Negocios de demostración
  const demoDisclaimer = ' (Negocio de demostración / Ejemplo de prueba)'

  const negociosData = [
    {
      nombre: 'Abancería San Jacinto' + demoDisclaimer,
      slug: 'abanceria-san-jacinto-demo',
      barrioSlug: 'triana',
      descripcion: 'Embutidos ibéricos, quesos artesanos de la Sierra de Grazalema y vinos de la tierra en pleno corazón de Triana.',
      direccion: 'Calle San Jacinto 42, 41010 Sevilla',
      telefono: '954221100',
      email: 'contacto@abanceriasanjacinto-demo.es',
      web: 'https://ejemplo-abanceria-triana.es',
      horario: 'Lunes a Sábado: 12:00 - 23:30',
      imagen: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      categoriaSlugs: ['restaurantes-y-bares', 'comercio-local'],
    },
    {
      nombre: 'Café de Especialidad Betis' + demoDisclaimer,
      slug: 'cafe-especialidad-betis-demo',
      barrioSlug: 'triana',
      descripcion: 'Café tostado artesanalmente, tazas de especialidad y tostadas de pringá o aguacate con vistas al río.',
      direccion: 'Calle Betis 18, 41010 Sevilla',
      telefono: '954223344',
      email: 'hola@cafebetis-demo.es',
      web: 'https://ejemplo-cafebetis.es',
      horario: 'Todos los días: 08:30 - 20:00',
      imagen: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      categoriaSlugs: ['cafeterias-y-pastelerias'],
    },
    {
      nombre: 'Peluquería & Barbería Luis de Morales' + demoDisclaimer,
      slug: 'peluqueria-luis-de-morales-demo',
      barrioSlug: 'nervion',
      descripcion: 'Cortes clásicos, arreglos de barba y estilismo moderno para caballero y señora en Nervión.',
      direccion: 'Calle Luis de Morales 14, 41018 Sevilla',
      telefono: '954556677',
      email: 'citas@barberianervion-demo.es',
      web: '',
      horario: 'Lunes a Viernes: 09:30 - 20:30',
      imagen: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      categoriaSlugs: ['peluquerias-y-estetica'],
    },
    {
      nombre: 'Farmacia 24h Macarena' + demoDisclaimer,
      slug: 'farmacia-24h-macarena-demo',
      barrioSlug: 'la-macarena',
      descripcion: 'Atención farmacéutica integral, fórmulas magistrales y servicio 24 horas frente a la muralla.',
      direccion: 'Resolana 8, 41009 Sevilla',
      telefono: '954990011',
      email: 'farmacia24h@macarena-demo.es',
      web: 'https://ejemplo-farmaciamacarena.es',
      horario: 'Abierto 24 horas los 365 días',
      imagen: '',
      categoriaSlugs: ['salud-y-farmacia'],
    },
    {
      nombre: 'Librería Sierpes' + demoDisclaimer,
      slug: 'libreria-sierpes-demo',
      barrioSlug: 'centro',
      descripcion: 'Librería con historia en pleno centro peatonal de Sevilla. Literatura local, novedades y fondo antiguo.',
      direccion: 'Calle Sierpes 55, 41004 Sevilla',
      telefono: '954112233',
      email: 'info@libreriasierpes-demo.es',
      web: 'https://ejemplo-libreriasierpes.es',
      horario: 'Lunes a Sábado: 10:00 - 21:00',
      imagen: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
      categoriaSlugs: ['comercio-local'],
    },
    {
      nombre: 'Taberna Alameda' + demoDisclaimer,
      slug: 'taberna-alameda-demo',
      barrioSlug: 'alameda-san-lorenzo',
      descripcion: 'Tapas creativas, cocina de mercado, opciones veganas y terraza en la Alameda de Hércules.',
      direccion: 'Alameda de Hércules 71, 41002 Sevilla',
      telefono: '954887766',
      email: 'reservas@tabernaalameda-demo.es',
      web: '',
      horario: 'Martes a Domingo: 13:00 - 00:00',
      imagen: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      categoriaSlugs: ['restaurantes-y-bares'],
    },
    {
      nombre: 'Zapatería Artesana Asunción' + demoDisclaimer,
      slug: 'zapateria-asuncion-demo',
      barrioSlug: 'los-remedios',
      descripcion: 'Calzado de piel hecho en España, reparación artesanal y complementos de calidad en Los Remedios.',
      direccion: 'Calle Asunción 23, 41011 Sevilla',
      telefono: '954334455',
      email: '',
      web: '',
      horario: 'Lunes a Viernes: 10:00 - 14:00 y 17:00 - 20:30',
      imagen: '',
      categoriaSlugs: ['comercio-local'],
    },
  ]

  for (const n of negociosData) {
    const barrioId = barriosMap.get(n.barrioSlug)
    if (!barrioId) continue

    const negocio = await prisma.negocio.upsert({
      where: {
        barrioId_slug: {
          barrioId: barrioId,
          slug: n.slug,
        },
      },
      update: {
        nombre: n.nombre,
        descripcion: n.descripcion,
        direccion: n.direccion,
        telefono: n.telefono,
        email: n.email,
        web: n.web,
        horario: n.horario,
        imagen: n.imagen,
      },
      create: {
        nombre: n.nombre,
        slug: n.slug,
        barrioId: barrioId,
        descripcion: n.descripcion,
        direccion: n.direccion,
        telefono: n.telefono,
        email: n.email,
        web: n.web,
        horario: n.horario,
        imagen: n.imagen,
        activo: true,
      },
    })

    // Asignar categorías
    for (const catSlug of n.categoriaSlugs) {
      const catId = categoriasMap.get(catSlug)
      if (catId) {
        await prisma.negocioCategoria.upsert({
          where: {
            negocioId_categoriaId: {
              negocioId: negocio.id,
              categoriaId: catId,
            },
          },
          update: {},
          create: {
            negocioId: negocio.id,
            categoriaId: catId,
          },
        })
      }
    }
  }

  console.log(`✅ ${negociosData.length} Negocios de demostración creados/actualizados`)
  console.log('🎉 Seed de Todo Sevilla completado con éxito.')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed de la base de datos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
