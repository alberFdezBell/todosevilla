#!/bin/sh
set -e

echo "Iniciando contenedor de Todo Sevilla..."

# Leer el SHA del commit actual (por defecto 'unknown' si no se inyecta)
CURRENT_SHA="${GIT_COMMIT_SHA:-unknown}"
LAST_DEPLOYED_SHA_FILE="/backups/last_deployed_sha.txt"
LOCK_ID=123456

# Esperar a que la base de datos PostgreSQL esté lista
if [ -n "$DATABASE_URL" ]; then
  echo "Verificando conexión con la base de datos..."
  until pg_isready -d "$DATABASE_URL" -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}"; do
    echo "Esperando a que la base de datos responda..."
    sleep 2
  done
  echo "Conexión a la base de datos verificada."

  # Usar Advisory Lock de Postgres para evitar condiciones de carrera si hay múltiples réplicas
  echo "Adquiriendo lock de despliegue en la base de datos (ID: $LOCK_ID)..."
  LOCKED=$(psql "$DATABASE_URL" -tAc "SELECT pg_try_advisory_lock($LOCK_ID);" 2>/dev/null || echo "f")

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
      TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User');" 2>/dev/null || echo "false")

      if [ "$TABLE_EXISTS" = "t" ]; then
        BACKUP_FILE="/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "Base de datos existente detectada. Generando backup automático en $BACKUP_FILE..."
        if pg_dump -d "$DATABASE_URL" -F c -b -f "$BACKUP_FILE"; then
          echo "Backup completado correctamente."
          
          # Aplicar política de retención: conservar solo los últimos 10 backups
          echo "Aplicando política de retención de backups (conservar últimos 10)..."
          cd /backups
          ls -1t backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm -f -- 2>/dev/null || true
          echo "Limpieza de backups antiguos completada."
        else
          echo "ATENCIÓN: El backup automático ha fallado. Por seguridad se cancela el despliegue."
          # Liberar lock antes de salir
          psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock($LOCK_ID);" >/dev/null 2>&1 || true
          exit 1
        fi
      else
        echo "No se detectaron tablas de la app. Saltando backup automático (instalación nueva)."
      fi

      # Ejecutar las migraciones
      echo "Ejecutando migraciones de Prisma..."
      if npx prisma migrate deploy; then
        echo "Migraciones aplicadas con éxito."
      else
        echo "ERROR: Las migraciones de base de datos han fallado. Abortando despliegue."
        # Liberar lock antes de salir
        psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock($LOCK_ID);" >/dev/null 2>&1 || true
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

    # Liberar el lock
    echo "Liberando lock de despliegue..."
    psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock($LOCK_ID);" >/dev/null 2>&1 || true
  else
    echo "Otra réplica está ejecutando el pre-despliegue. Esperando a que finalice..."
    # Se bloquea esperando el lock. Cuando se libera, significa que la otra réplica ha terminado.
    psql "$DATABASE_URL" -c "SELECT pg_advisory_lock($LOCK_ID);" >/dev/null 2>&1 || true
    echo "Lock liberado por la otra réplica. Continuando."
    # Liberar el lock inmediatamente ya que no vamos a hacer nada
    psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock($LOCK_ID);" >/dev/null 2>&1 || true
  fi
fi

# Iniciar la aplicación en producción
echo "Iniciando servidor de Next.js..."
exec node server.js
