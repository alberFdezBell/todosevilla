#!/bin/sh
set -e

echo "Iniciando contenedor de Todo Sevilla..."

# ---------------------------------------------------------------------------
# Validaciones tempranas de variables críticas
# (sin estas variables el seed falla o la app arranca rota; fallamos rápido
#  con un mensaje claro en lugar de un exit 1 enigmático)
# ---------------------------------------------------------------------------
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "ERROR CRÍTICO DE SEGURIDAD: Las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias." >&2
  echo "Defínelas en el Stack de Portainer (Environment variables) y vuelve a desplegar." >&2
  exit 1
fi
if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: La variable de entorno JWT_SECRET es obligatoria para firmar las sesiones del panel." >&2
  exit 1
fi
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: La variable de entorno DATABASE_URL es obligatoria." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Conexión a PostgreSQL
# pg_isready/psql/pg_dump usan libpq, que NO acepta el parámetro ?schema=public
# (ese parámetro es exclusivo del driver de Prisma). Por eso derivamos una URL
# "libpq-safe" quitando la query string. Prisma (migraciones y seed) sigue usando
# $DATABASE_URL con su ?schema=public original.
# ---------------------------------------------------------------------------
LIBPQ_URL=$(echo "$DATABASE_URL" | cut -d'?' -f1)

# Leer el SHA del commit actual (por defecto 'unknown' si no se inyecta)
CURRENT_SHA="${GIT_COMMIT_SHA:-unknown}"
LAST_DEPLOYED_SHA_FILE="/backups/last_deployed_sha.txt"
LOCK_ID=123456

echo "Verificando conexión con la base de datos..."
MAX_ATTEMPTS=60
ATTEMPT=0
until pg_isready -d "$LIBPQ_URL" -t 5 >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT+1))
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "ERROR: La base de datos no respondió tras $MAX_ATTEMPTS intentos. Abortando despliegue." >&2
    exit 1
  fi
  echo "Esperando a que la base de datos responda... (intento $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done
echo "Conexión a la base de datos verificada."

# Liberar el advisory lock automáticamente si este contenedor se detiene o aborta
trap 'psql -d "$LIBPQ_URL" -c "SELECT pg_advisory_unlock($LOCK_ID);" >/dev/null 2>&1 || true' EXIT

# Usar Advisory Lock de Postgres para evitar condiciones de carrera si hay múltiples réplicas
echo "Adquiriendo lock de despliegue en la base de datos (ID: $LOCK_ID)..."
LOCKED=$(psql -d "$LIBPQ_URL" -tAc "SELECT pg_try_advisory_lock($LOCK_ID);" 2>/dev/null || echo "f")

if [ "$LOCKED" = "t" ]; then
  echo "Lock adquirido. Ejecutando comprobación de versión..."

  # Comprobar si es un redespliegue real o un simple reinicio
  SHOULD_DEPLOY=true
  if [ -f "$LAST_DEPLOYED_SHA_FILE" ]; then
    LAST_SHA=$(cat "$LAST_DEPLOYED_SHA_FILE")
    if [ "$CURRENT_SHA" = "$LAST_SHA" ] && [ "$CURRENT_SHA" != "unknown" ] && [ "$CURRENT_SHA" != "dev-local-sha" ]; then
      echo "Mismo SHA detectado ($CURRENT_SHA). Saltando tareas de pre-despliegue."
      SHOULD_DEPLOY=false
    fi
  fi

  if [ "$SHOULD_DEPLOY" = "true" ]; then
    echo "Iniciando proceso de pre-despliegue (Actualización / Nueva versión)..."

    # Verificar si ya existe una base de datos con tablas creadas
    echo "Comprobando si existen datos previos en la base de datos..."
    TABLE_EXISTS=$(psql -d "$LIBPQ_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User');" 2>/dev/null || echo "false")

    if [ "$TABLE_EXISTS" = "t" ]; then
      BACKUP_FILE="/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
      echo "Base de datos existente detectada. Generando backup automático en $BACKUP_FILE..."
      if pg_dump -d "$LIBPQ_URL" -F c -b -f "$BACKUP_FILE"; then
        echo "Backup completado correctamente."

        # Aplicar política de retención: conservar solo los últimos 10 backups
        # (while/read en lugar de xargs -r: -r es extensión GNU y falla en BusyBox/Alpine)
        echo "Aplicando política de retención de backups (conservar últimos 10)..."
        cd /backups
        ls -1t backup_*.sql 2>/dev/null | tail -n +11 | while read -r f; do rm -f -- "$f"; done || true
        echo "Limpieza de backups antiguos completada."
        # Volver al directorio de la app para que las rutas relativas de Prisma sean correctas
        cd /app
      else
        echo "ATENCIÓN: El backup automático ha fallado. Por seguridad se cancela el despliegue."
        exit 1
      fi
    else
      echo "No se detectaron tablas de la app. Saltando backup automático (instalación nueva)."
    fi

    # Ejecutar las migraciones (Prisma usa $DATABASE_URL original con ?schema=public)
    # Se invoca el CLI directamente (node .../prisma/build/index.js) porque el
    # runner standalone no incluye node_modules/.bin/prisma y npx intentaría
    # descargarlo de internet en tiempo de ejecución.
    echo "Ejecutando migraciones de Prisma..."
    if node ./node_modules/prisma/build/index.js migrate deploy; then
      echo "Migraciones aplicadas con éxito."
    else
      echo "ERROR: Las migraciones de base de datos han fallado. Abortando despliegue."
      exit 1
    fi

    # Ejecutar el seed
    echo "Ejecutando seed..."
    node prisma/seed.js

    # Guardar el SHA del despliegue exitoso
    if [ "$CURRENT_SHA" != "unknown" ]; then
      echo "$CURRENT_SHA" > "$LAST_DEPLOYED_SHA_FILE"
      echo "SHA de despliegue registrado: $CURRENT_SHA"
    fi
  fi
else
  echo "Otra réplica está ejecutando el pre-despliegue. Esperando a que finalice..."
  # Se bloquea esperando el lock. Cuando se libera, significa que la otra réplica ha terminado.
  # El trap EXIT liberará este lock al terminar el script.
  psql -d "$LIBPQ_URL" -c "SELECT pg_advisory_lock($LOCK_ID);" >/dev/null 2>&1 || true
  echo "Lock liberado por la otra réplica. Continuando."
fi

# Iniciar la aplicación en producción
echo "Iniciando servidor de Next.js..."
exec node server.js
