# Todo Sevilla

Directorio local de negocios de Sevilla, organizado por barrios y categorías.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Docker

---

## Rutas de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/sevilla` | Portada del directorio |
| `/sevilla/barrios` | Lista de barrios |
| `/sevilla/[barrio]` | Negocios de un barrio |
| `/sevilla/[barrio]/[negocio]` | Ficha de negocio |
| `/sevilla/buscar` | Buscador |
| `/admin` | Panel de administración (protegido por JWT) |
| `/api/health` | Estado de la aplicación y base de datos |

---

## Desarrollo local

### Requisitos

- Node.js 22+
- Docker

### 1. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores
```

### 2. Levantar PostgreSQL local

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 3. Instalar dependencias y preparar base de datos

```bash
npm install
npx prisma migrate dev
```

### 4. (Opcional) Cargar datos de ejemplo

```bash
npx prisma db seed
```

> El seed crea barrios, categorías y negocios de demostración, y el usuario administrador inicial.  
> **No ejecutar el seed en producción** a menos que sea la instalación inicial y quieras datos de ejemplo.

### 5. Arrancar en modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Comandos útiles

```bash
npm run lint          # ESLint
npm run test          # Tests con Vitest
npm run build         # Compilar en modo producción
npx prisma studio     # Interfaz visual de la base de datos
npx prisma migrate dev --name nombre   # Nueva migración
```

---

## Prisma y migraciones

### Desarrollo
```bash
npx prisma migrate dev        # Crea y aplica migración nueva
```

### Producción
El contenedor ejecuta automáticamente al arrancar:
```bash
npx prisma migrate deploy     # Aplica migraciones pendientes sin modificar el esquema
```

> **Nunca uses `prisma db push` en producción.** Solo `migrate deploy`.

---

## Despliegue en Portainer desde GitHub

Portainer obtiene el código directamente del repositorio Git y construye la imagen con Docker.  
No necesitas construir ni publicar imágenes manualmente.

### Variables de entorno requeridas

Configúralas en Portainer al crear el Stack (sección **Environment variables**):

| Variable | Obligatoria | Ejemplo | Descripción |
|----------|-------------|---------|-------------|
| `POSTGRES_USER` | ✅ Sí | `todosevilla` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | ✅ Sí | `MiContraseñaSegura` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | ✅ Sí | `todosevilla_db` | Nombre de la base de datos |
| `JWT_SECRET` | ✅ Sí | *(cadena aleatoria 32+ chars)* | Secreto para firmar tokens JWT de sesión admin |
| `ADMIN_PASSWORD` | ✅ Sí | `MiPasswordAdmin` | Contraseña del usuario `admin` inicial |
| `NEXT_PUBLIC_APP_URL` | ✅ Sí | `https://todosevilla.com` | URL pública de la aplicación |

Genera un JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Nota:** `DATABASE_URL` se construye automáticamente dentro del `docker-compose.yml` usando las variables anteriores. No necesitas introducirla por separado en Portainer.

### Primer despliegue paso a paso

**PASO 1 — Abrir Portainer y crear el Stack**

1. Entra en Portainer
2. Ve a **Stacks → Add stack**
3. Pon nombre al stack: `todo-sevilla`
4. Selecciona **Git Repository**

**PASO 2 — Configurar el repositorio**

| Campo | Valor |
|-------|-------|
| Repository URL | `https://github.com/alberFdezBell/todosevilla` |
| Repository reference | `refs/heads/main` |
| Compose path | `docker-compose.yml` |

> Si el repositorio es privado, añade tus credenciales de GitHub en **Authentication**.

**PASO 3 — Configurar variables de entorno**

En la sección **Environment variables**, añade todas las variables de la tabla anterior con sus valores de producción.

**PASO 4 — Desplegar**

Pulsa **Deploy the stack**.

Portainer clonará el repositorio, construirá la imagen con el `Dockerfile` y levantará los contenedores.

> La primera vez, el build puede tardar 3-5 minutos. PostgreSQL tarda unos segundos en inicializarse antes de que arranque la app.

**PASO 5 — Verificar**

