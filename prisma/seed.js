const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // 1. Crear usuario administrador
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ERROR CRÍTICO DE SEGURIDAD: Las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD son estrictamente obligatorias para inicializar la base de datos y no deben tener valores por defecto en producción.");
  }
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'admin',
        mustChangePassword: true // Forzar cambio de contraseña obligatorio en el primer inicio de sesión
      }
    });
    console.log(`Usuario administrador creado con éxito: ${adminEmail}. (Cambio de contraseña requerido en el primer login).`);
  } else {
    console.log(`Usuario administrador ya existe: ${adminEmail}`);
  }

  // 2. Crear documentos legales iniciales
  const legalDocs = [
    {
      slug: 'aviso-legal',
      title: 'Aviso Legal',
      content: `<h1>Aviso Legal</h1>
<p>En cumplimiento de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), le informamos de los datos identificativos del titular de este sitio web:</p>
<ul>
  <li><strong>Titular:</strong> [PLACEHOLDER_TITULAR]</li>
  <li><strong>NIF/NIE:</strong> [PLACEHOLDER_NIF]</li>
  <li><strong>Dirección Postal:</strong> <img src="/images/direccion.webp" alt="Dirección postal de contacto" style="vertical-align: middle; max-height: 24px; display: inline-block;" /></li>
  <li><strong>Email de contacto:</strong> [PLACEHOLDER_EMAIL]</li>
</ul>
<p>Este sitio web es un directorio de negocios locales de la provincia de Sevilla.</p>`
    },
    {
      slug: 'privacidad',
      title: 'Política de Privacidad',
      content: `<h1>Política de Privacidad</h1>
<p>De conformidad con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), le informamos sobre el tratamiento de sus datos personales:</p>
<p><strong>Responsable del Tratamiento:</strong> [PLACEHOLDER_TITULAR], con NIF [PLACEHOLDER_NIF], dirección en <img src="/images/direccion.webp" alt="Dirección postal de contacto" style="vertical-align: middle; max-height: 24px; display: inline-block;" /> y correo [PLACEHOLDER_EMAIL].</p>
<p><strong>Encargados del Tratamiento:</strong> El tráfico de red es gestionado por Cloudflare Inc. como intermediario del túnel de red, quien procesa la dirección IP de los visitantes en tránsito por motivos de seguridad y entrega de contenido. Nosotros no almacenamos la dirección IP completa en nuestra base de datos ni asociamos cookies a los visitantes.</p>
<p><strong>Finalidad y Datos Recogidos:</strong> La web recoge estadísticas de visitas agregadas de forma anónima y cookieless. En el futuro, si se habilita el registro de negocios, trataremos los datos de registro necesarios para la gestión del servicio.</p>
<p><strong>Derechos:</strong> Puede ejercer sus derechos de acceso, rectificación, supresión y otros ante el Responsable del Tratamiento enviando un correo electrónico a [PLACEHOLDER_EMAIL].</p>`
    },
    {
      slug: 'cookies',
      title: 'Política de Cookies',
      content: `<h1>Política de Cookies</h1>
<p>Este sitio web <strong>no utiliza cookies de seguimiento de terceros ni de análisis comercial</strong> que requieran el consentimiento del usuario de acuerdo con la directiva ePrivacy y la normativa española de la AEPD.</p>
<p>Únicamente se realiza una analítica estadística server-side de carácter totalmente anónimo y cookieless para conocer las visitas a la web y negocios individuales, sin recopilar datos personales del usuario.</p>`
    },
    {
      slug: 'terminos',
      title: 'Condiciones de Uso',
      content: `<h1>Condiciones de Uso</h1>
<p>Bienvenido al directorio de negocios <strong>Todo Sevilla</strong>. El acceso y uso de este sitio web le atribuye la condición de usuario e implica la aceptación de estas condiciones.</p>
<p><strong>Responsabilidad de los Contenidos:</strong> La información contenida en las fichas de los negocios proviene de fuentes públicas o es suministrada por los propios administradores. [PLACEHOLDER_TITULAR] no se hace responsable de la veracidad ni exactitud de los datos proporcionados por terceros.</p>
<p>Queda prohibida la reproducción total o parcial de los contenidos del sitio web sin autorización expresa.</p>`
    }
  ];

  for (const doc of legalDocs) {
    const existingDoc = await prisma.legalDocument.findUnique({
      where: { slug: doc.slug }
    });

    if (!existingDoc) {
      await prisma.legalDocument.create({ data: doc });
      console.log(`Documento legal creado: ${doc.slug}`);
    } else {
      console.log(`Documento legal ya existe: ${doc.slug}`);
    }
  }

  console.log('Seed de la base de datos completado.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
