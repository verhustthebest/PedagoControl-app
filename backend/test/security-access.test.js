const test = require('node:test')
const assert = require('node:assert/strict')
const {
  canBroadcast,
  canListAllSchools,
  hasAnyRole,
  hasUsableSchoolContext,
  PREFECT_ROLES,
  SUPERVISION_ROLES,
  TEACHER_ROLES,
} = require('../dist/security/access-policy.js')
const {
  requireAnyRole,
  requireSchoolContext,
  requireSchoolScope,
} = require('../dist/middleware/auth.middleware.js')

function identity({ school = '1', roles = [], permissions = [] } = {}) {
  return { school_id: school, roles, permissions }
}

test('pedagogical report roles are separated', () => {
  const teacher = identity({ roles: ['ENSEIGNANT'] })
  const prefect = identity({ roles: ['PREFET'] })
  const direction = identity({ roles: ['ADMIN_GESTIONNAIRE'] })
  const parent = identity({ roles: ['PARENT'] })

  assert.equal(hasAnyRole(teacher, TEACHER_ROLES), true)
  assert.equal(hasAnyRole(teacher, PREFECT_ROLES), false)
  assert.equal(hasAnyRole(prefect, PREFECT_ROLES), true)
  assert.equal(hasAnyRole(prefect, SUPERVISION_ROLES), false)
  assert.equal(hasAnyRole(direction, SUPERVISION_ROLES), true)
  assert.equal(hasAnyRole(parent, TEACHER_ROLES), false)
  assert.equal(hasAnyRole(parent, PREFECT_ROLES), false)
  assert.equal(hasAnyRole(parent, SUPERVISION_ROLES), false)
})

test('a school identity is scoped and a non-super-admin without school is rejected', () => {
  assert.equal(hasUsableSchoolContext(identity({ roles: ['PREFET'] })), true)
  assert.equal(hasUsableSchoolContext(identity({ school: null, roles: ['PREFET'] })), false)
  assert.equal(hasUsableSchoolContext(identity({ school: null, roles: ['SUPER_ADMIN'] })), true)
})

test('parents and teachers can never broadcast collectively', () => {
  const permission = ['BROADCAST_SCHOOL_MESSAGES']
  assert.equal(canBroadcast(identity({ roles: ['PARENT'], permissions: permission })), false)
  assert.equal(canBroadcast(identity({ roles: ['ENSEIGNANT'], permissions: permission })), false)
})

test('school broadcasts require the dedicated permission and remain school scoped', () => {
  assert.equal(canBroadcast(identity({ roles: ['ADMIN_GESTIONNAIRE'] })), false)
  assert.equal(canBroadcast(identity({
    roles: ['ADMIN_GESTIONNAIRE'],
    permissions: ['BROADCAST_SCHOOL_MESSAGES'],
  })), true)
})

test('global broadcast requires a school-less super admin with the global permission', () => {
  assert.equal(canBroadcast(identity({
    school: null,
    roles: ['SUPER_ADMIN'],
    permissions: ['BROADCAST_GLOBAL_MESSAGES'],
  })), true)
  assert.equal(canBroadcast(identity({
    school: null,
    roles: ['MANAGEMENT'],
    permissions: ['BROADCAST_GLOBAL_MESSAGES'],
  })), false)
})

test('complete school listing is restricted to super admin or management roles', () => {
  assert.equal(canListAllSchools(identity({ roles: ['SUPER_ADMIN'] })), true)
  assert.equal(canListAllSchools(identity({ roles: ['MANAGEMENT'] })), true)
  assert.equal(canListAllSchools(identity({ roles: ['ADMIN_GESTIONNAIRE'] })), false)
  assert.equal(canListAllSchools(identity({ roles: ['PREFET'] })), false)
})

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

test('middleware returns a generic 403 for a forbidden role', () => {
  const response = responseRecorder()
  let nextCalled = false
  requireAnyRole(PREFECT_ROLES)(
    { user: identity({ roles: ['ENSEIGNANT'] }) },
    response,
    () => { nextCalled = true },
  )
  assert.equal(nextCalled, false)
  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, { message: 'Access forbidden' })
})

test('middleware rejects a non-super-admin without school', () => {
  const response = responseRecorder()
  requireSchoolContext()(
    { user: identity({ school: null, roles: ['MANAGEMENT'] }) },
    response,
    () => assert.fail('next must not be called'),
  )
  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, { message: 'Access forbidden' })
})

test('school scope prevents access to another school', () => {
  const response = responseRecorder()
  requireSchoolScope()(
    { params: { schoolId: '2' }, user: identity({ school: '1', roles: ['ADMIN_GESTIONNAIRE'] }) },
    response,
    () => assert.fail('next must not be called'),
  )
  assert.equal(response.statusCode, 403)
  assert.deepEqual(response.body, { message: 'Access forbidden' })
})
