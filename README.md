# Todo Sevilla — Directorio Local v0.1

[![CI/CD Pipeline](https://github.com/alberFdezBell/todosevilla/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/alberFdezBell/todosevilla/actions/workflows/ci-cd.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black.svg)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-5a67d8.svg)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com)

**Todo Sevilla** es una plataforma web moderna que funciona como unas **Páginas Amarillas rápidas, intuitivas y elegantes para descubrir comercios, bares, restaurantes, peluquerías y servicios profesionales en los distintos barrios de Sevilla**.

---

## 📋 Índice

1. [Objetivo del Proyecto](#1-objetivo-del-proyecto)
2. [Stack Tecnológico y Justificación](#2-stack-tecnológico-y-justificación)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Requisitos Previos](#5-requisitos-previos)
6. [Instalación y Desarrollo Local](#6-instalación-y-desarrollo-local)
7. [Variables de Entorno](#7-variables-de-entorno)
8. [Base de Datos y Migraciones](#8-base-de-datos-y-migraciones)
9. [Panel de Administración (`/admin`) y Seguridad](#9-panel-de-administración-admin-y-seguridad)
10. [Búsqueda y Filtros](#10-búsqueda-y-filtros)
11. [Tests Automatizados](#11-tests-automatizados)
12. [Docker y Contenedores](#12-docker-y-contenedores)
13. [Pipeline de CI/CD y Portainer](#13-pipeline-de-cicd-y-portainer)
14. [Healthchecks y Rollback](#14-healthchecks-y-rollback)
15. [Notificaciones de Telegram](#15-notificaciones-de-telegram)
16. [Estrategia de Backups y Restauración](#16-estrategia-de-backups-y-restauración)
17. [Optimización SEO y Accesibilidad](#17-optimización-seo-y-accesibilidad)
18. [Páginas Legales y Privacidad](#18-páginas-legales-y-privacidad)
19. [Troubleshooting / Resolución de Problemas](#19-troubleshooting--resolución-de-problemas)

---

## 1. Objetivo del Proyecto

El propósito de **Todo Sevilla** es potenciar el comercio local de cercanía estructurando la información bajo el concepto:

```text
Sevilla → Barrio → Negocio
```

### Funcionalidades de la Versión v0.1:
- **Web pública (`/sevilla`)**: Portada responsive mobile-first, buscador con autocompletado en tiempo real, selección dinámica de descubrimiento de negocios, catálogo por barrios y estadísticas reales (sin datos falsos).
- **Listado de Barrios (`/sevilla/barrios`)**: Vista panorámica de todos los barrios activos con contador real de comercios.
- **Página de Barrio (`/sevilla/[barrioSlug]`)**: Filtro y listado de negocios pertenecientes al barrio.
- **Ficha de Negocio (`/sevilla/[barrioSlug]/[businessSlug]`)**: Información detallada con **supresión estricta de campos vacíos** y datos estructurados Schema.org (`LocalBusiness`).
- **Panel de Administración (`/admin`)**: Dashboard interactivo protegido con autenticación JWT en cookies HTTP-only y posibilidad de restricción por subred local (IP).
- **CRUD Completo de Barrios**: Creación, edición, activación/desactivación y **protección de eliminación** (impide eliminar un barrio si posee negocios vinculados).
- **CRUD Completo de Negocios**: Creación, edición, borrado, activación/desactivación y asignación de categorías.
- **CRUD Completo de Categorías**: Gestión de categorías (Restauración, Servicios, etc.).

---

## 2. Stack Tecnológico y Justificación

| Tecnología | Rol | Justificación |
| :--- | :--- | :--- |
| **Next.js 14 (App Router)** | Framework Frontend & Backend | Excelente soporte nativo para SSR/SSG/ISR, rutas API integradas, optimización de imágenes y SEO out-of-the-box. Producción standalone super ligera. |
| **TypeScript** | Lenguaje | Tipado estático para prevenir errores en tiempo de compilación y garantizar mantenibilidad. |
| **Tailwind CSS** | Estilos | Diseño responsive mobile-first rápido, consistente y estilizado con la paleta temática de Sevilla (Albero, Carmesí, Azulejo). |
| **PostgreSQL 16** | Base de Datos Relacional | Motor robusto, con transacciones ACID, indexación de texto e ILIKE para búsquedas parciales rápidas. |
| **Prisma ORM** | Capa de Datos | ORM tipado con migraciones declarativas y sistema de seeding simplificado. |
| **Docker & Docker Compose** | Contenedorización | Garantiza un entorno idéntico entre desarrollo local y producción. |
| **GitHub Actions** | CI/CD | Automatización de linter, tests, build, etiquetado de imagen y despliegue controlado. |
| **Portainer** | Orquestación en Producción | Despliegue mediante Stacks basados en imágenes versionadas e inmutables. |
| **Vitest** | Testing Framework | Ejecución ultra-rápida de unit tests e integración. |

---

## 3. Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO / NAVEGADOR                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │   Web Pública     │           │   Panel Admin     │
       │    (/sevilla)     │           │     (/admin)      │
       └─────────┬─────────┘           └─────────┬─────────┘
                 │                               │
                 │                               │ (Auth Cookie + IP Check)
                 └───────────────┬───────────────┘
                                 ▼
                   ┌───────────────────────────┐
                   │  Next.js Server App       │
                   │  (Standalone Docker Cont) │
                   └─────────────┬─────────────┘
                                 │ (Prisma Client)
                                 ▼
                   ┌───────────────────────────┐
                   │  PostgreSQL Database      │
                   │  (Persistent Volume Data) │
                   └───────────────────────────┘
```

---

## 4. Estructura del Proyecto

```text
todo-sevilla/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # Workflow de CI/CD para GitHub Actions
├── prisma/
│   ├── schema.prisma          # Esquema de la base de datos PostgreSQL
│   └── seed.ts                # Datos iniciales y demo de Sevilla
├── src/
│   ├── app/
│   │   ├── api/               # API Routes (health, search, admin CRUD)
│   │   ├── admin/             # Rutas del Panel de Administración
│   │   ├── sevilla/           # Rutas de la Web Pública
│   │   ├── aviso-legal/       # Página Legal
│   │   ├── privacidad/        # Política de Privacidad
│   │   ├── terminos-y-condiciones/ # Términos de uso
│   │   ├── contacto/          # Página de Contacto
│   │   ├── not-found.tsx      # Página 404 personalizada
│   │   ├── error.tsx          # Manejo de errores 500
│   │   ├── sitemap.ts         # Generador dinámico de Sitemap XML
│   │   └── robots.ts          # Generador de robots.txt
│   ├── components/            # Componentes UI (Header, Footer, SearchBar, AdminLayout)
│   ├── lib/                   # Librerías (Prisma singleton, Auth JWT, Slugify utils)
│   └── middleware.ts          # Middleware de autenticación e IP para /admin
├── tests/
│   └── todo-sevilla.test.ts   # Suite de tests automatizados Vitest
├── Dockerfile                 # Multi-stage Dockerfile
├── docker-compose.yml         # Stack de Producción
├── docker-compose.dev.yml     # DB local para desarrollo
├── .env.example               # Plantilla de variables de entorno
├── .gitignore                 # Reglas de exclusión Git
├── README.md                  # Documentación principal
└── FLUJO.md                   # Guía paso a paso para el desarrollador
```

---

## 5. Requisitos Previos

- **Node.js**: v20 o v22 LTS instalado.
- **Docker Desktop / Docker Engine**: Con Docker Compose habilitado.
- **Git**: Para control de versiones.

---

## 6. Instalación y Desarrollo Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/alberFdezBell/todosevilla.git
   cd todosevilla
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar entorno**:
   ```bash
   cp .env.example .env
   ```

4. **Arrancar la base de datos PostgreSQL de desarrollo (Docker)**:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

5. **Ejecutar migraciones y popular base de datos con Seed**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

6. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

7. **Acceder en el navegador**:
   - Web Pública: `http://localhost:3000/sevilla`
   - Panel de Administración: `http://localhost:3000/admin` (Credenciales por defecto: usuario `admin` / contraseña `AdminSevilla2026!ChangeMe`).

---

## 7. Variables de Entorno

Consulta `.env.example` para la lista completa de variables:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://todosevilla:todosevillapass@localhost:5432/todosevilla_db?schema=public"

# Entorno y Servidor
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Seguridad Admin
JWT_SECRET="super-secreto-cambiar-en-produccion-32-chars-min"
ADMIN_PASSWORD="AdminSevilla2026!ChangeMe"

# Restricción de red local para /admin
RESTRICT_ADMIN_IP="false"
ALLOWED_ADMIN_IPS="127.0.0.1,::1,192.168.1.0/24,10.0.0.0/8"

# Telegram Bot
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyZ"
TELEGRAM_CHAT_ID="-1001234567890"
```

---

## 8. Base de Datos y Migraciones

La persistencia de datos está desacoplada del código fuente mediante un volumen de Docker (`postgres_data`).

### Aplicar cambios de esquema:
```bash
npx prisma migrate dev --name descripcion_de_cambio
```

### Ejecutar Seed de nuevo:
```bash
npx prisma db seed
```

---

## 9. Panel de Administración (`/admin`) y Seguridad

El acceso a `/admin` está protegido con un esquema multicapa:

1. **Autenticación mediante Tokens JWT**: Token cifrado almacenado en una Cookie de servidor `HTTP-Only`, `SameSite=Lax`.
2. **Restricción por Red Local (Opcional)**: Al activar `RESTRICT_ADMIN_IP=true`, el middleware de Next.js verifica la IP del cliente y deniega el acceso con un error `403 Forbidden` si proviene de fuera de las subredes autorizadas (`192.168.x.x`, `10.x.x.x`, `127.0.0.1`).
3. **Protección de Eliminación de Barrios**: No se permite eliminar accidentalmente un barrio con negocios activos vinculados. La API responde con un error indicando la cantidad de negocios afectados.

---

## 10. Búsqueda y Filtros

El buscador soporta coincidencias parciales case-insensitive (acentos ignorados):
- Nombre de negocio (ej. `"bar"`, `"café"`)
- Barrio (ej. `"Triana"`, `"Nervión"`)
- Descripción y dirección de comercios
- Categoría asignada

*Nota*: Los negocios inactivos (`activo = false`) o cuyos barrios estén inactivos **nunca se muestran** en los resultados de la web pública.

---

## 11. Tests Automatizados

Para ejecutar la suite de pruebas unitarias e integración con Vitest:

```bash
npm run test
```

Los tests verifican:
- Autogeneración de slugs y limpiador de caracteres especiales.
- Regla de protección en la eliminación de barrios.
- Filtrado de negocios inactivos en búsquedas.
- Supresión de campos vacíos en la vista pública.
- Validaciones en frontend y backend.

---

## 12. Docker y Contenedores

La aplicación utiliza una imagen multi-stage reducida basada en Node 22 Alpine:

### Construir e iniciar stack en producción:
```bash
docker compose up -d --build
```

### Comprobar estado de contenedores:
```bash
docker compose ps
```

---

## 13. Pipeline de CI/CD y Portainer

### ⚠️ REGLA FUNDAMENTAL DE DESPLIEGUE

> **PORTAINER NO DESPLIEGA DIRECTAMENTE CADA COMMIT DE `main`.** Un `git push` no modifica la producción de inmediato.

### Flujo de Trabajo en GitHub Actions:
```text
  GitHub Push (main)
         │
         ▼
 ┌───────────────┐
 │ GitHub Actions│ ───► Run Lint & Vitest Tests & Next Build
 └───────┬───────┘
         │ (¿Todo OK?)
         ├─── NO ──► 🔴 Telegram Build Fallido (Producción Intacta)
         │
         ▼ (SÍ)
 ┌───────────────┐
 │ Docker Build  │ ───► Tag Versionada (ej. ghcr.io/.../todo-sevilla:v0.1.0-abc1234)
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │ Push a GHCR   │ ───► Publica la imagen oficial validada
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │ Deploy Stack  │ ───► Webhook a Portainer para desplegar versión concreta
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │ Healthcheck   │ ───► GET /api/health
 └───────┬───────┘
         ├─── OK ──► 🚀 Telegram "Producción Actualizada"
         └─── KO ──► 🔴 Telegram "Despliegue Fallido / Rollback"
```

---

## 14. Healthchecks y Rollback

### Endpoint de Healthcheck:
```text
GET /api/health
```
Retorna un código HTTP `200 OK` comprobando la conexión real a PostgreSQL:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-02T19:00:00.000Z",
  "database": "connected",
  "service": "Todo Sevilla API v0.1"
}
```

### Procedimiento de Rollback:
Si una versión desplegada no supera el healthcheck post-deploy:
1. El pipeline envía una alerta crítica a Telegram.
2. En Portainer, accede al Stack **Todo Sevilla** -> **Re-deploy**.
3. Cambia la variable `IMAGE_TAG` al tag anterior (ej. `v0.1.0-xyz9876`).
4. Haz clic en **Update the stack**.

---

## 15. Notificaciones de Telegram

Configura `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en los Secrets de GitHub para recibir notificaciones automáticas de:
- 🟢 **Build Correcto y Publicado**
- 🔴 **Build Fallido**
- 🚀 **Producción Actualizada**
- 🔴 **Despliegue / Healthcheck Fallido**

---

## 16. Estrategia de Backups y Restauración

### Crear un Backup de la Base de Datos PostgreSQL:
```bash
docker exec -t todo-sevilla-db pg_dump -U todosevilla -d todosevilla_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar un Backup:
```bash
cat backup_20261002.sql | docker exec -i todo-sevilla-db psql -U todosevilla -d todosevilla_db
```

---

## 17. Optimización SEO y Accesibilidad

- **URLs Amigables**: `/sevilla/[barrioSlug]/[businessSlug]`
- **Sitemap XML Dinámico**: Generado en `/sitemap.xml` incluyendo automáticamente todos los barrios y negocios activos.
- **Datos Estructurados Schema.org**: Implementación de JSON-LD `LocalBusiness` en cada ficha de negocio.
- **Meta-tags y OpenGraph**: Generación dinámica de títulos y descripciones SEO para compartir en redes sociales.
- **Accesibilidad**: Marcado semántico HTML5, navegación por teclado y contraste adecuado.

---

## 18. Páginas Legales y Privacidad

Páginas disponibles listas para producción con placeholders legales:
- `/aviso-legal`
- `/privacidad`
- `/terminos-y-condiciones`
- `/contacto`

> **Atención**: Antes de publicar en un dominio comercial final, edita los placeholders `[NOMBRE DEL TITULAR]`, `[NIF]`, `[DOMICILIO]` y `[EMAIL]` en los archivos situados en `src/app/(legal)`.

---

## 19. Troubleshooting / Resolución de Problemas

### 1. El contenedor `app` no arranca por error de conexión a DB:
Asegúrate de que el contenedor de PostgreSQL está saludable (`docker compose ps`) y de que la cadena `DATABASE_URL` utiliza el nombre del servicio `postgres:5432`.

### 2. Error 403 en `/admin`:
Verifica si la variable `RESTRICT_ADMIN_IP` está en `true` y si tu IP local se encuentra dentro de `ALLOWED_ADMIN_IPS`.

### 3. Las imágenes de negocios no cargan:
Asegúrate de que las URLs proporcionadas sean accesibles públicamente con HTTPS.

---

*Desarrollado con ❤️ para la ciudad de Sevilla.*
