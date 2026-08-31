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

### 1. Desarrollo local

1. Realiza los cambios en el código.
2. Pruébalos en local (`npm run dev`).
3. Haz commit y push a la rama `main`.

> ℹ️ Al hacer `push` a `main`, GitHub Actions compila y publica automáticamente dos imágenes en GHCR:
> - `ghcr.io/alberfdezbell/todosevilla:latest` (la aplicación)
> - `ghcr.io/alberfdezbell/todosevilla-proxy:latest` (el proxy nginx)

### 2. Actualización en Producción (Portainer)

Se publican **dos imágenes** con doble tag (`latest` + SHA corto). El panel detecta la nueva versión comparando el SHA del commit y, al confirmar, llama al webhook de Portainer.

### 3. Flujo de actualización sin caídas

Cuando se detecta una actualización, el `entrypoint.sh` del contenedor:
1. Espera a que la base de datos esté lista (`pg_isready` con URL libpq-safe, sin `?schema=public`).
2. Toma un `pg_dump` de seguridad en el volumen `/backups`.
3. Ejecuta `prisma migrate deploy`.
4. Ejecuta el seed (idempotente, no duplica).
5. Guarda el SHA desplegado y arranca `node server.js`.

### 4. Variables de entorno del Stack (Portainer)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_USER` | Sí | Usuario de PostgreSQL del servicio `db` |
| `DB_PASSWORD` | Sí | Contraseña de PostgreSQL del servicio `db` |
| `DB_NAME` | Sí | Nombre de la base de datos del servicio `db` |
| `ADMIN_EMAIL` | Sí | Email del usuario administrador inicial |
| `ADMIN_PASSWORD` | Sí | Contraseña del administrador inicial (se fuerza su cambio en el primer login) |
| `JWT_SECRET` | Sí | Secreto de firma de los JWT de sesión |
| `CLOUDFLARE_TUNNEL_TOKEN` | Sí | Token del túnel de Cloudflare Zero Trust |
| `PORTAINER_WEBHOOK_URL` | Sí | URL del webhook de Portainer para actualizaciones |
| `PROXY_CERT_CN` | No | CN del certificado SSL autogenerado por el proxy (default `192.168.0.60`) |

> ⚠️ **`GIT_COMMIT_SHA` no debe definirse en Portainer**: se inyecta en la imagen durante el build. Definirla (aunque sea vacía o `dev-local-sha`) sobrescribe el valor de la imagen y rompe el comparador de actualizaciones del panel.

---

## Solución de Problemas

### El despliegue falla con `deployment failed: task: non-zero exit (1)`

El mensaje es genérico; hay que mirar los logs del task fallido: `docker service logs <servicio>` (o en Portainer → Stacks → servicio → Tasks → Logs).

| Error en los logs | Causa raíz | Solución |
|---|---|---|
| `pg_isready: error: invalid URI query parameter: "schema"` | `pg_isready`/`psql`/`pg_dump` (libpq) no aceptan el parámetro `?schema=public` (es exclusivo del driver de Prisma) | Ya corregido en `entrypoint.sh`: deriva una URL `libpq-safe` con `cut -d'?' -f1` para todas las herramientas libpq. Reconstruir la imagen (push a main). |
| `host not found in upstream "app"` (nginx) | Con `endpoint_mode: dnsrr`, el DNS de Swarm no publica el nombre `app` hasta que el servicio tiene tareas vivas; nginx resolvía el upstream al arrancar sin variable | Corregido de forma permanente en la imagen `todosevilla-proxy` (lleva su propio `nginx.conf` con `resolver 127.0.0.11` + `proxy_pass` con variable). Actualiza el stack a la imagen nueva. |
| `ERROR CRÍTICO DE SEGURIDAD: Las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD...` | `ADMIN_EMAIL`/`ADMIN_PASSWORD` vacías en el stack de Portainer | Definir las variables en el Stack de Portainer → Environment variables. La de `JWT_SECRET` también. |
| `cannot load certificate key /etc/nginx/certs/server.key` o `Is a directory` | Faltan los certificados o el `nginx.conf` en `/opt/todosevilla/nginx/` del host | Ya no aplica: la imagen `todosevilla-proxy` genera sus propios certificados autofirmados en el arranque. Solo aparece si el stack sigue usando el compose antiguo con los mounts del host. |
| `exit (137): dockerexec: unhealthy container` (app) | El healthcheck marcó el contenedor como "unhealthy" y Swarm lo eliminó (SIGKILL). Causas típicas: imagen antigua (entrypoint en bucle) o healthcheck con flags que BusyBox no soporta | Corregido: healthcheck con `node` + `http.get`. Diagnóstico: `docker service logs todosevilla_app --tail 100` y `docker inspect <container_id> --format '{{json .State.Health}}'`. |
| `Authentication failed against database server at 'db', ... are not valid` | Las credenciales guardadas en el volumen `pgdata` no coinciden con las del `app`. Postgres solo aplica `POSTGRES_PASSWORD` la primera vez que se inicializa el volumen | Recrear el volumen de BD (`docker stack rm todosevilla` + `docker volume rm todosevilla_pgdata` + redeploy) o usar la misma contraseña con la que se creó el volumen. Verificar: `docker exec <db> sh -c 'PGPASSWORD=todosevilla_secure_pass psql -h 127.0.0.1 -U todosevilla_admin -d todosevilla -tAc "select 1"'`. |
| `Prisma Client could not locate the Query Engine for runtime "linux-musl-openssl-3.0.x"` | El `prisma generate` no incluyó el binario del Query Engine para Alpine, solo `native` | Corregido: `binaryTargets` en `schema.prisma` añade `linux-musl-openssl-3.0.x` y el Dockerfile re-genera el cliente en el build. |
| `Cannot find module '@prisma/internals'` o error al ejecutar "Ejecutando migraciones de Prisma..." | El runner standalone no incluía las dependencias transitivas del CLI de Prisma | Corregido en el Dockerfile: se copia `node_modules` completo desde la etapa `deps`. |
| `502 Bad Gateway` en `https://todosevilla.aferbel.es` (pública) | La cadena túnel → nginx → app se corta | Verificar origen del túnel (`http://proxy:80`) y `docker exec <id_proxy> wget -qO- http://app:3000/api/health`. |
| `tunnel`: `dial tcp 10.0.x.x:80: i/o timeout` (bad gateway) | El routing mesh/IPVS de Swarm no enruta el tráfico entre servicios en LXC de Proxmox | Corregido: `proxy` usa `endpoint_mode: dnsrr` + `ports` `mode: host`. |
| Error de módulo nativo (`bcrypt`/Prisma `was compiled against a different platform`) | Imagen construida desde Windows copiando `node_modules` | Con el nuevo `.dockerignore` ya no ocurre; reconstruir desde GitHub Actions (Linux). |

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