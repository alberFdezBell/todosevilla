# Todo Sevilla — Manual del Administrador

> **Aviso permanente para el agente de IA**: Cada vez que se realice un cambio relevante en el proyecto (nueva funcionalidad, cambio en el esquema de base de datos, cambio en el flujo de despliegue, etc.) este `README.md` debe actualizarse para reflejar el estado actual.

---

## ¿Qué es Todo Sevilla?

**Todo Sevilla** es un directorio de negocios locales de la provincia de Sevilla, accesible en `https://todosevilla.aferbel.es`. Permite a los visitantes encontrar comercios, profesionales y servicios clasificados por zonas geográficas y categorías.

El proyecto incluye:
- **Landing pública**: Buscador, listado de zonas y fichas de negocios con SEO técnico.
- **Panel de administración privado**: Accesible únicamente en red local (`https://192.168.0.60:8080/panel`).
- **Infraestructura Docker Swarm** en Portainer sobre Proxmox con actualizaciones sin caídas.

---

## Despliegue en Producción (Proxmox)

Para instalar el entorno completo de producción (Docker, Swarm, Portainer y descargar el proyecto) de forma interactiva en un contenedor Debian/Ubuntu vacío, puedes ejecutar nuestro script automatizado por SSH:

```bash
curl -fsSL https://raw.githubusercontent.com/alberFdezBell/todosevilla/main/iniciar_produccion.sh -o iniciar_produccion.sh && chmod +x iniciar_produccion.sh && ./iniciar_produccion.sh
```

