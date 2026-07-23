import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('boutons compacts, âges, modules et plans officiels sont raccordés', () => {
  const page = read('src/pages/management/NewSchoolFlow.tsx')
  const css = read('src/App.css')
  assert.match(page, /Noms du responsable/)
  assert.match(page, /responsible','birth_date','date'/)
  assert.match(page, /Contrôle pédagogique — obligatoire/)
  assert.match(page, /Suivi parental — facultatif/)
  assert.match(page, /Trimestrielle/)
  for (const className of ['wizard-cancel','wizard-previous','wizard-next','wizard-create']) assert.match(css, new RegExp(`\\.${className}`))
  assert.match(css, /max-width: 480px/)
})

test('liste écoles utilise la recherche et pagination API sans collection fictive', () => {
  const page = read('src/pages/management/ClientSchools.tsx')
  const service = read('src/services/schools.ts')
  assert.match(page, /schoolsApi\.list/)
  assert.match(page, /setPage\(1\)/)
  assert.match(page, /created===school\.public_id/)
  assert.match(service, /\/schools\?\$\{query\.toString\(\)\}/)
  assert.doesNotMatch(page, /clientSchools/)
})

test('âge minimum élève est contrôlé avant envoi', () => {
  const page = read('src/pages/admin/students/StudentForm.tsx')
  assert.match(page, /getUTCMonth\(\)-33/)
  assert.match(page, /L’élève n’a pas encore atteint l’âge requis pour être inscrit à l’école\./)
})
