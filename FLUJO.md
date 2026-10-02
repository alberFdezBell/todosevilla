# FLUJO.MD — MANUAL DE DESARROLLO Y OPERACIONES

Este documento es una guía práctica paso a paso para desarrollar, probar, desplegar y mantener **Todo Sevilla**.

---

## 1. Clonar el Repositorio

Abre la terminal y ejecuta:

```bash
git clone https://github.com/alberFdezBell/todosevilla.git
cd todosevilla
```

---

## 2. Instalar Dependencias

Instala las dependencias exactas con Node.js v20+:

```bash
npm install
```

---

## 3. Configurar `.env`

Copia el archivo de ejemplo a `.env`:

```bash
cp .env.example .env
```

Asegúrate de que las variables básicas para desarrollo local estén configuradas:

```env
DATABASE_URL="postgresql://todosevilla:todosevillapass@localhost:5432/todosevilla_db?schema=public"
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="mi-clave-secreta-para-desarrollo-local"
ADMIN_PASSWORD="AdminSevilla2026!ChangeMe"
RESTRICT_ADMIN_IP="false"
```

---

## 4. Arrancar Desarrollo Local

1. Levanta la base de datos PostgreSQL local en Docker:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Genera el cliente de Prisma y ejecuta las migraciones + seed:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

3. Arranca el servidor de desarrollo de Next.js:
   ```bash
   npm run dev
   ```

4. **Acceso a las URLs del proyecto**:
   - Web Pública: `http://localhost:3000/sevilla`
   - Listado de Barrios: `http://localhost:3000/sevilla/barrios`
   - Barrio Triana: `http://localhost:3000/sevilla/triana`
   - Panel de Administración: `http://localhost:3000/admin`
   - Healthcheck: `http://localhost:3000/api/health`

---

## 5. Desarrollar y Modificar el Proyecto

Al realizar cambios en el código:
- Los componentes de interfaz se recargan automáticamente (Fast Refresh).
- Si modificas el archivo `prisma/schema.prisma`, ejecuta `npx prisma db push` para actualizar la BD.

---

## 6. Comprobaciones Locales (Obligatorio Antes de Commit)

Antes de guardar y subir tus cambios a Git, ejecuta **siempre**:

```bash
# 1. Comprobar linter
npm run lint

# 2. Ejecutar suite de tests
npm run test

# 3. Validar build de producción
npm run build
```

---

## 7. Flujo Git

Una vez validados los cambios localmente:

```bash
git status
git add .
git commit -m "feat: añadida nueva funcionalidad X"
git push origin main
```

---

## 8. Qué ocurre en GitHub Actions después del Push

Al hacer `git push origin main`, se activa automáticamente el pipeline de GitHub Actions en `.github/workflows/ci-cd.yml`.

---

## 9. ¿Qué pasa si el Build Falla?

```text
git push
   ↓
GitHub Actions
   ↓
lint / test / build FAIL ❌
   ↓
Notificación en Telegram 🔴
   ↓
NO se publica imagen Docker en GHCR
   ↓
Producción NO cambia (mantiene la versión previa intacta)
```

Recibirás un mensaje en Telegram como este:

```text
🔴 Todo Sevilla

BUILD FALLIDO

Commit: abc1234
Autor: usuario

Producción NO se ha actualizado.
La versión anterior continúa activa.
```

---

## 10. ¿Qué pasa si el Build es Correcto?

```text
git push
   ↓
GitHub Actions
   ↓
lint / test / build OK 🟢
   ↓
Generar imagen Docker con tag (ej. todo-sevilla:v0.1.0-abc1234)
   ↓
Publicar en GitHub Container Registry (GHCR)
   ↓
Notificación en Telegram 🟢 ("Build Correcto")
   ↓
Iniciar despliegue a Portainer
```

---

## 11. Primer Despliegue en Producción (Portainer)

Si es la primera vez que configuras la aplicación en Portainer:

1. Inicia sesión en tu panel de **Portainer**.
2. Ve a **Stacks** -> **Add stack**.
3. Asigna un nombre: `todo-sevilla`.
4. En el editor de Compose, pega el contenido de `docker-compose.yml`.
5. En la sección **Environment variables**, añade:
   - `DOCKER_REGISTRY`: `ghcr.io/tu-usuario`
   - `IMAGE_NAME`: `todosevilla`
   - `IMAGE_TAG`: `latest` (o el tag específico generado)
   - `POSTGRES_PASSWORD`: `contraseña_segura_prod`
   - `JWT_SECRET`: `clave_secreta_super_segura_prod`
   - `ADMIN_PASSWORD`: `password_super_admin_prod`
   - `TELEGRAM_BOT_TOKEN`: `tu_token_bot`
   - `TELEGRAM_CHAT_ID`: `tu_chat_id`
6. Haz clic en **Deploy the stack**.

---

## 12. Inspeccionar el Stack en Portainer

1. Ve a **Stacks** -> **todo-sevilla**.
2. Verifica que los servicios `todo-sevilla-db` y `todo-sevilla-app` estén en estado **healthy**.
3. En la pestaña **Logs**, puedes revisar los registros en tiempo real sin exponer contraseñas ni secretos.

---

## 13. Verificación de Healthcheck

Puedes comprobar manualmente la salud de la aplicación ejecutando en la terminal del servidor o navegador:

```bash
curl -i http://tu-dominio.es/api/health
```

Respuesta esperada: `HTTP/1.1 200 OK`

---

## 14. Procedimiento de Rollback Paso a Paso

Si se despliega una versión en producción que presenta un fallo imprevisto:

### Opción A: Rollback desde Portainer
1. Abre Portainer -> **Stacks** -> `todo-sevilla` -> **Editor**.
2. En las variables de entorno del Stack, localiza `IMAGE_TAG`.
3. Cambia el valor por el tag de la versión anterior que funcionaba (ej. `v0.1.0-a1b2c3d`).
4. Pulsa en **Update the stack** asegurándote de marcar **Re-pull image and redeploy**.
5. Portainer descargará de GHCR la versión anterior e iniciará los contenedores en cuestión de segundos.

### Opción B: Rollback Automático / Re-trigger en GitHub
1. En GitHub Actions, ve a la pestaña **Releases** o ejecuciones anteriores.
2. Selecciona la ejecución del commit estable anterior y haz clic en **Re-run all jobs**.

---

## 15. Copias de Seguridad (Backups)

Para realizar una copia de seguridad rápida de la base de datos PostgreSQL en producción:

```bash
# Crear backup en SQL
docker exec -t todo-sevilla-db pg_dump -U todosevilla -d todosevilla_db > backup_sevilla_$(date +%F).sql

# Restaurar backup
cat backup_sevilla_2026-10-02.sql | docker exec -i todo-sevilla-db psql -U todosevilla -d todosevilla_db
```
