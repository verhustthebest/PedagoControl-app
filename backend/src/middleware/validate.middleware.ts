import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

type Location = 'body' | 'params' | 'query'
type Schemas = Partial<Record<Location, ZodType>>

export function validate(schemas: Schemas) {
  return (request: Request, response: Response, next: NextFunction) => {
    for (const location of ['params', 'query', 'body'] as const) {
      const schema = schemas[location]
      if (!schema) continue
      const result = schema.safeParse(request[location])
      if (!result.success) {
        response.locals = response.locals ?? {}
        response.locals.security_action = 'validation_refused'
        return response.status(400).json({
          message: 'Les données envoyées sont invalides.',
          errors: result.error.issues.map(issue => ({ location, field: issue.path.join('.'), code: issue.code })),
        })
      }
      if (location !== 'query') request[location] = result.data as never
    }
    return next()
  }
}
