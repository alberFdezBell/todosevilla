-- AlterTable
-- ---------------------------------------------------------------------------
-- CORRECCIÓN DE DERIVA DE ESQUEMA
-- El modelo `Business` de schema.prisma usa el campo `schedule` (horario), pero
-- la migración inicial (20260831000000_init) creó la columna con el nombre
-- `hours`. Al no existir migración intermedia, la BD de producción levantada con
-- `prisma migrate deploy` nunca tenía la columna `schedule`, por lo que cualquier
-- `db.business.findMany/create/update` fallaba con Prisma P2022
-- ("column Business.schedule does not exist") -> error 500 "Application error".
--
-- Esta migración renombra la columna PRESERVANDO los datos existentes y alinea
-- además el DEFAULT de `published` con el definido en schema.prisma (@default(true)).
-- Es aditiva y retrocompatible (no elimina columnas ni cambia tipos).
-- ---------------------------------------------------------------------------
ALTER TABLE "Business" RENAME COLUMN "hours" TO "schedule";

ALTER TABLE "Business" ALTER COLUMN "published" SET DEFAULT true;