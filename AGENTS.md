# AGENTS.md — Guía Técnica de Arquitectura para Agentes de IA

> **Instrucción permanente**: Cualquier agente de IA que trabaje en este proyecto **debe mantener `README.md` actualizado** tras cualquier cambio relevante (nueva funcionalidad, cambio de esquema de base de datos, cambio en el flujo de despliegue, nuevas variables de entorno, etc.). Esta instrucción es de máxima prioridad y no puede ignorarse.

---

## Stack Tecnológico y Justificaciones

| Componente | Tecnología | Justificación |
|---|---|---|
| Framework | **Next.js 14 (App Router, TypeScript)** | SSR/SSG para SEO, API routes integradas, un solo servicio. Elegido sobre SvelteKit y Nuxt por el ecosistema más amplio y la familiaridad del propietario. |
| Estilos | **TailwindCSS** | CSS utility-first, sin configuración de bundler adicional. |
| Base de datos | **PostgreSQL 15** | Relaciones claras (zonas ↔ negocios ↔ usuarios ↔ visitas). Soporta escrituras concurrentes de analítica sin bloqueos. SQLite descartado por riesgo de bloqueos en writes simultáneos. |
| ORM | **Prisma** | Migraciones versionadas, tipado fuerte, seed declarativo. |
| Autenticación | **JWT (jose) + bcrypt + cookies httpOnly** | Sin dependencias externas de sesión. jose es compatible con Next.js Edge Middleware. |
| Contenedores | **Docker Swarm (single node)** | Elegido sobre blue-green manual para tener rolling updates y rollback nativos sin gestionar un proxy inverso adicional. |
| Proxy local | **Nginx** | Termina TLS autofirmado para el panel en red local (puerto 8080). No expone el panel al túnel de Cloudflare. |
| CI/CD | **GitHub Actions → GHCR** | Repositorio público, sin credenciales de registro. |
| Actualizaciones | **Portainer Webhook** | El panel llama al webhook tras verificar el SHA del commit con la API pública de GitHub. |
| Analítica | **Server-side cookieless** (tabla `PageVisit`) | Sin cookies, sin Google Analytics, sin banner de consentimiento. IPs no almacenadas. |

---

## Estructura de Carpetas