```bash
# Desde el servidor o desde tu red local (reemplaza el host/puerto):
curl http://tu-servidor:3000/api/health
```

Respuesta esperada:
```json
{"status":"healthy","database":"connected"}
```

Abre en el navegador:
- `https://tu-dominio/sevilla` → directorio público
- `https://tu-dominio/admin` → panel de administración (usuario: `admin`, contraseña: la de `ADMIN_PASSWORD`)

---

### Actualizar la aplicación

```
1. Haz cambios en el código y git push a main
2. Entra en Portainer → Stacks → todo-sevilla
3. Pulsa "Update the stack"
4. Marca la opción "Re-pull image" si está disponible, o "Force rebuild"
5. Portainer obtiene el nuevo código, reconstruye la imagen y reinicia el contenedor
6. PostgreSQL mantiene su volumen — los datos no se pierden
7. Verifica /api/health
```

> ⚠️ **Nunca uses `docker compose down -v`** para actualizar. Eso elimina el volumen y borra todos los datos de PostgreSQL. Usa siempre `Update the stack` en Portainer, o `docker compose up -d --build` desde la línea de comandos.

---

### Rollback manual

Si algo va mal tras una actualización:

1. En Portainer → Stacks → todo-sevilla → Editor
2. Si usas Git Repository mode: en **Repository**, selecciona el commit anterior (puedes cambiar la referencia a un SHA o tag concreto)
3. Pulsa **Update the stack**
4. Portainer reconstruirá desde el código anterior

---

## Comandos de operación

```bash
# Ver logs de la aplicación
docker logs todo-sevilla-app -f

# Ver logs de PostgreSQL
docker logs todo-sevilla-db -f

# Reiniciar solo la aplicación
docker restart todo-sevilla-app

# Estado de los contenedores
docker ps

# Acceder a la base de datos
docker exec -it todo-sevilla-db psql -U <POSTGRES_USER> <POSTGRES_DB>

# Comprobar healthcheck
curl http://localhost:3000/api/health
```

---

## Backup y restauración de PostgreSQL

### Hacer backup

```bash
docker exec todo-sevilla-db pg_dump \
  -U <POSTGRES_USER> <POSTGRES_DB> \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restaurar backup

```bash
# Detener la app para evitar escrituras durante la restauración
docker stop todo-sevilla-app

docker exec -i todo-sevilla-db psql \
  -U <POSTGRES_USER> <POSTGRES_DB> \
  < backup-YYYYMMDD-HHMMSS.sql

docker start todo-sevilla-app
```

### Dónde están los datos

```bash
docker volume inspect todo-sevilla_postgres_data
```

> ⚠️ Copia los backups fuera del servidor. Un backup en el mismo servidor no te protege si falla el disco.

---

## CI (Integración Continua)

Cada push a `main` ejecuta en GitHub Actions:

1. Instalar dependencias
2. Lint
3. Tests
4. Build

Si algo falla, el pipeline lo detecta. **El despliegue a producción es siempre manual desde Portainer.**

---

## Seguridad

- Contraseñas almacenadas con bcrypt
- Sesión admin mediante JWT en cookie HTTP-only (24h de validez)
- PostgreSQL accesible únicamente dentro de la red Docker interna (no expuesto al exterior)
- Secretos fuera de Git — solo `.env.example` en el repositorio
- Rutas `/admin` y `/api/admin/*` protegidas por middleware JWT

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| Web pública | ✅ |
| Panel de administración | ✅ |
| PostgreSQL | ✅ |
| Prisma ORM + migraciones | ✅ |
| Docker multi-stage | ✅ |
| Docker Compose (build desde repo) | ✅ |
| Portainer Git Repository | ✅ Listo |
| Healthcheck `/api/health` | ✅ |
| Persistencia de datos | ✅ Volumen `postgres_data` |
| Migraciones automáticas al arrancar | ✅ `migrate deploy` en entrypoint |
| Backup manual documentado | ✅ |
| CI básica (lint/test/build) | ✅ GitHub Actions |
| Deploy automático | ❌ No implementado |
| Rollback automático | ❌ No implementado |
| Notificaciones Telegram | ❌ No implementado |
