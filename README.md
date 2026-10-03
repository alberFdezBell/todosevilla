# Todo Sevilla

Directorio local de negocios de Sevilla, organizado por barrios y categorías.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Docker

---

## Estructura de la aplicación

```
/sevilla               → Portada del directorio
/sevilla/barrios       → Lista de barrios
/sevilla/[barrio]      → Negocios de un barrio
/sevilla/[barrio]/[negocio]  → Ficha de negocio
/sevilla/buscar        → Buscador
/admin                 → Panel de administración (protegido)
/api/health            → Estado de la aplicación y base de datos
```

---

## Desarrollo local

### 1. Requisitos

- Node.js 22+
- Docker (para PostgreSQL)

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores
```

### 3. Levantar PostgreSQL local

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Instalar dependencias y preparar base de datos

```bash
npm install
npx prisma migrate dev
npx prisma db seed    # opcional: datos de ejemplo
```

### 5. Arrancar en modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Comandos útiles en desarrollo

```bash
npm run lint          # ESLint
npm run test          # Tests con Vitest
npm run build         # Build de producción local
npx prisma studio     # Interfaz visual de la base de datos
```

---

## Docker

### Construir imagen

```bash
docker build -t ghcr.io/alberfdezbell/todosevilla:latest .
```

### Publicar imagen en GHCR

```bash
# Autenticarse (solo la primera vez o si caduca el token)
echo $CR_PAT | docker login ghcr.io -u alberfdezbell --password-stdin

# Publicar
docker push ghcr.io/alberfdezbell/todosevilla:latest
```

> `CR_PAT` es un Personal Access Token de GitHub con permisos `write:packages`.
> Créalo en: GitHub → Settings → Developer Settings → Personal access tokens

---

## Producción con Portainer

### Variables de entorno obligatorias

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | Nombre de la base de datos |
| `DATABASE_URL` | URL completa de conexión (ver formato en `.env.example`) |
| `JWT_SECRET` | Secreto para firmar tokens JWT (32+ caracteres aleatorios) |
| `ADMIN_PASSWORD` | Contraseña del admin inicial |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (ej: `https://todosevilla.com`) |

Genera un JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Primer despliegue en Portainer

1. **Construir y publicar la imagen** (desde tu máquina local):
   ```bash
   docker build -t ghcr.io/alberfdezbell/todosevilla:latest .
   docker push ghcr.io/alberfdezbell/todosevilla:latest
   ```

2. **Crear el Stack en Portainer:**
   - Portainer → Stacks → Add stack
   - Name: `todo-sevilla`
   - Build method: `Web editor`
   - Pega el contenido de `docker-compose.yml`
   - En **Environment variables**, añade todas las variables obligatorias
   - Click **Deploy the stack**

3. **Ejecutar migraciones** (solo la primera vez):
   ```bash
   # En el servidor, en el contenedor de la app:
   docker exec todo-sevilla-app npx prisma migrate deploy
   ```

4. **Verificar:**
   ```bash
   curl https://tu-dominio.com/api/health
   # Respuesta esperada: {"status":"healthy","database":"connected"}
   ```

### Actualizar la aplicación

```bash
# 1. En tu máquina local: construir y publicar la nueva imagen
docker build -t ghcr.io/alberfdezbell/todosevilla:latest .
docker push ghcr.io/alberfdezbell/todosevilla:latest

# 2. En Portainer:
#    Stacks → todo-sevilla → Editor → Update the stack

# 3. Verificar que funciona:
curl https://tu-dominio.com/api/health
```

### Rollback manual

```bash
# Si algo va mal, volver a la imagen anterior (etiquetada previamente):
# En el docker-compose.yml de Portainer, cambia:
#   image: ghcr.io/alberfdezbell/todosevilla:latest
# por:
#   image: ghcr.io/alberfdezbell/todosevilla:<sha-anterior>
# y haz Update the stack
```

### Comandos de operación habituales

```bash
# Ver logs de la aplicación
docker logs todo-sevilla-app -f

# Ver logs de PostgreSQL
docker logs todo-sevilla-db -f

# Reiniciar solo la app (sin tocar la base de datos)
docker restart todo-sevilla-app

# Comprobar estado de los contenedores
docker ps

# Acceder a la base de datos directamente
docker exec -it todo-sevilla-db psql -U <POSTGRES_USER> <POSTGRES_DB>
```

---

## Prisma y migraciones

### Desarrollo
```bash
npx prisma migrate dev        # Crea y aplica nueva migración
npx prisma migrate dev --name nombre-del-cambio
```

### Producción
```bash
# Aplica las migraciones pendientes (NO modifica el esquema arbitrariamente)
docker exec todo-sevilla-app npx prisma migrate deploy
```

> **Nunca uses `prisma db push` en producción.** Usa siempre `migrate deploy`.

---

## Backup y restauración de PostgreSQL

### Hacer un backup

```bash
docker exec todo-sevilla-db pg_dump \
  -U <POSTGRES_USER> \
  <POSTGRES_DB> \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restaurar un backup

```bash
# Con la app parada para evitar conflictos:
docker stop todo-sevilla-app

docker exec -i todo-sevilla-db psql \
  -U <POSTGRES_USER> \
  <POSTGRES_DB> \
  < backup-YYYYMMDD-HHMMSS.sql

docker start todo-sevilla-app
```

### Dónde están los datos

El volumen `postgres_data` almacena todos los datos de PostgreSQL.  
Para encontrar su ubicación física en el servidor:

```bash
docker volume inspect todo-sevilla_postgres_data
```

> **Importante:** Copia los backups fuera del servidor (a tu máquina local, NAS, etc.).  
> Un backup en el mismo servidor que la base de datos no es un backup real.

---

## CI (Integración Continua)

Cada `push` o `pull request` a `main` ejecuta automáticamente en GitHub Actions:

1. Instalar dependencias
2. Lint
3. Tests
4. Build

Si alguno falla, el pipeline se detiene. **El despliegue a producción es siempre manual.**

---

## Seguridad

- Contraseñas almacenadas con bcrypt
- Sesión admin mediante JWT en cookie HTTP-only (24h)
- PostgreSQL accesible únicamente dentro de la red Docker (no expuesto al exterior)
- Secrets fuera de Git (`.env` en `.gitignore`)
- Rutas `/admin` y `/api/admin` protegidas por middleware JWT

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| Web pública | ✅ |
| Admin panel | ✅ |
| PostgreSQL | ✅ |
| Prisma ORM | ✅ |
| Docker | ✅ |
| Docker Compose | ✅ |
| Portainer | ✅ Listo para usar |
| Healthcheck `/api/health` | ✅ |
| Persistencia de datos | ✅ |
| Backup manual | ✅ Documentado |
| CI básica (lint/test/build) | ✅ |
| Deploy automático | ❌ No implementado |
| Rollback automático | ❌ No implementado |
| Notificaciones Telegram | ❌ No implementado |
