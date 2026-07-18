const test = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const tokenConfig = require('../dist/config/token-security')
const { verifyAuthToken, isAccountEligible } = require('../dist/services/auth.service')
const { hashOtp, safelyCompareOtp, otpCanBeUsed, invalidatePendingOtp } = require('../dist/security/otp-security')

const accessSecret = 'Access-Token-Secret-2026!Strong#Value-Alpha'
const parentSecret = 'Parent-Registration-Secret-2026!Strong#Beta'
const resetSecret = 'Reset-Credential-2026!Strong#Value-Gamma-Delta'

function environment(values, callback) {
  const keys = Object.keys(values)
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]))
  Object.assign(process.env, values)
  try { return callback() } finally {
    for (const key of keys) previous[key] === undefined ? delete process.env[key] : process.env[key] = previous[key]
  }
}

function accessToken(overrides = {}, options = {}) {
  return jwt.sign({ roles: ['ENSEIGNANT'], school_id: '1', token_type: 'access', jti: 'test-jti', sid: 'c60f813c-5dea-4f03-a14f-b672825041e5', ...overrides }, accessSecret, {
    algorithm: 'HS256', expiresIn: '15m', issuer: 'test-issuer', audience: 'test-audience', subject: '42', ...options,
  })
}

function withAccessConfig(callback) {
  return environment({ ACCESS_TOKEN_SECRET: accessSecret, ACCESS_TOKEN_ISSUER: 'test-issuer', ACCESS_TOKEN_AUDIENCE: 'test-audience' }, callback)
}

test('production refuses missing, weak, or shared token secrets', () => {
  environment({ NODE_ENV: 'production', ACCESS_TOKEN_SECRET: 'weak', PARENT_REGISTRATION_TOKEN_SECRET: parentSecret, PASSWORD_RESET_TOKEN_SECRET: resetSecret, JWT_SECRET: '' }, () => {
    assert.throws(() => tokenConfig.validateTokenConfiguration(), /ACCESS_TOKEN_SECRET/)
  })
  environment({ NODE_ENV: 'production', ACCESS_TOKEN_SECRET: accessSecret, PARENT_REGISTRATION_TOKEN_SECRET: accessSecret, PASSWORD_RESET_TOKEN_SECRET: resetSecret }, () => {
    assert.throws(() => tokenConfig.validateTokenConfiguration(), /distinct/)
  })
})

test('access verification refuses an incorrect algorithm', () => withAccessConfig(() => {
  const token = accessToken({}, { algorithm: 'HS384' })
  assert.throws(() => verifyAuthToken(token))
}))

test('access verification refuses incorrect issuer and audience', () => withAccessConfig(() => {
  assert.throws(() => verifyAuthToken(accessToken({}, { issuer: 'other' })))
  assert.throws(() => verifyAuthToken(accessToken({}, { audience: 'other' })))
}))

test('access verification refuses wrong type, expired, and Parent tokens', () => withAccessConfig(() => {
  assert.throws(() => verifyAuthToken(accessToken({ token_type: 'parent_registration' })))
  assert.throws(() => verifyAuthToken(accessToken({}, { expiresIn: '-1s' })))
  const parent = jwt.sign({ token_type: 'parent_registration', jti: 'parent-jti' }, parentSecret, { algorithm: 'HS256', issuer: 'pedago-control-parent-registration', audience: 'pedago-control-parent-registration-action', subject: '1' })
  assert.throws(() => verifyAuthToken(parent))
}))

test('disabled users, inactive roles, and suspended schools are refused', () => {
  assert.equal(isAccountEligible({ is_active: false, school_id: 1n, schools: { status: 'active' }, activeRoleCount: 1 }), false)
  assert.equal(isAccountEligible({ is_active: true, school_id: 1n, schools: { status: 'active' }, activeRoleCount: 0 }), false)
  assert.equal(isAccountEligible({ is_active: true, school_id: 1n, schools: { status: 'suspended' }, activeRoleCount: 1 }), false)
})

test('OTP is hashed and compared safely', async () => {
  const code = '123456'
  const hash = await hashOtp(code)
  assert.notEqual(hash, code)
  assert.equal(hash.includes(code), false)
  assert.equal(await safelyCompareOtp(code, hash), true)
  assert.equal(await safelyCompareOtp('654321', hash), false)
})

test('OTP cannot be used twice and an older pending OTP is superseded', () => {
  const expires_at = new Date(Date.now() + 60_000)
  assert.equal(otpCanBeUsed({ status: 'pending', expires_at }), true)
  assert.equal(otpCanBeUsed({ status: 'verified', expires_at }), false)
  assert.equal(invalidatePendingOtp('pending'), 'superseded')
  assert.equal(otpCanBeUsed({ status: invalidatePendingOtp('pending'), expires_at }), false)
})
