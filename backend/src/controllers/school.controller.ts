import type { Response } from 'express'
import prisma from '../prisma/client'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { isSuperAdmin } from '../security/access-policy'

function serializeBigInt(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)),
  )
}

function positiveInteger(value: unknown, fallback: number, maximum?: number) {
  if (value === undefined) return fallback
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0 || (maximum !== undefined && parsed > maximum)) return null
  return parsed
}

export async function getSchools(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })

  const page = positiveInteger(request.query.page, 1)
  const limit = positiveInteger(request.query.limit, 20, 100)
  if (!page || !limit) return response.status(400).json({ message: 'Invalid pagination' })

  try {
    const where = isSuperAdmin(request.user)
      ? {}
      : { id: BigInt(request.user.school_id as string) }
    const [schools, total] = await prisma.$transaction([
      prisma.schools.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          promoter_name: true,
          phone: true,
          status: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.schools.count({ where }),
    ])

    return response.json(serializeBigInt({
      schools,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    }))
  } catch (error) {
    return response.status(500).json({ message: 'Unable to fetch schools' })
  }
}