```
todo castilblanco/
├── .github/
│   └── workflows/
│       └── docker-build.yml        # CI/CD: build + push a GHCR al push en main
├── nginx/
│   ├── nginx.conf                  # Proxy inverso HTTPS para panel local
│   └── certs/                      # Certificados SSL autofirmados (generados en arranque)
├── prisma/
│   ├── schema.prisma               # Esquema de base de datos (fuente de verdad)
│   ├── seed.js                     # Datos iniciales: admin + documentos legales
│   └── migrations/                 # Migraciones versionadas (generadas por Prisma CLI)
├── public/
│   ├── robots.txt                  # Bloquea /panel y /api del rastreo SEO
│   └── images/
│       └── direccion.webp          # [PLACEHOLDER] Imagen de la dirección fiscal del titular
├── src/
│   ├── middleware.ts               # Protege /panel/* y bloquea acceso vía Cloudflare
│   ├── lib/
│   │   ├── db.ts                   # Singleton Prisma Client
│   │   └── analytics.ts            # Registro de visitas server-side cookieless
│   ├── app/
│   │   ├── layout.tsx              # Layout principal con header y footer con enlaces legales
│   │   ├── globals.css             # Tailwind directives y estilos globales
│   │   ├── page.tsx                # Landing: buscador + zonas + negocios recientes
│   │   ├── buscar/page.tsx         # Resultados de búsqueda global
│   │   ├── [zone_slug]/
│   │   │   ├── page.tsx            # Listado de negocios de una zona (con filtros)
│   │   │   └── [business_slug]/
│   │   │       └── page.tsx        # Ficha de negocio con JSON-LD LocalBusiness
│   │   ├── legal/
│   │   │   └── [slug]/page.tsx     # Páginas legales dinámicas (cargadas desde DB)
│   │   ├── sitemap.xml/route.ts    # Sitemap dinámico para SEO
│   │   ├── panel/
│   │   │   ├── layout.tsx          # Layout del panel con sidebar de navegación
│   │   │   ├── LogoutButton.tsx    # Componente cliente para cerrar sesión
│   │   │   ├── page.tsx            # Dashboard: estadísticas + UpdateManager
│   │   │   ├── login/page.tsx      # Página de inicio de sesión del panel
│   │   │   ├── categorias/page.tsx
│   │   │   ├── zonas/page.tsx
│   │   │   ├── negocios/page.tsx
│   │   │   ├── usuarios/page.tsx
│   │   │   ├── documentos/page.tsx # Editor de textos legales
│   │   │   └── documentacion/page.tsx # README.md renderizado en vivo
│   │   └── api/
│   │       ├── health/route.ts     # Health check para Docker Swarm
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   └── logout/route.ts
│   │       ├── system/
│   │       │   └── update/route.ts # Dispara webhook de Portainer
│   │       ├── categorias/
│   │       │   ├── route.ts        # POST
│   │       │   └── [id]/route.ts   # PUT, DELETE
│   │       ├── zonas/
│   │       │   ├── route.ts        # POST
│   │       │   └── [id]/route.ts   # PUT, DELETE
│   │       ├── negocios/
│   │       │   ├── route.ts        # POST
│   │       │   └── [id]/route.ts   # PUT, DELETE
│   │       ├── usuarios/
│   │       │   ├── route.ts        # POST
│   │       │   └── [id]/route.ts   # PUT, DELETE
│   │       └── documentos/
│   │           └── [id]/route.ts   # PUT
│   └── components/
│       ├── SearchForm.tsx          # Buscador principal (cliente)
│       ├── UpdateManager.tsx       # Comprobador de actualizaciones (cliente)
│       ├── CategoriesManager.tsx   # CRUD categorías (cliente)
│       ├── ZonesManager.tsx        # CRUD zonas (cliente)
│       ├── BusinessesManager.tsx   # CRUD negocios (cliente)
│       ├── UsersManager.tsx        # CRUD usuarios (cliente)
│       └── LegalDocsManager.tsx    # Editor de documentos legales (cliente)
├── Dockerfile                      # Multi-etapa: deps → build → runner
├── entrypoint.sh                   # Backup pg_dump + prisma migrate deploy + node server.js
├── docker-compose.yml              # Stack de producción Swarm
├── docker-compose.dev.yml          # Solo PostgreSQL para desarrollo local
├── nginx/nginx.conf                # Nginx con TLS autofirmado en puerto 8080
├── next.config.js                  # output: standalone + cabeceras HTTP de seguridad
├── .env.example                    # Plantilla de variables de entorno
├── .gitignore
├── README.md                       # Manual del administrador (MANTENER ACTUALIZADO)
├── AGENTS.md                       # Este archivo (arquitectura para IAs)
└── INICIAR.md                      # Guía de configuración inicial desde cero
```

---

## Esquema de Base de Datos

```prisma
User            // Administradores y futuros propietarios de negocios
Category        // Categorías de negocios (libre creación desde el panel)
Zone            // Zonas geográficas de la provincia de Sevilla
Business        // Fichas de negocios (relaciona zona, categoría y opcionalmente usuario)
PageVisit       // Registro de visitas server-side cookieless (sin IP, sin cookies)
LegalDocument   // Textos legales editables desde el panel (Aviso Legal, Privacidad, etc.)
```

### Relaciones clave
- `Business` → `Zone` (Many-to-One, obligatorio)
- `Business` → `Category` (Many-to-One, obligatorio)
- `Business` → `User` (Many-to-One, **nullable** — campo `ownerId` pensado para el futuro login de propietarios)
- `PageVisit` → `Zone` (nullable, para visitas a páginas de zona)
- `PageVisit` → `Business` (nullable, para visitas a fichas de negocio)

---

## Flujo de Despliegue y Actualizaciones Sin Caídas

### Estrategia elegida: Docker Swarm de un solo nodo (Opción A)

**Por qué Swarm y no blue-green manual:**
- Swarm ofrece rolling updates nativos con `update_config.order: start-first`.
- El rollback basado en healthchecks es automático, sin scripts adicionales.
- Portainer gestiona stacks Swarm con interfaz visual, sin SSH al servidor.
- Un solo nodo es suficiente para este volumen esperado.

### Flujo completo de actualización

