import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import prisma from '../prisma/client'
import { ACCESS_TOKEN_ALGORITHM, ACCESS_TOKEN_AUDIENCE, ACCESS_TOKEN_ISSUER, ACCESS_TOKEN_TTL, accessTokenSecret } from '../config/token-security'

export type AuthUser = {
  id: string
  email: string
  first_name: string
  last_name: string
  school_id: string | null
  school_public_id: string | null
  school_name: string | null
  roles: string[]
  permissions: string[]
  modules: { pedagogical_control: true; parental_tracking: boolean }
}

type JwtPayload = {
  sub: string
  roles: string[]
  school_id: string | null
  token_type: 'access'
  jti: string
  sid: string
}

export function isAccountEligible(user: { is_active: boolean; school_id: bigint | null; schools?: { status: string } | null; activeRoleCount: number }) {
  return user.is_active && (!user.school_id || user.schools?.status === 'active') && user.activeRoleCount > 0
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
  schools?: { public_id:string;name:string;school_parental_settings?: { is_enabled:boolean } | null } | null
}): AuthUser {
  return {
    id: user.id.toString(),
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    school_id: user.school_id ? user.school_id.toString() : null,
    school_public_id:user.schools?.public_id??null,
    school_name:user.schools?.name??null,
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
    modules: {
      pedagogical_control: true,
      parental_tracking: Boolean(user.schools?.school_parental_settings?.is_enabled),
    },
  }
}

export async function loginWithEmailAndPassword(email: string, password: string) {
  const identifier = email.trim()
  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
        { phone: identifier },
      ],
    },
    include: {
      schools: { select: { status: true, public_id:true, name:true, school_parental_settings: {select:{is_enabled:true}} } },
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

  if (!user || !isAccountEligible({
    is_active: user.is_active,
    school_id: user.school_id,
    schools: user.schools,
    activeRoleCount: user.user_roles.filter(item => item.roles.is_active).length,
  })) {
    return null
  }

  const passwordIsValid = await bcrypt.compare(password, user.password_hash)

  if (!passwordIsValid) {
    return null
  }

  const authUser = formatUser(user)
  return {
    user: authUser,
    roles: authUser.roles,
    school_id: authUser.school_id,
  }
}

export function signAccessToken(authUser: AuthUser, sessionId: string) {
  const payload: JwtPayload = {
    sub: authUser.id,
    roles: authUser.roles,
    school_id: authUser.school_id,
    token_type: 'access',
    jti: randomUUID(),
    sid: sessionId,
  }
  const token = jwt.sign(payload, accessTokenSecret(), {
    algorithm: ACCESS_TOKEN_ALGORITHM,
    expiresIn: ACCESS_TOKEN_TTL() as jwt.SignOptions['expiresIn'],
    issuer: ACCESS_TOKEN_ISSUER(), audience: ACCESS_TOKEN_AUDIENCE(),
  })

  return token
}

export async function findAuthUserById(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: BigInt(userId) },
    include: {
      schools: { select: { status: true, public_id:true, name:true, school_parental_settings: {select:{is_enabled:true}} } },
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

  if (!user || !isAccountEligible({
    is_active: user.is_active,
    school_id: user.school_id,
    schools: user.schools,
    activeRoleCount: user.user_roles.filter(item => item.roles.is_active).length,
  })) {
    return null
  }
  return formatUser(user)
}

export function verifyAuthToken(token: string) {
  const payload = jwt.verify(token, accessTokenSecret(), {
    algorithms: [ACCESS_TOKEN_ALGORITHM], issuer: ACCESS_TOKEN_ISSUER(), audience: ACCESS_TOKEN_AUDIENCE(),
  }) as JwtPayload
  if (payload.token_type !== 'access' || !payload.sub || !payload.jti || !payload.sid || !Array.isArray(payload.roles)) {
    throw new Error('Invalid access token')
  }
  return payload
}

/** DTO public d'authentification : l'identifiant scolaire interne reste réservé aux contrôles serveur. */
export function publicAuthUser(user:AuthUser){
  return{
    id:user.id,email:user.email,first_name:user.first_name,last_name:user.last_name,
    school_id:user.school_public_id,roles:user.roles,modules:user.modules,
    school:user.school_public_id?{public_id:user.school_public_id,name:user.school_name}:null,
  }
}
