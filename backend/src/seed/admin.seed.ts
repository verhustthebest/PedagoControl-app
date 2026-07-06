import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import prisma from '../prisma/client'

dotenv.config()

async function main() {
  const passwordHash = await bcrypt.hash('Admin12345', 10)

  const role = await prisma.roles.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {
      label: 'Super Administrateur',
      description: 'Acces complet a PEDAGO CONTROL',
      is_active: true,
    },
    create: {
      name: 'SUPER_ADMIN',
      label: 'Super Administrateur',
      description: 'Acces complet a PEDAGO CONTROL',
      is_active: true,
    },
  })

  const user = await prisma.users.upsert({
    where: { email: 'admin@test.com' },
    update: {
      first_name: 'Admin',
      last_name: 'PEDAGO',
      password_hash: passwordHash,
      is_active: true,
    },
    create: {
      first_name: 'Admin',
      last_name: 'PEDAGO',
      email: 'admin@test.com',
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

  console.log('Seed admin ready: admin@test.com / SUPER_ADMIN')
}

main()
  .catch((error) => {
    console.error('Seed admin failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
