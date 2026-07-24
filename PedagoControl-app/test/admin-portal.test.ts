import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { canAccessPath } from '../src/auth/routePolicy.ts'

const root = resolve(import.meta.dirname, '..')
const source = (file: string) => readFileSync(resolve(root, file), 'utf8')

test('all Admin routes remain exclusive to ADMIN_GESTIONNAIRE', () => {
  for (const path of ['/admin', '/admin/suivi-parental', '/admin/suivi-parental/configuration']) {
    assert.equal(canAccessPath(path, ['ADMIN_GESTIONNAIRE']), true)
    assert.equal(canAccessPath(path, ['SUPER_ADMIN']), false)
    assert.equal(canAccessPath(path, ['PARENT']), false)
  }
})

test('Admin dashboard handles loading, error and clean empty states', () => {
  const state = source('src/pages/admin/AdminPageState.tsx')
  const dashboard = source('src/pages/admin/AdminDashboard.tsx')
  const service = source('src/services/schoolDashboard.ts')
  assert.match(state, /status === 'loading'/)
  assert.match(state, /status === 'error'/)
  assert.doesNotMatch(dashboard, /Donnée indisponible|mock/i)
  assert.match(dashboard, /Aucune année active/)
  assert.match(dashboard, /Aucun abonnement/)
  assert.match(service, /\/schools\/\$\{encodeURIComponent\(schoolPublicId\)\}\/dashboard/)
  assert.match(dashboard, /Activités récentes/)
  assert.match(dashboard, /Aucune activité récente\./)
})

test('cartes Admin exposent toutes les données réelles et les modules', () => {
  const dashboard = source('src/pages/admin/AdminDashboard.tsx')
  for (const label of ['École connectée','Année scolaire','Utilisateurs','Élèves','Enseignants','Abonnement principal','Code école','Statut école','Quota enseignants','Contrôle pédagogique','Suivi parental']) {
    assert.ok(dashboard.includes(label))
  }
  assert.match(dashboard, /dashboard\.modules\.parental_tracking/)
  assert.match(dashboard, /dashboard\.subscription\?\.teacher_limit/)
})

test('dashboard Admin est responsive sans débordement', () => {
  const css = source('src/layouts/admin-layout.css')
  for (const width of ['1024px','768px','375px']) assert.ok(css.includes(width))
  assert.match(css, /overflow-wrap:anywhere/)
  assert.match(css, /min-width:0/)
})

test('parental dashboard displays module state and real API-backed totals', () => {
  const dashboard = source('src/pages/admin/ParentalDashboard.tsx')
  const service = source('src/services/adminParental.ts')
  assert.match(dashboard, /État du module/)
  assert.match(dashboard, /Élèves suivis/)
  assert.match(service, /parental_tracking_enabled=true/)
  assert.match(service, /\/notifications\/unread-count/)
})

test('price is read-only and no Parent payment action is exposed', () => {
  const configuration = source('src/pages/admin/ParentalConfiguration.tsx')
  assert.match(configuration, /<output className="admin-readonly">/)
  assert.match(configuration, /Défini exclusivement par Management/)
  assert.match(configuration, /Aucun paiement direct n’est demandé au Parent/)
  assert.doesNotMatch(configuration, /Payer maintenant|Effectuer un paiement/)
})

test('opaque school public_id is preferred when supplied by the API', () => {
  const service = source('src/services/adminParental.ts')
  assert.match(service, /school\?\.public_id \|\| user\.school_id/)
  assert.match(service, /encodeURIComponent\(schoolId\)/)
})