Para una guía paso a paso detallada (incluyendo preparación de VM, Cloudflare Tunnel y Webhooks de Portainer), consulta el manual de **[INICIAR.md](file:///c:/Users/alber/Desktop/todo%20castilblanco/INICIAR.md)**.

> ℹ️ **Proxy autosuficiente**: el servicio `proxy` usa la imagen `ghcr.io/alberfdezbell/todosevilla-proxy` (construida desde `nginx/`), que incluye la configuración de Nginx corregida (resolver dinámico de Swarm) y **genera sus propios certificados SSL autofirmados en el arranque** si no existen (guardados en el volumen `proxy_certs`). Ya **no depende** del `nginx.conf` ni de los certificados que `iniciar_produccion.sh` creaba en `/opt/todosevilla/nginx/`. Para regenerar los certificados manualmente: `docker volume rm todosevilla_proxy_certs` (con el stack detenido o tras re-desplegar) y vuelve a desplegar.

> 🌐 **Origen del túnel de Cloudflare**: en Cloudflare Zero Trust → Public Hostname, el *Service* del subdominio `todosevilla.aferbel.es` debe apuntar a **`http://proxy:80`** (el servidor nginx público del stack). Esa es la configuración correcta y documentada — **no usar** `http://app:3000` directo ni `localhost`.

### Diagnóstico rápido de `Application error`

Si la landing pública responde con `## Application error: a server-side exception has occurred` y el digest apunta a un fallo de Prisma al leer negocios, lo más habitual es una deriva de esquema en PostgreSQL: la columna antigua `Business.hours` aún existe pero la app ya espera `Business.schedule`.

En ese caso, la solución es aplicar la migración de corrección:

```sql
ALTER TABLE "Business" RENAME COLUMN "hours" TO "schedule";
ALTER TABLE "Business" ALTER COLUMN "published" SET DEFAULT true;
```

La aplicación incluye además una comprobación defensiva al arrancar para auto-corregir ese estado heredado antes de que Prisma ejecute consultas de negocio.
---

## Inicio Rápido — Entorno de Desarrollo (Windows)

### Requisitos
- [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
- [Node.js 20+](https://nodejs.org/) y npm instalados.

### Pasos

**1. Clonar el repositorio**
```bash
git clone https://github.com/alberFdezBell/todosevilla.git
cd todosevilla
```

**2. Configurar las variables de entorno de desarrollo**
```bash
copy .env.example .env
```
Edita el archivo `.env` y ajusta los valores (el archivo `.env.example` ya incluye los valores por defecto para desarrollo local).

**3. Levantar la base de datos PostgreSQL**
```bash
docker-compose -f docker-compose.dev.yml up -d
```
Esto levanta un contenedor PostgreSQL en el puerto `5432` de tu máquina local, completamente aislado de producción.

**4. Instalar dependencias de Node.js**
```bash
npm install
```

**5. Ejecutar las migraciones de base de datos**
```bash
npx prisma migrate dev --name init
```

**6. Cargar los datos iniciales (seed)**
```bash
npx prisma db seed
```
Esto crea el usuario administrador (`ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`) y los textos legales básicos.

**7. Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La web estará disponible en `http://localhost:3000`.
El panel de administración en `http://localhost:3000/panel/login`.

---

## Flujo de Trabajo: Cambio → GitHub → Producción

### 1. Modificar el código en local y probarlo
Realiza los cambios necesarios y pruébalos en `http://localhost:3000` con el entorno de desarrollo activo.

### 2. Subir los cambios a GitHub
```bash
git add .
git commit -m "Descripción del cambio realizado"
git push origin main
```

Al hacer push a `main`, GitHub Actions se activa automáticamente y:
- Compila la imagen Docker de la nueva versión.
- Inyecta el SHA del commit como variable de entorno (`GIT_COMMIT_SHA`), que queda **fijada dentro de la imagen** durante el build (no debe redefinirse desde el stack de Portainer).
- Publica la imagen en GitHub Container Registry (GHCR) con los tags `latest` y el SHA corto.
- El proceso tarda aproximadamente **3-5 minutos**.

### 3. Actualizar producción desde el Panel
1. Accede al panel de administración: `https://192.168.0.60:8080/panel`
2. En el **Dashboard**, haz clic en **"Buscar actualizaciones"**.
   - El sistema consulta la API pública de GitHub y compara el SHA del último commit con el SHA de la versión en ejecución.
   - Si hay diferencia, aparece el botón **"Confirmar actualización"**.
3. Haz clic en **"Confirmar actualización"**.
   - El sistema invoca el webhook de Portainer.
   - Portainer descarga la nueva imagen y realiza un **rolling update sin caídas** (Docker Swarm).
   - El nuevo contenedor ejecuta el script de arranque, el cual detecta la actualización (SHA del commit modificado), genera el backup y ejecuta las migraciones de base de datos antes de que la aplicación pase el healthcheck.
4. Espera 1-2 minutos. La actualización es transparente para los visitantes.

### 4. Rollback automático
Si la nueva versión falla el healthcheck (base de datos no conecta, error de migración, etc.), Docker Swarm **no sustituye el contenedor viejo** y el servicio continúa en la versión anterior sin interrupción.

> ⚠️ **Importante**: El rollback automático revierte la aplicación, pero **no revierte la base de datos**. Al detectar una nueva versión, el `entrypoint.sh` realiza automáticamente un `pg_dump` de seguridad en el volumen `/backups`. Si ocurre un problema grave de datos, consulta la sección "Restaurar backup de base de datos" más abajo.
>
> ℹ️ **Nota sobre reinicios**: El backup y las migraciones de Prisma se ejecutan **únicamente durante actualizaciones reales** (cuando cambia el SHA del commit). Si el contenedor simplemente se reinicia por mantenimiento del host, caída del host o reinicio del servicio Docker, el contenedor arrancará Next.js directamente sin ejecutar backups ni migraciones repetidas para optimizar el almacenamiento y el consumo de base de datos.

---

## Gestión del Panel de Administración

### Acceso
- URL en red local: `https://192.168.0.60:8080/panel`
- Usuario y contraseña: configurados en las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` del stack de Portainer.

> La primera vez que accedas desde un navegador, verás un aviso de certificado SSL autofirmado. Es normal. Haz clic en "Avanzado" → "Continuar de todas formas" (o similar según el navegador). Ver `INICIAR.md` para más detalles.

> 🔒 **Primer inicio de sesión**: El sistema detectará que es la primera vez que se accede y mostrará una pantalla de **cambio de contraseña obligatorio**. Debes establecer una contraseña nueva antes de poder acceder al panel. Una vez guardada, la sesión se cierra y debes volver a iniciar sesión con la nueva contraseña. `ADMIN_PASSWORD` es solo para el seed inicial; a partir de ahí, la contraseña vive en la base de datos.

### Secciones del Panel

| Sección | Descripción |
|---|---|
| **Dashboard** | Estadísticas de visitas y negocios. Botón de actualización. |
| **Negocios** | Crear, editar y borrar fichas de negocios. |
| **Zonas** | Crear, editar y borrar zonas geográficas (con opciones SEO). |
| **Categorías** | Crear, editar y borrar categorías de negocios. |
| **Textos Legales** | Editar Aviso Legal, Privacidad, Cookies y Términos de Uso. |
| **Usuarios** | Gestionar cuentas de administradores. |
| **Documentación** | Muestra este README en vivo. |

### Gestión de Zonas
1. Ve a **Zonas** → **Nueva Zona**.
2. Escribe el nombre (ej. "Castilblanco de los Arroyos").
3. El slug de URL se genera automáticamente (ej. `castilblanco-de-los-arroyos`).
4. Opcionalmente añade descripción pública y metadatos SEO específicos para esa zona.

### Gestión de Negocios
1. Ve a **Negocios** → **Añadir Negocio**.
2. Rellena el nombre, selecciona la categoría y la zona.
3. El slug se genera automáticamente pero puedes modificarlo (es la URL pública de la ficha).
4. Marca "Publicar ficha inmediatamente" o déjalo oculto hasta completar la información.

### Interpretación de Estadísticas
- **Visitas en el Periodo**: número de páginas vistas en el rango de fechas seleccionado (sin contar bots).
- **Altas en el Periodo**: negocios creados en ese rango de fechas.
- **Negocios más visitados**: ranking de fichas individuales con más visitas.
- **Visitas por Zonas**: qué zonas reciben más tráfico.

Las estadísticas son **cookieless y server-side**. No hay cookies de seguimiento ni datos personales de visitantes en la base de datos.

---

## Gestión de Textos Legales

Los textos de Aviso Legal, Política de Privacidad, Política de Cookies y Condiciones de Uso se editan **desde el propio panel** (sección "Textos Legales") y se guardan en la base de datos.

> ⚠️ **ACCIÓN REQUERIDA antes de publicar**: Los documentos legales contienen marcadores `[PLACEHOLDER_*]` que debes sustituir con los datos reales del titular del sitio. Ver la sección "Campos a Sustituir en los Textos Legales" al final de este documento.

### Dirección Fiscal como Imagen
La dirección fiscal del titular se muestra como imagen para evitar indexación en texto plano por scrapers. Debes:
1. Crear la imagen `direccion.webp` con la dirección fiscal del titular (fondo blanco, texto legible).
2. Copiarla a la carpeta `public/images/direccion.webp` del proyecto.
3. La imagen aparecerá automáticamente en los textos legales donde se incluye la etiqueta `<img src="/images/direccion.webp" ... />`.

> **Nota legal**: La LSSI-CE exige que la identificación del titular sea **efectivamente accesible**. La imagen cumple este requisito siempre que el correo de contacto esté disponible en texto y sea funcional. Sin embargo, confirma esta decisión con tu asesor jurídico antes de publicar.

---

## Restaurar Backup de Base de Datos

Los backups automáticos se guardan en el volumen Docker `backups` (en la ruta `/backups` dentro del contenedor `app`). Se generan en formato Custom de PostgreSQL (`-F c`) y se conservan los **10 más recientes**.

### ¿Cuándo restaurar?
La restauración manual es necesaria ante un bug de aplicación que haya borrado o corrompido datos sin que el healthcheck lo detectara (el healthcheck solo verifica que el servidor responde, no la integridad de los datos).

### Procedimiento completo de restauración

> ⚠️ **Antes de empezar**: Haz un backup del estado **actual** de la base de datos antes de restaurar uno antiguo. Si la restauración no era lo que necesitabas, necesitarás este backup para volver al estado previo a la restauración.

**Paso 1 — Backup de seguridad del estado actual**
```bash
# Obtener el ID del contenedor de la base de datos
docker ps | grep todosevilla_db
```

# Hacer un dump manual del estado actual (sustituye <container_id_db>)
docker exec <container_id_db> pg_dump \
  -U todosevilla_admin \
  -F c \
  -b \
  -f /backups/backup_MANUAL_ANTES_DE_RESTAURAR.sql \
  todosevilla
```

**Paso 2 — Listar los backups disponibles**
```bash
# Ver todos los backups con fecha y tamaño
docker exec <container_id_db> ls -lh /backups/
```
El nombre de cada archivo indica la fecha y hora del despliegue que lo generó: `backup_YYYYMMDD_HHMMSS.sql`.

**Paso 3 — Detener el servicio app para evitar escrituras durante la restauración**
```bash
# Escalar el servicio app a 0 réplicas (lo pausa sin eliminarlo)
docker service scale todosevilla_app=0
```
Espera a que Portainer confirme que el servicio tiene 0 réplicas activas antes de continuar.

**Paso 4 — Restaurar el backup elegido**
```bash
# Primero vaciar la base de datos (DROP + CREATE)
docker exec -it <container_id_db> psql \
  -U todosevilla_admin \
  -c "DROP DATABASE IF EXISTS todosevilla;" \
  -c "CREATE DATABASE todosevilla OWNER todosevilla_admin;"

# Restaurar el backup elegido (sustituye el nombre del archivo)
docker exec <container_id_db> pg_restore \
  --no-owner \
  --role=todosevilla_admin \
  -U todosevilla_admin \
  -d todosevilla \
  /backups/backup_YYYYMMDD_HHMMSS.sql
```

> ℹ️ El flag `--no-owner` es necesario porque el dump puede haber sido creado con un rol diferente. El flag `--role` reasigna la propiedad al usuario correcto.

**Paso 5 — Volver a arrancar el servicio app**
```bash
# Reescalar el servicio app a 1 réplica
docker service scale todosevilla_app=1
```
Comprueba en Portainer que el servicio vuelve a estado `Running` y que el panel responde en `https://192.168.0.60:8080/panel`.

> ⚠️ **Advertencia importante**: Restaurar un backup antiguo **elimina todos los datos creados después de la fecha del backup**. Esto incluye negocios, zonas, categorías, usuarios y visitas registradas después de ese punto. Si tienes dudas sobre qué backup elegir, consulta las fechas de los archivos y recuerda que el backup del **Paso 1** te permite deshacer la propia restauración si fuera necesario.

---


## ¿Qué hacer si algo falla?

### El panel no responde en https://192.168.0.60:8080
1. Comprueba que el stack está activo en Portainer (`192.168.0.60:9443`).
2. Verifica que el servicio `app` tiene la réplica en estado `Running`.
3. Consulta los logs: `docker service logs todosevilla_app`.

### La actualización falló
1. En Portainer, el servicio mostrará el estado anterior (rollback automático).
2. Consulta los logs del servicio para ver el error: `docker service logs todosevilla_app --tail 50`.
3. Corrige el error en local, pruébalo, y vuelve a hacer push a GitHub.

### La base de datos no conecta
1. Verifica que el servicio `db` está en ejecución en Portainer.
2. Comprueba la variable `DATABASE_URL` en el stack de Portainer.
3. Si hay un fallo grave, restaura desde el backup automático (ver sección anterior).

### El despliegue falla con `deployment failed: task: non-zero exit (1)`

El mensaje es genérico; hay que mirar los logs del task fallido: `docker service logs <servicio>` (o en Portainer → Stacks → servicio → Tasks → Logs).

| Error en los logs | Causa raíz | Solución |
|---|---|---|
| `pg_isready: error: invalid URI query parameter: "schema"` | `pg_isready`/`psql`/`pg_dump` (libpq) no aceptan el parámetro `?schema=public` (es exclusivo del driver de Prisma) | Ya corregido en `entrypoint.sh`: deriva una URL `libpq-safe` con `cut -d'?' -f1` para todas las herramientas libpq. Reconstruir la imagen (push a main). |
| `host not found in upstream "app"` (nginx) | Con `endpoint_mode: dnsrr`, el DNS de Swarm no publica el nombre `app` hasta que el servicio tiene tareas vivas; nginx resolvía el upstream al arrancar sin variable | Corregido de forma permanente en la imagen `todosevilla-proxy` (lleva su propio `nginx.conf` con `resolver 127.0.0.11` + `proxy_pass` con variable). Actualiza el stack a la imagen nueva. |
| `ERROR CRÍTICO DE SEGURIDAD: Las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD...` | `ADMIN_EMAIL`/`ADMIN_PASSWORD` vacías en el stack de Portainer | Definir las variables en el Stack de Portainer → Environment variables. La de `JWT_SECRET` también. |
| `cannot load certificate key /etc/nginx/certs/server.key` o `Is a directory` | Faltan los certificados o el `nginx.conf` en `/opt/todosevilla/nginx/` del host | Ya no aplica: la imagen `todosevilla-proxy` genera sus propios certificados autofirmados en el arranque. Solo aparece si el stack sigue usando el compose antiguo con los mounts del host. |
| `exit (137): dockerexec: unhealthy container` (app) | El healthcheck marcó el contenedor como "unhealthy" y Swarm lo eliminó (SIGKILL). Causas típicas: (a) la imagen desplegada aún lleva el `entrypoint.sh` antiguo (bucle `pg_isready`, `server.js` nunca arranca) o (b) el healthcheck usado flags que BusyBox no soporta (`--no-verbose`) | Corregido: healthcheck ahora con `node` + `http.get` (robusto en la imagen de la app). Además, **reconstruir la imagen** con el `entrypoint.sh` nuevo. Diagnóstico: `docker service logs todosevilla_app --tail 100` (busca "Iniciando servidor de Next.js..." o el bucle de pg_isready) y `docker inspect <container_id> --format '{{json .State.Health}}'`. |
| `Authentication failed against database server at 'db', the provided database credentials for 'todosevilla_admin' are not valid` | Las credenciales guardadas en el volumen `pgdata` no coinciden con las que usa el `app`. Postgres solo aplica `POSTGRES_PASSWORD` la primera vez que se inicializa el volumen | Alinear credenciales: recrear el volumen de la BD (`docker stack rm todosevilla` + `docker volume rm todosevilla_pgdata` + redeploy) o usar la misma contraseña con la que se creó el volumen. Verificar con: `docker exec <db> sh -c 'PGPASSWORD=todosevilla_secure_pass psql -h 127.0.0.1 -U todosevilla_admin -d todosevilla -tAc "select 1"'`. |
| `Prisma Client could not locate the Query Engine for runtime "linux-musl-openssl-3.0.x"` | El `prisma generate` no incluyó el binario del Query Engine para Alpine (`linux-musl-openssl-3.0.x`), solo `native` | Corregido: `binaryTargets` en `schema.prisma` añade `linux-musl-openssl-3.0.x` y el Dockerfile re-genera el cliente en el build. Reconstruir la imagen (push a main). |
| `Application error: a server-side exception has occurred` + `Digest` en la web pública (`/`, `/zona`, `/zona/negocio`) mientras `/api/health` responde 200 | Deriva entre `schema.prisma` y las migraciones: `Business` usa el campo `schedule`, pero la migración `20260831000000_init` creó la columna `hours`. El cliente Prisma genera `SELECT "Business"."schedule"` → la BD no tiene esa columna → P2022 en cualquier consulta de negocios. El healthcheck pasa porque solo ejecuta `SELECT 1` | Corregido con la migración nueva `20260831000002_rename_hours_to_schedule` (renombra `hours` → `schedule` con datos intactos y alinea el default de `published`). Desplegar la imagen nueva (push a main → GH Actions → webhook/redespliegue del stack) para que el `entrypoint.sh` ejecute `migrate deploy`. |
| `Cannot find module '@prisma/internals'` o error al ejecutar "Ejecutando migraciones de Prisma..." | El runner standalone no incluía las dependencias transitivas del CLI de Prisma (el cherry-pick de `node_modules/prisma` + `@prisma` no basta) | Corregido en el Dockerfile: se copia `node_modules` **completo** desde la etapa `deps`. Reconstruir la imagen (push a main). |
| `502 Bad Gateway` en `https://todosevilla.aferbel.es` (pública) | La cadena túnel → nginx → app se corta: el nginx del proxy no llega a `app:3000`, o el túnel de cloudflared no llega a `proxy:80`. El origen del túnel debe ser `http://proxy:80` (ver nota de despliegue). | Diagnóstico rápido (en el servidor): `docker exec <id_proxy> wget -qO- http://app:3000/api/health` (¿responde?) y `docker exec <id_tunnel> wget -qO- http://proxy:80/api/health`. Forzar la imagen nueva del proxy: `docker service update --force --image ghcr.io/alberfdezbell/todosevilla-proxy:latest todosevilla_proxy`. |
| `tunnel`: `dial tcp 10.0.x.x:80: i/o timeout` (bad gateway) | El routing mesh/IPVS de Swarm no enruta el tráfico entre servicios en LXC de Proxmox. El túnel no llega al VIP del `proxy`. | Corregido: `proxy` usa `endpoint_mode: dnsrr` + `ports` `mode: host` (como `db` y `app`). Asegúrate de que el stack usa el compose con esa configuración (force-pull de las imágenes y redeploy). |
| Error de módulo nativo (`bcrypt`/Prisma `was compiled against a different platform`) | Imagen construida desde Windows copiando `node_modules` | Con el nuevo `.dockerignore` ya no ocurre; reconstruir desde GitHub Actions (Linux). |

> 🛠️ **Si la app falla por autenticación de BD** (`Authentication failed ... are not valid`) pero el `db` declara las mismas credenciales que la app, lo que pasa es que el volumen `pgdata` se inicializó en su día con otra contraseña. Para alinear la contraseña del rol **sin borrar datos**:
> ```bash
> DB=$(docker ps -q -f name=todosevilla_db)
> docker exec "$DB" psql -U postgres -c "ALTER USER todosevilla_admin WITH PASSWORD 'todosevilla_secure_pass';"
> ```
> Alternativa (si no importan los datos): `docker stack rm todosevilla` + `docker volume rm todosevilla_pgdata` + redesplegar.
> ℹ️ Después de estos cambios hay que **reconstruir la imagen** (push a `main` → GitHub Actions publica `ghcr.io/alberfdezbell/todosevilla:latest`) y **redesplegar el stack**, porque el `entrypoint.sh` y el `nginx.conf` viven dentro de la imagen/contenedor.

---

## Campos a Sustituir en los Textos Legales

Antes de la publicación, accede al panel → "Textos Legales" y edita cada documento sustituyendo los marcadores siguientes:

| Marcador | Descripción | Documentos afectados |
|---|---|---|
| `[PLACEHOLDER_TITULAR]` | Nombre completo o razón social del titular | Aviso Legal, Privacidad, Términos |
| `[PLACEHOLDER_NIF]` | NIF o NIE del titular | Aviso Legal, Privacidad |
| `[PLACEHOLDER_EMAIL]` | Correo electrónico de contacto público | Todos |

La **dirección fiscal** no aparece como texto en el código: se muestra como imagen `direccion.webp` (ver sección anterior).

> ⚠️ **Descargo de responsabilidad**: Los textos legales incluidos en este proyecto son una base razonable pero **no sustituyen en ningún caso el asesoramiento de un abogado**. Deben personalizarse con los datos reales del titular y revisarse por un profesional jurídico antes de su publicación, especialmente en lo relativo a cumplimiento del RGPD y la LSSI-CE.

---

## Historial de Cambios

### 2026-09-01 — Rediseño visual (sistema de diseño amarillo/negro)

Aplicado el sistema de diseño del repositorio de referencia `todosevillaeste.es` a toda la aplicación.

#### Tokens de diseño adoptados

| Token | Valor anterior | Valor nuevo |
|---|---|---|
| Color de marca | Azul `#1e3a8a→#3b82f6` | Amarillo `#f3d044` |
| Header / Footer | Gradiente azul / Gris oscuro | Amarillo `#f3d044` + texto negro |
| Hero section | Gradiente azul | Amarillo `#f3d044` |
| Botones primarios | Azul `#2563eb` | Negro `#111` + texto blanco |
| Botón de acción | Azul | Amarillo `#f3d044` + texto negro |
| Sidebar admin | `bg-slate-900` | `#1f1f1f→#232323` + hover amarillo |
| Badges de categoría | Azul claro | Amarillo suave `#fff7d1` |
| Fondo general | `#f8fafc` | `#f5f7fb` degradado blanco→gris |

#### Archivos modificados

- **`src/app/globals.css`**: Variables CSS del sistema de diseño (`--ux-brand`, `--ux-dark`, etc.), clases `.header-brand`, `.footer-brand`, `.hero-brand`, `.badge-brand`, `.admin-sidebar`.
- **`src/app/layout.tsx`**: Header amarillo + botón "Panel Admin" negro. Footer amarillo con links negros.
- **`src/app/page.tsx`**: Hero amarillo, cards con hover amarillo, badges de categoría amarillo suave.
- **`src/components/SearchForm.tsx`**: Focus en amarillo, botón "Buscar" negro.
- **`src/app/panel/layout.tsx`**: Sidebar negro con hover amarillo, layout `min-h-screen`, top bar móvil.
- **`src/app/panel/LogoutButton.tsx`**: Adaptado al sidebar oscuro (hover rojo).
- **`src/components/UpdateManager.tsx`**: Fix URL GitHub + rediseño amarillo/negro (ver abajo).

#### Fix UpdateManager

- **Bug corregido**: URL de GitHub hardcodeada. Ahora usa `NEXT_PUBLIC_GITHUB_REPO` (fallback: `alberFdezBell/todosevilla`).
- **Errores descriptivos**: Distingue rate-limit (403), repo no encontrado (404) y error genérico.
- **Rediseño**: Botón "Buscar" negro, botón "Confirmar" amarillo, alertas con borde izquierdo de color.

#### Variable de entorno nueva (opcional)

```env
# .env.example
NEXT_PUBLIC_GITHUB_REPO=alberFdezBell/todosevilla
```