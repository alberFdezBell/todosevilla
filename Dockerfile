# Etapa 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Etapa 2: Compilación
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumento para inyectar el SHA del commit en tiempo de compilación
ARG GIT_COMMIT_SHA
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# Etapa 3: Ejecución
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Instalar postgresql-client para tener pg_dump disponible para backups automáticos, y dos2unix
RUN apk add --no-cache postgresql-client openssl dos2unix

# Crear directorio de backups y asegurar permisos
RUN mkdir -p /backups

# Copiar archivos compilados y dependencias necesarias
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# node_modules COMPLETO desde la etapa 'deps': incluye el CLI de Prisma
# (prisma/build/index.js) con TODAS sus dependencias transitivas (@prisma/internals,
# @prisma/config, yaml, ...), los engines nativos (@prisma/engines) y bcrypt.
# El standalone de Next.js solo traza las dependencias de la app, y sin esta
# copia el CLI falla con 'Cannot find module @prisma/internals' -> exit(1) en migrate deploy.
COPY --from=deps /app/node_modules ./node_modules

# Copiar el script de inicio y darle permisos de ejecución
COPY entrypoint.sh ./entrypoint.sh
RUN dos2unix ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]