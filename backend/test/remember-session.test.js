const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')

test('remember_me choisit une session persistante ou courte avec cookie HttpOnly', () => {
  const controller = fs.readFileSync('src/controllers/auth.controller.ts', 'utf8')
  const sessions = fs.readFileSync('src/services/auth-session.service.ts', 'utf8')
  const schema = fs.readFileSync('src/validation/schemas.ts', 'utf8')
  assert.match(schema, /remember_me: z\.boolean\(\)\.optional\(\)\.default\(false\)/)
  assert.match(controller, /createAuthSession\(credentials\.user\.id, request, remember_me === true\)/)
  assert.match(sessions, /persistent \? ttlDays\(\).*: shortTtlHours\(\)/)
  assert.match(sessions, /HttpOnly/)
})
