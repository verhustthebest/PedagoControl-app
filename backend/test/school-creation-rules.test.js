const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')

test('les plans officiels, périodes et modules sont figés à la création', () => {
  const migration = fs.readFileSync('prisma/migrations/20260723110000_update_school_plans_and_user_birth_date/migration.sql', 'utf8')
  const service = fs.readFileSync('src/services/school-onboarding.service.ts', 'utf8')
  for (const plan of ['LOCAL_TEST','BASIC','GOLD','EXTRA','PROFESSIONAL']) assert.ok(migration.includes(`'${plan}'`))
  assert.match(migration, /ARRAY\['monthly','quarterly','annual'\]/)
  assert.match(service, /INVALID_TEACHER_QUOTA/)
  assert.match(service, /school_parental_settings\.create/)
  assert.match(service, /catalog\.trial_days/)
})

test('personnels majeurs et quota Enseignant sont contrôlés côté API', () => {
  const schemas = fs.readFileSync('src/validation/schemas.ts', 'utf8')
  const staff = fs.readFileSync('src/services/school-staff.service.ts', 'utf8')
  const routes = fs.readFileSync('src/routes/school.routes.ts', 'utf8')
  assert.match(schemas, /isAtLeastYearsOld\(value, 18\)/)
  assert.match(staff, /user_roles\.count/)
  assert.match(staff, /teachers>=subscription\.teacher_limit/)
  assert.match(staff, /Impossible de créer un autre compte Enseignant/)
  assert.match(routes, /ADMIN_GESTIONNAIRE/)
})

test('âge minimum élève de deux ans et neuf mois', () => {
  const service = fs.readFileSync('src/services/parental-student.service.ts', 'utf8')
  assert.match(service, /getUTCMonth\(\) - 33/)
  assert.match(service, /L’élève n’a pas encore atteint l’âge requis pour être inscrit à l’école\./)
})
