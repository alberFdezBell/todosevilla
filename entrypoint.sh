#!/bin/sh
set -e

echo "→ Ejecutando migraciones de base de datos (prisma migrate deploy)..."
node node_modules/prisma/build/index.js migrate deploy

echo "→ Verificando/inicializando usuario administrador..."
node scripts/create-admin.js || true

echo "→ Iniciando Todo Sevilla..."
exec node server.js
