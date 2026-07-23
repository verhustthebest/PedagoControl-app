const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')

test('le référentiel géographique est hiérarchique et protégé contre les doublons', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8')
  const routes = fs.readFileSync('src/routes/geography.routes.ts', 'utf8')
  assert.match(schema, /model geo_provinces/)
  assert.match(schema, /@@unique\(\[province_id, name_key\]\)/)
  assert.match(schema, /@@unique\(\[city_id, name_key\]\)/)
  assert.match(schema, /@@unique\(\[commune_id, name_key\]\)/)
  assert.match(routes, /requireAnyRole\(\['SUPER_ADMIN'\]\)/)
})

test('la commande de nettoyage refuse production et une base distante', () => {
  const command = fs.readFileSync('src/commands/reset-local-school-data.ts', 'utf8')
  assert.match(command, /NODE_ENV === 'production'/)
  assert.match(command, /RESET_LOCAL_SCHOOLS/)
  assert.match(command, /localhost.*127\.0\.0\.1.*::1/)
  assert.match(command, /table_name NOT LIKE 'geo_%'/)
  assert.match(command, /DELETE FROM users WHERE school_id IS NOT NULL/)
})
