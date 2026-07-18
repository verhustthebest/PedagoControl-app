import type { NextFunction, Response } from 'express'
import prisma from '../prisma/client'
import type { AuthenticatedRequest } from './auth.middleware'
import { isPublicId } from '../security/public-id'

type Resource = 'student' | 'guardian' | 'invoice'

export function resolvePublicResource(resource: Resource, parameterName: string) {
  return async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const raw = request.params[parameterName]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (!value || !isPublicId(value)) return next()
    const schoolValue = request.params.schoolId
    if (!schoolValue || Array.isArray(schoolValue) || !/^\d+$/.test(schoolValue)) {
      return response.status(404).json({ message: 'Resource not found' })
    }
    const schoolId = BigInt(schoolValue)
    const found = resource === 'student'
      ? await prisma.students.findFirst({ where: { public_id: value, school_id: schoolId }, select: { id: true } })
      : resource === 'guardian'
        ? await prisma.guardians.findFirst({ where: { public_id: value, school_id: schoolId }, select: { id: true } })
        : await prisma.school_invoices.findFirst({ where: { public_id: value, school_id: schoolId }, select: { id: true } })
    if (!found) {
      response.locals.security_action = 'opaque_resource_access_refused'
      return response.status(404).json({ message: 'Resource not found' })
    }
    request.params[parameterName] = found.id.toString()
    return next()
  }
}

export function resolveOwnChild(parameterName = 'studentId') {
  return async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const raw = request.params[parameterName]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (!value || !isPublicId(value) || !request.user) return next()
    const student = await prisma.students.findFirst({ where: {
      public_id: value,
      student_guardians: { some: { status: 'active', guardians: { user_id: BigInt(request.user.id), status: 'active' } } },
    }, select: { id: true } })
    if (!student) {
      response.locals.security_action = 'parent_child_ownership_refused'
      return response.status(404).json({ message: 'Resource not found' })
    }
    request.params[parameterName] = student.id.toString()
    return next()
  }
}