```
push a main
   ↓
GitHub Actions (3-5 min)
   → npm ci + prisma generate + npm run build
   → GIT_COMMIT_SHA inyectado
   → docker build + push ghcr.io/alberfdezbell/todosevilla:latest
   ↓
Admin pulsa "Buscar actualizaciones" en /panel
   → fetch api.github.com/repos/alberFdezBell/todosevilla/commits/main
   → compara SHA remoto vs process.env.GIT_COMMIT_SHA
   → si difieren → "Actualización disponible"
   ↓
Admin confirma → POST /api/system/update
   → fetch PORTAINER_WEBHOOK_URL (POST)
   ↓
Portainer descarga ghcr.io/alberfdezbell/todosevilla:latest
   (imagen publicada con doble tag: `latest` + SHA corto del commit para trazabilidad)
   (el webhook de Portainer fuerza un re-pull de `latest` siempre, comparando digest en GHCR)
   → levanta nuevo contenedor (start-first)
   → nuevo contenedor ejecuta entrypoint.sh:
       1. pg_isready (esperar BD) — usando una URL "libpq-safe" SIN el parámetro ?schema=public
          (ese parámetro es exclusivo del driver de Prisma y hace fallar a pg_isready/psql/pg_dump)
       2. pg_try_advisory_lock(123456) en Postgres para evitar race conditions
          - Si adquiere el lock: comprueba GIT_COMMIT_SHA vs /backups/last_deployed_sha.txt
          - Si NO adquiere el lock (otra réplica lo tiene): espera bloqueado hasta que se libere, luego continúa sin repetir tareas
       3. SI ES DIFERENTE (Actualización):
          - pg_dump (URL libpq-safe) → /backups/backup_TIMESTAMP.sql
          - Conservar solo los últimos 10 backups (.sql) y borrar el resto
          - npx prisma migrate deploy
          - node prisma/seed.js (check-first: no duplica admin ni documentos ya editados)
          - Guardar el nuevo SHA en /backups/last_deployed_sha.txt
       4. SI ES IGUAL (Reinicio normal):
          - Saltar backups, limpieza, migraciones y seed para evitar saturación de disco y DB
       5. pg_advisory_unlock(123456)
       6. node server.js
   → Docker espera healthcheck GET /api/health
     (start_period: 60s para absorber migraciones largas, monitor: 60s antes de confirmar el rollout)
   → SI PASA: retira el contenedor viejo → tráfico conmutado
   → SI FALLA: contenedor nuevo eliminado, viejo sigue activo (rollback)
```

### Límites del sistema de rollback

| Escenario | Comportamiento |
|---|---|
| Fallo de compilación (GitHub Actions) | No se publica imagen nueva, producción no cambia |
| Fallo de migración de BD en entrypoint | Contenedor sale con código 1, Swarm hace rollback de la app |
| Fallo del healthcheck | Swarm no retira el contenedor viejo |
| **Migración aplicada + app cae después** | ⚠️ Rollback de app NO revierte la BD. Restaurar backup manual |
| Corrupción de datos en lógica de aplicación | Solo detectable por el administrador, no automático |

---

## Convenciones de Código

- **Idioma del código**: inglés (variables, funciones, nombres de archivo).
- **Idioma de comentarios y documentación**: español.
- **Componentes "use client"**: solo los que usan hooks de React (useState, useRouter, etc.). Todo lo demás es Server Component.
- **API Routes**: todas las rutas de API son sin autenticación propia porque el middleware `src/middleware.ts` ya protege `/panel/*`. Las rutas `/api/*` del panel solo son llamadas desde dentro de `/panel`.
- **Migraciones Prisma**: **siempre aditivas y retrocompatibles**. No se deben eliminar columnas ni cambiar tipos en una sola migración si hay datos en producción. Primero añadir la columna nueva (nullable), migrar los datos, y en una segunda migración eliminar la antigua.

---

## Seguridad del Panel de Administración

El panel en `/panel` está protegido por una **barrera física de red en Nginx** y una **capa lógica en la aplicación**:

1. **Aislamiento Físico de Red (Proxy Inverso Nginx)**: 
   - El túnel de Cloudflare apunta al servicio Nginx en el puerto interno `http://proxy:80` (en lugar de conectarse directo a la app).
   - Nginx en el puerto 80 atiende las peticiones públicas del túnel y aplica reglas `location` estrictas que rechazan inmediatamente con HTTP 403 cualquier ruta que empiece por `/panel` o `/api/system`. Esto impide que el tráfico externo llegue al servidor Next.js de administración.
   - El panel de administración local se sirve en el puerto seguro `https://proxy:443` (mapeado al puerto local `8080`), donde Nginx no tiene filtros de ruta y permite el acceso completo a `/panel`.

2. **Middleware de la App y Autenticación Stateless**:
   - Si por un error de configuración del túnel el tráfico público se saltara Nginx y golpease la app directamente en el puerto `3000`, el middleware de Next.js (`src/middleware.ts`) detecta de inmediato las cabeceras `cf-connecting-ip` o `cf-ray` y retorna HTTP 403.
   - La autenticación es **100% stateless**. Se basa en un token JWT firmado de forma criptográfica del lado del servidor utilizando `JWT_SECRET` y guardado en una cookie `httpOnly` de 7 días. Ningún estado se guarda en la memoria del servidor ni en disco local. Esto permite balancear la carga entre múltiples réplicas (si se decide escalar) sin necesidad de configurar sesiones pegajosas (sticky sessions) ni almacenamiento compartido de sesiones (ej. Redis).

