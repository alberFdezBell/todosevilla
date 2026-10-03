#!/usr/bin/env node
// scripts/create-admin.js
// Crea o actualiza el usuario administrador en producción.
// Requiere la variable ADMIN_PASSWORD y DATABASE_URL en el entorno.

'use strict'

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.log('ℹ️ Variable ADMIN_PASSWORD no configurada. Omitiendo inicialización del usuario admin.')
    return
  }

  const hash = await bcrypt.hash(password, 10)

  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hash },
    create: { username: 'admin', passwordHash: hash },
  })

  console.log('✅ Usuario admin inicializado/actualizado correctamente (usuario: admin).')
}

main()
  .catch((e) => {
    console.error('❌ Error al inicializar usuario admin:', e.message)
  })
  .finally(() => prisma.$disconnect())
