const test = require('node:test')
const assert = require('node:assert/strict')
const schemas = require('../dist/validation/schemas')
const { validate } = require('../dist/middleware/validate.middleware')

function run(schema, location, value) {
  let status
  let payload
  let next = false
  const request = { body: {}, params: {}, query: {}, [location]: value }
  const response = { status(code) { status = code; return this }, json(body) { payload = body; return this } }
  validate({ [location]: schema })(request, response, () => { next = true })
  return { status, payload, next, request }
}

test('unknown fields are rejected with a generic 400 response', () => {
  const result = run(schemas.loginBody, 'body', { email: 'user@example.com', password: 'secret', role: 'SUPER_ADMIN' })
  assert.equal(result.status, 400)
  assert.equal(result.payload.message, 'Invalid request')
  assert.equal(result.payload.errors[0].code, 'unrecognized_keys')
})

test('invalid ids and calendar dates are rejected', () => {
  assert.equal(schemas.studentParams.safeParse({ schoolId: 'NaN', studentId: '-2' }).success, false)
  assert.equal(schemas.acknowledgementBody.safeParse({ journal_date: '2025-02-30' }).success, false)
})

test('overlong text is rejected', () => {
  assert.equal(schemas.messageBody.safeParse({ message: 'x'.repeat(5001) }).success, false)
})

test('negative, NaN and infinite amounts are rejected', () => {
  for (const amount of [-1, NaN, Infinity, '-2', 'not-a-number']) {
    assert.equal(schemas.paymentBody.safeParse({ amount, payment_method: 'cash' }).success, false)
  }
})

test('mass assignment fields are rejected on student updates', () => {
  for (const field of ['school_id', 'role', 'permission']) {
    assert.equal(schemas.updateStudentBody.safeParse({ first_name: 'Ada', [field]: '1' }).success, false)
  }
})

test('SQL and script payloads remain inert plain text', () => {
  const value = "'; DROP TABLE users; -- <script>alert(1)</script>"
  const result = schemas.messageBody.safeParse({ message: value })
  assert.equal(result.success, true)
  assert.equal(result.data.message, value)
})

test('unsupported sorting, filtering and statuses are rejected', () => {
  assert.equal(schemas.studentListQuery.safeParse({ sort: 'school_id desc' }).success, false)
  assert.equal(schemas.invoiceListQuery.safeParse({ status: 'DROP TABLE invoices' }).success, false)
})

test('emails and phones are normalized before controller use', () => {
  const emailResult = schemas.loginBody.parse({ email: ' User@Example.COM ', password: 'password' })
  assert.equal(emailResult.email, 'user@example.com')
  const phoneResult = schemas.loginBody.parse({ email: '+243 999-123-456', password: 'password' })
  assert.equal(phoneResult.email, '+243999123456')
})