---

## Entornos

| Variable | Desarrollo | Producción |
|---|---|---|
| `DATABASE_URL` | `postgresql://todosevilla_dev:...@localhost:5432/todosevilla_dev` | `postgresql://admin:PASS@db:5432/todosevilla` (servicio Docker) |
| `ADMIN_EMAIL` | `admin@todosevilla.es` | Configurado en Portainer Stack |
| `ADMIN_PASSWORD` | Valor del `.env` local | Configurado en Portainer Stack |
| `JWT_SECRET` | Valor del `.env` local | Secreto aleatorio en Portainer Stack |
| `PORTAINER_WEBHOOK_URL` | No funcional en dev | URL del webhook del stack en Portainer |
| `GIT_COMMIT_SHA` | `dev-local-sha` | Inyectado por GitHub Actions en build |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://todosevilla.aferbel.es` |
| `CLOUDFLARE_TUNNEL_TOKEN`| No funcional en dev | Token del túnel en el panel web (Portainer Stack) |

---

## Recordatorios para el Próximo Agente de IA

1. **Actualiza `README.md`** tras cualquier cambio relevante. Es una instrucción permanente.
2. Las **migraciones Prisma deben ser aditivas**. Consulta la tabla de límites del rollback.
3. El **panel nunca debe quedar accesible desde internet**. Si añades nuevas rutas en `/panel`, el middleware existente ya las protege (aplica a `/panel/:path*`). Además, Nginx bloquea `/panel` y `/api/system` en el puerto 80 (público) a nivel de red.
4. La analítica es **cookieless**. No introduzcas cookies de terceros ni scripts externos de análisis.
5. Si añades nuevas variables de entorno, **actualiza `.env.example`** con documentación.
6. La imagen `public/images/direccion.webp` es un **placeholder**: el administrador debe subir la imagen real con la dirección fiscal antes de publicar.
7. **`seed.js` es idempotente por diseño**: usa check-first (busca antes de crear). El admin solo se crea si no existe. Los documentos legales también. Esto significa que las ediciones realizadas desde el panel (`/panel/documentos`) **no se pierden** en actualizaciones.
8. **`ADMIN_PASSWORD` no tiene valor por defecto**. Si se omite la variable en el stack, el seed lanza un error y el contenedor sale con código 1 (Swarm hace rollback). La contraseña temporal del seed activa `mustChangePassword: true`, que obliga al cambio en el primer login antes de poder usar el panel.
9. **Advisory lock de Postgres** (ID `123456`): el `entrypoint.sh` usa `pg_try_advisory_lock` para garantizar que solo un contenedor ejecuta migraciones y backup simultáneamente. No modificar este mecanismo sin revisar las implicaciones en escenarios de rollback.
10. **Configuración de Red Swarm (dnsrr) en Proxmox**: Se utiliza `endpoint_mode: dnsrr` en los servicios `db` y `app` para prevenir problemas de enrutamiento de IPVS (IP Virtual Server) dentro de la red overlay del kernel de Linux, habituales en contenedores LXC de Proxmox. No cambiar a VIP sin validar antes la estabilidad de red.
11. **`?schema=public` solo lo entiende Prisma**: las herramientas `libpq` (`pg_isready`, `psql`, `pg_dump`) fallan con `invalid URI query parameter`. El `entrypoint.sh` deriva `LIBPQ_URL` quitando la query string con `cut -d'?' -f1` y usa esa URL para todo lo que no sea Prisma. No devolver el `?schema=public` a esas llamadas.
12. **`nginx.conf` resuelve `app` en runtime**: se usa `resolver 127.0.0.11` + `proxy_pass` con variable (`set $app_upstream`) porque con `endpoint_mode: dnsrr` el DNS de Swarm solo publica el nombre del servicio cuando tiene tareas vivas. No volver al `proxy_pass http://app:3000;` literal sin resolver, o nginx abortará con `host not found in upstream` en arranques en caliente.
13. **`GIT_COMMIT_SHA` no tiene que redefinirse en el compose**: la variable se inyecta como ENV en la imagen durante el build (ARG GIT_COMMIT_SHA desde GitHub Actions). Definirla en el stack de Portainer (aunque sea vacía) sobrescribe el valor de la imagen y rompe el comparador de actualizaciones del panel.
