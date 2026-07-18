import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import prisma from '../prisma/client'
import { assertSeedAllowed, seedPassword } from './seed-security'

dotenv.config()

async function main() {
  assertSeedAllowed('admin')
  const passwordHash = await bcrypt.hash(seedPassword('ADMIN_SEED_PASSWORD'), 10)
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase()
  if (!email) throw new Error('ADMIN_SEED_EMAIL is required')

  const role = await prisma.roles.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {
      label: 'Super Administrateur',
      description: 'Acces complet a CONTRÔLE PÉDAGOGIQUE',
      is_active: true,
    },
    create: {
      name: 'SUPER_ADMIN',
      label: 'Super Administrateur',
      description: 'Acces complet a CONTRÔLE PÉDAGOGIQUE',
      is_active: true,
    },
  })

  const user = await prisma.users.upsert({
    where: { email },
    update: {
      first_name: 'Admin',
      last_name: 'PÉDAGOGIQUE',
      password_hash: passwordHash,
      is_active: true,
    },
    create: {
      first_name: 'Admin',
      last_name: 'PÉDAGOGIQUE',
      email,
      password_hash: passwordHash,
      is_active: true,
    },
  })

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: user.id,
        role_id: role.id,
      },
    },
    update: {},
    create: {
      user_id: user.id,
      role_id: role.id,
    },
  })

  console.log('Seed admin completed without printing credentials')
}

main()
  .catch((error) => {
    console.error('Seed admin failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
