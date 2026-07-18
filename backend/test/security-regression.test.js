const test = require('node:test')
const assert = require('node:assert/strict')
const {
  authenticateBearerToken, requireAnyRole, requirePermission, requireSchoolScope,
} = require('../dist/middleware/auth.middleware')
const {
  canListAllSchools, hasUsableSchoolContext, PREFECT_ROLES, SUPERVISION_ROLES,
} = require('../dist/security/access-policy')
const schemas = require('../dist/validation/schemas')

function identity(role, school = '1', permissions = []) {
  return { id: '10', school_id: school, roles: [role], permissions }
}

function responseRecorder() {
  return {
    statusCode: 200, body: undefined, locals: {}, headers: {},
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    setHeader(name, value) { this.headers[name] = value },
  }
}

function deniedBy(middleware, request) {
  const response = responseRecorder()
  let next = false
  middleware(request, response, () => { next = true })
  return { response, next }
}

test('private access without a bearer token is rejected with generic 401', async () => {
  const response = responseRecorder()
  await authenticateBearerToken({ header() { return undefined } }, response, () => assert.fail('must not pass'))
  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.body, { message: 'Authentication required' })
})

test('teacher cannot decide Prefect reports and Parent cannot access internal reports', () => {
  const teacher = deniedBy(requireAnyRole(PREFECT_ROLES), { user: identity('ENSEIGNANT') })
  const parent = deniedBy(requireAnyRole(SUPERVISION_ROLES), { user: identity('PARENT') })
  assert.equal(teacher.response.statusCode, 403)
  assert.equal(parent.response.statusCode, 403)
  assert.equal(teacher.next || parent.next, false)
})

test('Informaticien is denied pricing, invoice viewing, and payment permissions', () => {
  const informaticien = identity('INFORMATICIEN')
  for (const permission of ['MANAGE_PARENTAL_PRICING', 'VIEW_PARENTAL_INVOICES', 'GENERATE_PARENTAL_INVOICE', 'RECORD_PARENTAL_PAYMENT', 'PRINT_PARENTAL_INVOICE']) {
    const result = deniedBy(requirePermission(permission), { user: informaticien })
    assert.equal(result.response.statusCode, 403)
    assert.deepEqual(result.response.body, { message: 'Access forbidden' })
  }
})

test('school Admin cannot access global Management and unknown permissions are deny-by-default', () => {
  const admin = identity('ADMIN_GESTIONNAIRE')
  assert.equal(canListAllSchools(admin), false)
  const denied = deniedBy(requirePermission('UNKNOWN_INTERNAL_PERMISSION'), { user: admin })
  assert.equal(denied.response.statusCode, 403)
})

test('URL identifier tampering cannot read or modify another school', async () => {
  for (const method of ['GET', 'PUT', 'PATCH', 'POST']) {
    const response = responseRecorder()
    let next = false
    await requireSchoolScope()({
      method, params: { schoolId: '2' }, user: identity('ADMIN_GESTIONNAIRE', '1'),
    }, response, () => { next = true })
    assert.equal(response.statusCode, 404)
    assert.equal(next, false)
  }
})

test('null school context never grants global access outside an authorized SUPER_ADMIN', () => {
  assert.equal(hasUsableSchoolContext(identity('PREFET', null)), false)
  assert.equal(hasUsableSchoolContext(identity('INFORMATICIEN', null)), false)
  assert.equal(hasUsableSchoolContext(identity('ADMIN_GESTIONNAIRE', null)), false)
  assert.equal(hasUsableSchoolContext(identity('SUPER_ADMIN', null)), true)
})

test('SQL and HTML script payloads remain inert text while structural injection is rejected', () => {
  const payload = "'; DROP TABLE users; -- <script>fetch('/steal')</script>"
  const message = schemas.messageBody.safeParse({ message: payload, title: 'Security test' })
  assert.equal(message.success, true)
  assert.equal(message.data.message, payload)
  assert.equal(schemas.messageBody.safeParse({ message: payload, school_id: '2' }).success, false)
})

test('mass assignment cannot alter school, role, permission, or sensitive status', () => {
  for (const field of ['school_id', 'role', 'permission', 'permissions']) {
    assert.equal(schemas.updateStudentBody.safeParse({ first_name: 'Ada', [field]: 'SUPER_ADMIN' }).success, false)
    assert.equal(schemas.updateGuardianBody.safeParse({ first_name: 'Ada', [field]: 'SUPER_ADMIN' }).success, false)
  }
  assert.equal(schemas.updateStudentBody.safeParse({ status: 'SUPER_ADMIN' }).success, false)
})

test('invalid IDs, dates, enums, amounts, filters, and sorting are rejected together', () => {
  assert.equal(schemas.studentParams.safeParse({ schoolId: '../2', studentId: 'NaN' }).success, false)
  assert.equal(schemas.acknowledgementBody.safeParse({ journal_date: '2026-02-30' }).success, false)
  assert.equal(schemas.reportDecisionBody.safeParse({ decision: 'approved' }).success, false)
  assert.equal(schemas.paymentBody.safeParse({ amount: Infinity, payment_method: 'cash' }).success, false)
  assert.equal(schemas.invoiceListQuery.safeParse({ status: 'internal', sort: 'school_id desc' }).success, false)
  assert.equal(schemas.studentListQuery.safeParse({ filter: "1' OR '1'='1" }).success, false)
})
