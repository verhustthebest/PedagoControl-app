import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client'

export type AuthUser = {
  id: string
  email: string
  first_name: string
  last_name: string
  school_id: string | null
  roles: string[]
  permissions: string[]
}

type JwtPayload = {
  sub: string
  email: string
  roles: string[]
  school_id: string | null
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }

  return secret
}

function formatUser(user: {
  id: bigint
  email: string
  first_name: string
  last_name: string
  school_id: bigint | null
  user_roles: Array<{
    roles: {
      name: string
      is_active: boolean
      role_permissions: Array<{ permissions: { code: string; is_active: boolean } }>
    }
  }>
}): AuthUser {
  return {
    id: user.id.toString(),
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    school_id: user.school_id ? user.school_id.toString() : null,
    roles: user.user_roles
      .filter((userRole) => userRole.roles.is_active)
      .map((userRole) => userRole.roles.name),
    permissions: [
      ...new Set(
        user.user_roles
          .filter((userRole) => userRole.roles.is_active)
          .flatMap((userRole) =>
            userRole.roles.role_permissions
              .filter((rolePermission) => rolePermission.permissions.is_active)
              .map((rolePermission) => rolePermission.permissions.code),
          ),
      ),
    ],
  }
}

export async function loginWithEmailAndPassword(email: string, password: string) {
  const user = await prisma.users.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      user_roles: {
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user || !user.is_active) {
    return null
  }

  const passwordIsValid = await bcrypt.compare(password, user.password_hash)

  if (!passwordIsValid) {
    return null
  }

  const authUser = formatUser(user)
  const payload: JwtPayload = {
    sub: authUser.id,
    email: authUser.email,
    roles: authUser.roles,
    school_id: authUser.school_id,
  }
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' })

  return {
    token,
    user: authUser,
    roles: authUser.roles,
    school_id: authUser.school_id,
  }
}

export async function findAuthUserById(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: BigInt(userId) },
    include: {
      user_roles: {
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user || !user.is_active) {
    return null
  }

  return formatUser(user)
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as JwtPayload
}
