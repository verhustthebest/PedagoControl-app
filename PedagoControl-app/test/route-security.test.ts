import test from 'node:test'
import assert from 'node:assert/strict'
import { jwtStatus } from '../src/auth/jwt.ts'
import {
  allowedRolesForPath,
  canAccessPath,
  DIRECTION_ROLES,
  protectedRouteDecision,
} from '../src/auth/routePolicy.ts'

function token(exp: number) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'none' })}.${encode({ exp })}.signature`
}

test('JWT missing, malformed and expired are rejected', () => {
  assert.equal(jwtStatus(null, 100), 'missing')
  assert.equal(jwtStatus('invalid', 100), 'invalid')
  assert.equal(jwtStatus(token(99), 100), 'expired')
  assert.equal(jwtStatus(token(101), 100), 'valid')
})

test('ProtectedRoute waits for restoration before rendering private content', () => {
  assert.equal(protectedRouteDecision(true, false, [], ['ENSEIGNANT']), 'loading')
  assert.equal(protectedRouteDecision(false, false, [], ['ENSEIGNANT']), 'unauthenticated')
  assert.equal(protectedRouteDecision(false, true, ['PREFET'], ['ENSEIGNANT']), 'forbidden')
  assert.equal(protectedRouteDecision(false, true, ['ENSEIGNANT'], ['ENSEIGNANT']), 'allowed')
})

test('route policy is deny-by-default', () => {
  assert.equal(allowedRolesForPath('/inconnu'), null)
  assert.equal(canAccessPath('/inconnu', ['SUPER_ADMIN']), false)
  assert.equal(canAccessPath('/management/ecoles', []), false)
})

test('each private portal only accepts its configured role', () => {
  const cases = [
    ['/management/ecoles', 'SUPER_ADMIN'],
    ['/admin/utilisateurs', 'ADMIN_GESTIONNAIRE'],
    ['/informaticien/parents', 'INFORMATICIEN'],
    ['/parent/enfants', 'PARENT'],
    ['/prefet/rapports', 'PREFET'],
    ['/enseignant/cahier-texte', 'ENSEIGNANT'],
  ] as const

  for (const [path, role] of cases) {
    assert.equal(canAccessPath(path, [role]), true, `${role} should access ${path}`)
    assert.equal(canAccessPath(path, ['PARENT']), role === 'PARENT')
    assert.equal(canAccessPath(path, ['ENSEIGNANT']), role === 'ENSEIGNANT')
  }
})

test('direction portal accepts only the declared direction roles', () => {
  for (const role of DIRECTION_ROLES) {
    assert.equal(canAccessPath('/directeur/rapports', [role]), true)
  }
  assert.equal(canAccessPath('/directeur/rapports', ['SUPER_ADMIN']), false)
  assert.equal(canAccessPath('/directeur/rapports', ['ADMIN_GESTIONNAIRE']), false)
  assert.equal(canAccessPath('/directeur/rapports', ['PREFET']), false)
})

test('a connected user cannot cross from one portal to another', () => {
  assert.equal(canAccessPath('/prefet/rapports', ['ENSEIGNANT']), false)
  assert.equal(canAccessPath('/enseignant/cahier-texte', ['PREFET']), false)
  assert.equal(canAccessPath('/management/ecoles', ['ADMIN_GESTIONNAIRE']), false)
  assert.equal(canAccessPath('/admin', ['SUPER_ADMIN']), false)
})
