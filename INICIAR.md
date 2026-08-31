# INICIAR.md — Guía de Configuración Inicial desde Cero

Esta guía cubre la configuración completa del entorno de producción desde cero: Proxmox, Portainer, Docker Swarm, Cloudflare Tunnel, GitHub, y el entorno de desarrollo en Windows.

---

## Índice

1. [Requisitos previos](#requisitos-previos)
2. [OPCIÓN RECOMENDADA: Despliegue Rápido por Consola (Script Automático)](#opción-recomendada-despliegue-rápido-por-consola-script-automático)
3. [Paso 1 — Preparar el contenedor Proxmox](#paso-1--preparar-el-contenedor-proxmox)
4. [Paso 2 — Instalar Docker y activar Swarm](#paso-2--instalar-docker-y-activar-swarm)
5. [Paso 3 — Instalar y configurar Portainer](#paso-3--instalar-y-configurar-portainer)
6. [Paso 4 — Configurar el túnel de Cloudflare](#paso-4--configurar-el-túnel-de-cloudflare)
7. [Paso 5 — Crear el stack en Portainer](#paso-5--crear-el-stack-en-portainer)
8. [Paso 6 — Configurar el webhook de Portainer](#paso-6--configurar-el-webhook-de-portainer)
9. [Paso 7 — Configurar el repositorio de GitHub](#paso-7--configurar-el-repositorio-de-github)
10. [Paso 8 — Primer despliegue y verificación](#paso-8--primer-despliegue-y-verificación)
11. [Paso 9 — Aceptar el certificado autofirmado en el navegador](#paso-9--aceptar-el-certificado-autofirmado-en-el-navegador)
12. [Configurar el entorno de desarrollo en Windows](#configurar-el-entorno-de-desarrollo-en-windows)

## Requisitos previos

- Servidor Proxmox con un nodo para el despliegue. Se recomienda utilizar una **Máquina Virtual (VM)** con **Ubuntu 22.04 / Debian 12** en la IP `192.168.0.60`.
  - > [!IMPORTANT]
  - > **LXC vs VM**: Docker Swarm requiere soporte para redes `overlay` (basadas en VXLAN). Si usas un contenedor LXC, por defecto Docker no podrá crear estas redes en LXC sin privilegios. Si insistes en usar un contenedor LXC, debes configurarlo como **privilegiado** y activar las características **Nesting** (anidamiento) y **Keyctl** en las opciones del contenedor en Proxmox (sección *Options* -> *Features*). Si usas una Máquina Virtual (VM) estándar, funcionará de forma nativa sin configuraciones adicionales de red.
- Acceso SSH al servidor.
- Cuenta en GitHub con el repositorio `alberFdezBell/todosevilla` creado (público).
- Cuenta en Cloudflare con el dominio `aferbel.es` gestionado (y el túnel Zero Trust creado, ver Paso 4 para copiar el token).
- Ordenador Windows con Docker Desktop para el entorno de desarrollo.

---

## OPCIÓN RECOMENDADA: Despliegue Rápido por Consola (Script Automático)

Si tienes un contenedor o VM de Proxmox recién instalado (vacío), puedes saltarte todos los pasos manuales ejecutando el script interactivo que instalará todas las dependencias, configurará Docker Swarm, Portainer y desplegará el stack preguntando interactivamente las variables por consola:

```bash
# 1. Acceder al Proxmox por SSH
ssh root@192.168.0.60

# 2. Descargar el script de instalación
curl -fsSL https://raw.githubusercontent.com/alberFdezBell/todosevilla/main/iniciar_produccion.sh -o iniciar_produccion.sh

# 3. Dar permisos y ejecutarlo
chmod +x iniciar_produccion.sh
./iniciar_produccion.sh
```

El script te guiará pidiendo los parámetros y configurará todo el entorno de producción de forma automática en menos de 5 minutos. Una vez completado, solo restará configurar el webhook de Portainer y el Public Hostname en Cloudflare.

---

## Paso 1 — Preparar el host (Proxmox VM o LXC)

Accede al servidor vía SSH:

```bash
ssh root@192.168.0.60
```

Actualiza el sistema operativo e instala dependencias básicas:

```bash
apt update && apt upgrade -y
apt install -y curl git wget openssl
```

### Clonar el Repositorio de la Aplicación

Debes clonar el repositorio en el directorio `/opt/todosevilla` del host de producción. Esto es **obligatorio** ya que el proxy inverso (Nginx) y los contenedores leen archivos de configuración y scripts directamente desde este directorio:

```bash
git clone https://github.com/alberFdezBell/todosevilla.git /opt/todosevilla
```

---

## Paso 2 — Instalar Docker y activar Swarm

### Instalar Docker Engine

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

### Verificar la instalación

```bash
docker --version
# Debería mostrar algo como: Docker version 26.x.x
```

### Activar Docker Swarm (modo single-node)

```bash
docker swarm init --advertise-addr 192.168.0.60
```

Guarda el token de manager que aparece en la salida (por si necesitas añadir nodos en el futuro). Para este proyecto con un solo servidor, no es necesario usarlo ahora.

### Verificar compatibilidad con redes Overlay (Crucial en Proxmox)

Antes de desplegar cualquier stack, verifica que tu host (VM o LXC configurado) soporta la creación de redes virtuales de tipo `overlay`. Ejecuta:

```bash
docker network create --driver overlay test-overlay
```

- **Si el comando tiene éxito (crea la red y devuelve un hash)**: Tu host es compatible. Elimina la red de prueba antes de continuar:
  ```bash
  docker network rm test-overlay
  ```
- **Si el comando falla con un error (ej. "operation not supported" o "error creating vxlan interface")**: Tu host no es compatible. Esto indica que estás en un contenedor LXC que no tiene las opciones de *Nesting* o *Keyctl* activadas en Proxmox, o que carece de privilegios. **No sigues con la guía hasta resolver esto**, ya que el despliegue del stack fallará.

---

## Paso 3 — Instalar y configurar Portainer

Portainer es la interfaz visual para gestionar los stacks de Docker Swarm.

```bash
# Crear volumen persistente para los datos de Portainer
docker volume create portainer_data

# Desplegar Portainer como servicio de Swarm (así Portainer mismo se gestiona con Swarm)
docker run -d \
  -p 8443:9443 \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### Acceder a Portainer por primera vez

1. Abre en tu navegador: `https://192.168.0.60:8443`
2. Acepta el certificado autofirmado de Portainer (igual que harás con la app).
3. Crea la cuenta de administrador de Portainer (usuario y contraseña).
4. Selecciona **"Get Started"** y luego **"local"** para gestionar el Docker local.

---

## Paso 4 — Configurar el túnel de Cloudflare en la Web (Zero Trust)

En lugar de instalar el binario del túnel en la máquina base (Proxmox host), el túnel de Cloudflare correrá directamente como un servicio contenedorizado más del stack en Portainer (`tunnel`), facilitando su administración. La configuración se realiza desde el panel web de Cloudflare.

### 1. Crear el Túnel en Cloudflare Zero Trust
1. Accede al panel de **Cloudflare Zero Trust** (`https://one.dash.cloudflare.com`).
2. Ve a la sección **Access** -> **Tunnels** en la barra lateral.
3. Haz clic en **Add a tunnel** y selecciona **Cloudflare (Managed)**.
4. Asígnale un nombre descriptivo al túnel (ej: `todosevilla`) y haz clic en **Save tunnel**.
5. En la sección de instalación ("Choose your environment"), selecciona **Docker**.
6. Copia el **Token** que aparece en el comando de Docker sugerido. Es una cadena larga de caracteres al final del comando que empieza tras el flag `--token`.
   * *Ejemplo: Si el comando es `docker run... --token eyJhbGci...`, copia únicamente la parte `eyJhbGci...`.*
7. Guarda este Token. Lo configuraremos como variable de entorno `CLOUDFLARE_TUNNEL_TOKEN` del stack en Portainer (Paso 5).

### 2. Configurar las rutas públicas (Public Hostnames) en la Web
En la misma pantalla del túnel de Cloudflare Zero Trust, ve a la pestaña **Public Hostnames** y haz clic en **Add a public hostname**:
1. **Domain**: Selecciona tu dominio `aferbel.es`.
2. **Subdomain**: Escribe `todosevilla` (así responderá en `todosevilla.aferbel.es`).
3. **Service**:
   * **Type**: Selecciona `HTTP`.
   * **URL**: Escribe `proxy:80` (el puerto HTTP del servicio `proxy` Nginx dentro del stack Docker).
4. Haz clic en **Save hostname**.

> ⚠️ **Crítico de seguridad (Aislamiento del Panel)**: Al apuntar el túnel al proxy inverso Nginx (`proxy:80`) en lugar de ir directamente a Next.js, Nginx actúa como filtro de red para todo el tráfico de internet. Nginx tiene reglas explícitas de bloqueo que devuelven HTTP 403 de forma inmediata ante cualquier acceso a `/panel` o `/api/system`. Esto evita que las peticiones del exterior toquen la app de Next.js. El panel local sigue seguro accediendo a `https://192.168.0.60:8080` (puerto local seguro 443 del proxy).

---

## Paso 5 — Crear el stack en Portainer

1. Accede a Portainer en `https://192.168.0.60:8443`.
2. Ve a **Stacks** → **Add Stack**.
3. Nombre del stack: `todosevilla`.
4. En el campo "Web editor", pega el contenido del archivo `docker-compose.yml` del repositorio.
5. En la sección **"Environment variables"**, añade las siguientes variables (una por una):

| Variable | Valor |
|---|---|
| `DB_USER` | `todosevilla_admin` |
| `DB_PASSWORD` | *(contraseña segura de tu elección, mínimo 20 caracteres)* |
| `DB_NAME` | `todosevilla` |
| `ADMIN_EMAIL` | Tu correo de administrador |
| `ADMIN_PASSWORD` | *(contraseña segura para el panel)* |
| `JWT_SECRET` | *(string aleatorio largo — genera con: `openssl rand -base64 32`)* |
| `PORTAINER_WEBHOOK_URL` | *(se obtiene en el Paso 6, déjalo vacío por ahora)* |
| `GIT_COMMIT_SHA` | `initial` |
| `CLOUDFLARE_TUNNEL_TOKEN` | *(El Token copiado desde el dashboard de Cloudflare Zero Trust en el Paso 4)* |

6. Haz clic en **"Deploy the stack"**.

> 🚨 **Caso crítico — Primer despliegue sin variables obligatorias**
>
> El comportamiento ante variables faltantes es **diferente en el primer despliegue** que en actualizaciones posteriores:
>
> - En una **actualización normal**, si el nuevo contenedor falla (healthcheck negativo, error de migración, variable faltante), Docker Swarm hace **rollback automático** a la versión anterior y el servicio continúa funcionando sin que los visitantes noten nada.
>
> - En el **primer despliegue**, no existe ninguna versión anterior a la que volver. Si una variable obligatoria como `ADMIN_PASSWORD` falta o está vacía, el `entrypoint.sh` lanza un error y el contenedor sale con código 1. El stack queda desplegado pero **ningún servicio llega a arrancar** — la web no responde.
>
> **Cómo diagnosticarlo**: En Portainer, ve a **Services** → selecciona `todosevilla_app` → haz clic en **"Logs"** (icono de documento). Verás el mensaje de error exacto del contenedor. Busca líneas como `ERROR CRÍTICO` o `Seed falló` para identificar qué variable falta.
>
> **Cómo resolverlo**: Vuelve a **Stacks** → `todosevilla` → **Editor**, añade o corrige la variable faltante y haz clic en **"Update the stack"**.

---

## Paso 6 — Configurar el webhook de Portainer

Después del primer despliegue, el servicio `app` tiene un webhook asociado:

1. En Portainer, ve a **Services** → **todosevilla_app**.
2. Haz clic en el servicio para ver sus detalles.
3. Busca la sección **"Service webhook"** y actívala.
4. Copia la URL del webhook (tendrá un formato como `https://192.168.0.60:9443/api/webhooks/xxxxxxxx`).
5. Vuelve a **Stacks** → **todosevilla** → **Editor**.
6. Actualiza la variable de entorno `PORTAINER_WEBHOOK_URL` con la URL copiada.
7. Haz clic en **"Update the stack"**.

---

## Paso 7 — Configurar el repositorio de GitHub

El repositorio es **público**, por lo que GitHub Actions puede publicar imágenes en GHCR sin necesidad de configurar secrets adicionales. El `GITHUB_TOKEN` se provee automáticamente.

### Verificar que el workflow de GitHub Actions está activo

1. Ve a `https://github.com/alberFdezBell/todosevilla/actions`.
2. El workflow `Build y Publicar Imagen Docker en GHCR` debería aparecer.
3. Si el repositorio es nuevo, haz un primer push para activarlo:

```bash
git add .
git commit -m "Primer commit: configuración inicial"
git push origin main
```

### Hacer la imagen pública en GHCR (solo la primera vez)

1. Ve a `https://github.com/alberFdezBell` → **Packages**.
2. Haz clic en el paquete `todosevilla`.
3. En **Package settings**, cambia la visibilidad a **Public**.

Esto permite que Portainer descargue la imagen sin credenciales.

---

## Paso 8 — Primer despliegue y verificación

Después de que GitHub Actions compile la primera imagen:

1. En Portainer, fuerza un redespliegue del stack para que descargue la imagen correcta.
2. Ve a `https://192.168.0.60:8080/panel/login` (desde tu red local).
3. Introduce el email y contraseña definidos en `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. Verifica que el panel carga correctamente.
5. Abre `https://todosevilla.aferbel.es` en el navegador para verificar la landing pública.

---

## Paso 9 — Generar y aceptar el certificado autofirmado con SAN

El proxy Nginx de producción genera automáticamente el certificado SSL la primera vez que arranca. Sin embargo, para cumplir con las exigencias de seguridad de los navegadores modernos, este certificado incluye la extensión **Subject Alternative Name (SAN)** apuntando a la IP `192.168.0.60` y a `localhost`.

### Comando de generación manual (si deseas regenerarlo)

Si alguna vez necesitas generar o renovar manualmente los certificados en tu host local o servidor, ejecuta el siguiente comando de OpenSSL:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/server.key \
  -out nginx/certs/server.crt \
  -subj "/CN=192.168.0.60" \
  -addext "subjectAltName = IP:192.168.0.60,IP:127.0.0.1,DNS:localhost,DNS:192.168.0.60"
```

### Aceptar el certificado en el navegador

Cuando accedas por primera vez a `https://192.168.0.60:8080/panel`, el navegador mostrará una advertencia de seguridad porque el certificado es autofirmado y no está emitido por una entidad certificadora de confianza global.

#### En Google Chrome / Brave

1. Aparece la pantalla "Tu conexión no es privada" (NET::ERR_CERT_AUTHORITY_INVALID).
2. Haz clic en el botón **"Avanzado"** o **"Configuración avanzada"** (parte inferior).
3. Haz clic en **"Continuar a 192.168.0.60 (no seguro)"**.
4. Dado que el certificado tiene el SAN correcto (`IP:192.168.0.60`), Chrome te permitirá navegar y recordar la excepción de forma permanente.

#### En Mozilla Firefox

1. Aparece la pantalla "Advertencia: posible riesgo de seguridad".
2. Haz clic en **"Avanzado..."**.
3. Haz clic en **"Aceptar el riesgo y continuar"**.

> **¿Por qué es seguro aceptar este certificado?**
> El cifrado funciona a nivel criptográfico igual que uno firmado por Let's Encrypt, cifrando los datos entre tu navegador y el servidor. Como el tráfico solo viaja dentro de tu red local privada (`192.168.0.x`), no hay riesgo de suplantación externo.

---

## Configurar el entorno de desarrollo en Windows

### Requisitos

- **Docker Desktop** para Windows: [descargar aquí](https://www.docker.com/products/docker-desktop/)
  - Durante la instalación, selecciona "Use WSL 2" si está disponible.
- **Node.js 20+**: [descargar aquí](https://nodejs.org/)
- **Git para Windows**: [descargar aquí](https://git-scm.com/download/win)

### Pasos de configuración

```powershell
# Clonar el repositorio
git clone https://github.com/alberFdezBell/todosevilla.git
cd todosevilla

# Copiar el archivo de variables de entorno
copy .env.example .env
# (Editar .env si es necesario: los valores por defecto funcionan para desarrollo)

# Levantar la base de datos de desarrollo (PostgreSQL en puerto 5432)
docker-compose -f docker-compose.dev.yml up -d

# Instalar dependencias
npm install

# Ejecutar migraciones de base de datos
npx prisma migrate dev --name init

# Cargar datos iniciales (admin + documentos legales)
npx prisma db seed

# Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en:
- **Landing pública**: `http://localhost:3000`
- **Panel de administración**: `http://localhost:3000/panel/login`
- **Credenciales**: las definidas en `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)

### Comandos útiles durante el desarrollo

```powershell
# Parar la base de datos de desarrollo
docker-compose -f docker-compose.dev.yml down

# Abrir Prisma Studio (interfaz visual para la BD)
npx prisma studio

# Crear una nueva migración tras cambiar schema.prisma
npx prisma migrate dev --name nombre_del_cambio

# Compilar para verificar que el build de producción funciona
npm run build
```
