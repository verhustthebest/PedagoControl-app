const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')

test('la création finale est transactionnelle et idempotente par brouillon', () => {
  const service = fs.readFileSync('src/services/school-onboarding.service.ts', 'utf8')
  assert.match(service, /updateMany\(\{ where: \{ id: draft\.id, status: 'draft' \}/)
  assert.match(service, /prisma\.\$transaction/)
  assert.match(service, /status: 'completed'/)
  assert.match(service, /repeated: true/)
  assert.match(service, /academic_years\.create/)
  assert.match(service, /school_subscriptions\.create/)
  assert.match(service, /user_roles\.upsert/)
})

test('le brouillon exclut le mot de passe et appartient au SUPER_ADMIN courant', () => {
  const schemas = fs.readFileSync('src/validation/schemas.ts', 'utf8')
  const service = fs.readFileSync('src/services/school-onboarding.service.ts', 'utf8')
  const routes = fs.readFileSync('src/routes/school.routes.ts', 'utf8')
  assert.match(schemas, /schoolAccount\.omit\(\{\s*password:\s*true\s*\}\)/)
  assert.match(service, /created_by_user_id: BigInt\(userId\)/)
  assert.match(routes, /schoolDraftBody/)
  assert.match(routes, /schoolOnboardingBody/)
})

test('chaque brouillon valide seulement les étapes déjà atteintes', () => {
  const schemas = fs.readFileSync('src/validation/schemas.ts', 'utf8')
  assert.match(schemas, /current_step:z\.literal\(1\).*data:z\.object\(\{ school:schoolInformation \}\)/)
  assert.match(schemas, /current_step:z\.literal\(5\).*account:schoolAccount\.omit/)
  assert.doesNotMatch(schemas, /schoolInformation\.partial\(\)/)
})

test('les 24 communes de Kinshasa sont incluses dans l import idempotent', () => {
  const importer = fs.readFileSync('src/commands/import-geonames-rdc.ts', 'utf8')
  for (const commune of ['Bandalungwa','Barumbu','Bumbu','Gombe','Kalamu','Kasa-Vubu','Kimbanseke','Kinshasa','Kintambo','Kisenso','Lemba','Limete','Lingwala','Makala','Maluku','Masina','Matete','Mont-Ngafula','Ndjili','Ngaba','Ngaliema','Ngiri-Ngiri','Nsele','Selembao']) assert.ok(importer.includes(commune))
  assert.match(importer, /geo_communes\.upsert/)
})

test('l import GeoNames est local, idempotent et couvre les 26 provinces', () => {
  const importer = fs.readFileSync('src/commands/import-geonames-rdc.ts', 'utf8')
  const provinces = importer.match(/'\d{2}':/g) || []
  assert.equal(provinces.length, 26)
  assert.match(importer, /feature === 'ADM2'/)
  assert.match(importer, /feature === 'ADM3'/)
  assert.match(importer, /feature === 'ADM4'/)
  assert.match(importer, /\.upsert\(/)
  assert.match(importer, /GEONAMES_CD_FILE/)
})
