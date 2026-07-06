import type { Request, Response } from 'express'
import prisma from '../prisma/client'

function serializeBigInt(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)),
  )
}

export async function getSchools(_request: Request, response: Response) {
  try {
    const schools = await prisma.schools.findMany({
      orderBy: { created_at: 'desc' },
    })

    return response.json(serializeBigInt(schools))
  } catch (error) {
    console.error('Unable to fetch schools', error)
    return response.status(500).json({ message: 'Unable to fetch schools' })
  }
}
