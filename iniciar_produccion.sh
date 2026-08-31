#!/bin/bash
# ==============================================================================
# SCRIPT DE INSTALACIÓN Y CONFIGURACIÓN AUTOMÁTICA DE PRODUCCIÓN - TODO SEVILLA
# ==============================================================================
# Diseñado para ejecutarse en un contenedor vacío de Proxmox (Debian/Ubuntu)
# ==============================================================================

set -e

# Colores para salida de consola
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}        Instalador Automático para Todo Sevilla (Producción)        ${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Verificar privilegios de root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Este script debe ser ejecutado como root (sudo).${NC}"
  exit 1
fi

# Detectar distribución de Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}Error: No se pudo identificar el sistema operativo. Se requiere Debian/Ubuntu.${NC}"
    exit 1
fi

if [ "$OS" != "ubuntu" ] && [ "$OS" != "debian" ]; then
    echo -e "${YELLOW}Advertencia: Este script está optimizado para Debian/Ubuntu. Tu OS es: $OS. Continuando bajo tu responsabilidad...${NC}"
fi

# ==============================================================================
# PASO 1: Actualización del sistema e instalación de dependencias básicas
# ==============================================================================
echo -e "${GREEN}[1/7] Actualizando el sistema e instalando herramientas básicas...${NC}"
apt update && apt upgrade -y
apt install -y curl git wget openssl net-tools ufw
echo -e "${GREEN}Herramientas básicas instaladas correctamente.${NC}\n"

# ==============================================================================
# PASO 2: Instalación de Docker y Configuración de Swarm
# ==============================================================================
echo -e "${GREEN}[2/7] Comprobando e instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker Engine..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker instalado con éxito.${NC}"
else
    echo "Docker ya se encuentra instalado."
fi

# Comprobar estado de Docker Swarm
echo "Configurando Docker Swarm..."
SWARM_STATUS=$(docker info --format '{{.Swarm.LocalNodeState}}')

if [ "$SWARM_STATUS" = "active" ]; then
    echo "Docker Swarm ya está activo."
else
    # Obtener IP del servidor
    DEFAULT_IP=$(hostname -I | awk '{print $1}')
    read -p "Introduce la IP de este servidor para anunciar en el Swarm [Por defecto: $DEFAULT_IP]: " SWARM_IP
    SWARM_IP=${SWARM_IP:-$DEFAULT_IP}
    
    echo "Inicializando Docker Swarm en la IP $SWARM_IP..."
    docker swarm init --advertise-addr "$SWARM_IP"
    echo -e "${GREEN}Docker Swarm inicializado con éxito.${NC}"
fi

# Verificar compatibilidad con redes Overlay (vxlan) - Crítico en LXC Proxmox
echo "Verificando compatibilidad con redes overlay..."
if docker network create --driver overlay test-overlay-net &> /dev/null; then
    docker network rm test-overlay-net &> /dev/null
    echo -e "${GREEN}Verificación exitosa: El host soporta redes overlay.${NC}\n"
else
    echo -e "${RED}ERROR CRÍTICO: El host no soporta la creación de redes overlay.${NC}"
    echo -e "${YELLOW}Si estás usando un contenedor LXC en Proxmox, debes configurarlo como PRIVILEGIADO${NC}"
    echo -e "${YELLOW}y activar las opciones 'Nesting' (anidamiento) y 'Keyctl' en la pestaña Opciones de Proxmox.${NC}"
    exit 1
fi

# ==============================================================================
# PASO 3: Instalación de Portainer CE
# ==============================================================================
echo -e "${GREEN}[3/7] Instalando Portainer CE...${NC}"
if [ ! "$(docker ps -a -q -f name=portainer)" ]; then
    docker volume create portainer_data
    docker run -d \
      -p 8443:9443 \
      -p 9000:9000 \
      --name portainer \
      --restart=always \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v portainer_data:/data \
      portainer/portainer-ce:latest
    echo -e "${GREEN}Portainer CE iniciado correctamente en el puerto 8443 (HTTPS).${NC}\n"
else
    echo -e "Portainer ya está en ejecución.\n"
fi

# ==============================================================================
# PASO 4: Clonación del Repositorio de la Aplicación
# ==============================================================================
echo -e "${GREEN}[4/7] Descargando el código del proyecto...${NC}"
TARGET_DIR="/opt/todosevilla"
if [ ! -d "$TARGET_DIR" ]; then
    echo "Clonando el repositorio en $TARGET_DIR..."
    git clone https://github.com/alberFdezBell/todosevilla.git "$TARGET_DIR"
else
    echo "El directorio $TARGET_DIR ya existe. Actualizando código..."
    cd "$TARGET_DIR"
    git pull origin main
fi
cd "$TARGET_DIR"
echo -e "${GREEN}Código descargado con éxito.${NC}\n"

# ==============================================================================
# PASO 5: Cuestionario Interactivo para Variables de Entorno (Producción)
# ==============================================================================
echo -e "${GREEN}[5/7] Configuración de variables de entorno de producción...${NC}"
echo "Por favor, introduce los valores para configurar el stack. Presiona Enter para usar los sugeridos."
echo ""

# Base de datos
read -p "Usuario de Base de Datos [Por defecto: todosevilla_admin]: " INPUT_DB_USER
DB_USER=${INPUT_DB_USER:-todosevilla_admin}

# Contraseña de base de datos
DB_PASSWORD=""
while [ -z "$DB_PASSWORD" ]; do
    read -sp "Contraseña de la Base de Datos (Mínimo 20 caracteres, requerida): " INPUT_DB_PASS
    echo ""
    if [ ${#INPUT_DB_PASS} -lt 20 ]; then
        echo -e "${RED}Error: La contraseña de base de datos debe tener al menos 20 caracteres por seguridad.${NC}"
    else
        DB_PASSWORD=$INPUT_DB_PASS
    fi
done

read -p "Nombre de la Base de Datos [Por defecto: todosevilla]: " INPUT_DB_NAME
DB_NAME=${INPUT_DB_NAME:-todosevilla}

# Administrador inicial
read -p "Email del Administrador del Panel (requerido): " ADMIN_EMAIL
while [ -z "$ADMIN_EMAIL" ]; do
    read -p "El email es obligatorio. Email del Administrador: " ADMIN_EMAIL
done

ADMIN_PASSWORD=""
while [ -z "$ADMIN_PASSWORD" ]; do
    read -sp "Contraseña del Administrador del Panel (Mínimo 8 caracteres, obligatoria): " INPUT_ADMIN_PASS
    echo ""
    if [ ${#INPUT_ADMIN_PASS} -lt 8 ]; then
        echo -e "${RED}Error: La contraseña del administrador debe tener al menos 8 caracteres.${NC}"
    else
        ADMIN_PASSWORD=$INPUT_ADMIN_PASS
    fi
done

# JWT Secret (Generar uno robusto de forma automática por defecto)
AUTO_JWT=$(openssl rand -base64 32)
echo -e "Generando clave JWT_SECRET robusta de forma automática..."
read -p "Clave JWT [Pulsa ENTER para usar la autogenerada]: " INPUT_JWT
JWT_SECRET=${INPUT_JWT:-$AUTO_JWT}

# Cloudflare Tunnel Token
read -p "Introduce el Token de Cloudflare Tunnel obtenido en Zero Trust (requerido): " CLOUDFLARE_TUNNEL_TOKEN
while [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; do
    read -p "El Token de Cloudflare es obligatorio para exponer la web pública. Token: " CLOUDFLARE_TUNNEL_TOKEN
done

# Escribir el archivo .env en producción
ENV_FILE="$TARGET_DIR/.env"
echo "Escribiendo configuración en el archivo .env..."

cat <<EOF > "$ENV_FILE"
# ------------------------------------------------------------------------------
# Configuración del Stack de Producción - Todo Sevilla
# ------------------------------------------------------------------------------
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

JWT_SECRET=$JWT_SECRET
CLOUDFLARE_TUNNEL_TOKEN=$CLOUDFLARE_TUNNEL_TOKEN
PORTAINER_WEBHOOK_URL=

GIT_COMMIT_SHA=initial
EOF

echo -e "${GREEN}Archivo .env generado con éxito en $ENV_FILE.${NC}\n"

# ==============================================================================
# PASO 6: Generar certificados SSL con SAN para Nginx local
# ==============================================================================
echo -e "${GREEN}[6/7] Generando certificados locales para Nginx local en red privada...${NC}"
mkdir -p "$TARGET_DIR/nginx/certs"
if [ ! -f "$TARGET_DIR/nginx/certs/server.crt" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$TARGET_DIR/nginx/certs/server.key" \
      -out "$TARGET_DIR/nginx/certs/server.crt" \
      -subj "/CN=192.168.0.60" \
      -addext "subjectAltName = IP:192.168.0.60,IP:127.0.0.1,DNS:localhost,DNS:192.168.0.60"
    echo -e "${GREEN}Certificados SSL generados correctamente en nginx/certs/.${NC}\n"
else
    echo -e "Certificados SSL ya existentes. Saltando generación.\n"
fi

# ==============================================================================
# PASO 7: Lanzar el Stack de Swarm
# ==============================================================================
echo -e "${GREEN}[7/7] Desplegando el stack 'todosevilla' en Docker Swarm...${NC}"

# Exportar las variables cargadas del archivo .env a la sesión actual de bash
export DB_USER DB_PASSWORD DB_NAME ADMIN_EMAIL ADMIN_PASSWORD JWT_SECRET CLOUDFLARE_TUNNEL_TOKEN GIT_COMMIT_SHA PORTAINER_WEBHOOK_URL

# Desplegar stack
docker stack deploy -c docker-compose.yml todosevilla

echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}        ¡DESPLIEGUE INICIAL REALIZADO CON ÉXITO!                     ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "La infraestructura se está levantando en segundo plano."
echo -e "Puedes monitorizar el estado de los servicios con:"
echo -e "  ${BLUE}docker service ls${NC}"
echo -e "  ${BLUE}docker service ps todosevilla_app${NC}"
echo ""
echo -e "Pasos recomendados siguientes:"
echo -e "1. Accede a Portainer en ${YELLOW}https://192.168.0.60:8443${NC} (crea tu usuario si es el primer inicio)."
echo -e "2. Ve a Stacks → ${BLUE}todosevilla${NC} para gestionarlo visualmente."
echo -e "3. Configura el webhook del servicio ${BLUE}todosevilla_app${NC} en Portainer y agrégalo en las variables del Stack."
echo -e "4. En tu panel web de Cloudflare Zero Trust, asocia el subdominio ${BLUE}todosevilla.aferbel.es${NC} al Service ${YELLOW}http://proxy:80${NC}."
echo -e "5. Accede localmente al panel en ${BLUE}https://192.168.0.60:8080/panel${NC} con tus credenciales y cambia la contraseña de administrador."
echo ""
echo -e "${BLUE}======================================================================${NC}"
