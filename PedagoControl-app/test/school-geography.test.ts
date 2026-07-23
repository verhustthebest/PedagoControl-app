import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('étape 1 expose les types et le placeholder d’adresse demandés', () => {
  const page = read('src/pages/management/NewSchoolFlow.tsx')
  for (const type of ['Complexe scolaire', 'Collège', 'Lycée', 'Groupe scolaire', 'Institut', 'E.P', 'E.P 1', 'E.P 2', 'E.P 3']) assert.ok(page.includes(type))
  assert.match(page, /Avenue & Numéro de la parcelle/)
  assert.match(page, /Quartier\.\.\./)
})

test('localisation dépendante utilise les public_id et permet les valeurs Autre', () => {
  const page = read('src/pages/management/NewSchoolFlow.tsx')
  const service = read('src/services/geography.ts')
  assert.match(page, /async function province/)
  assert.match(page, /async function city/)
  assert.match(page, /async function commune/)
  assert.match(page, /Autre ville/)
  assert.match(page, /Autre commune/)
  assert.match(page, /Autre quartier/)
  assert.doesNotMatch(service, /\b(id|province_id|city_id|commune_id)\b/)
  assert.match(service, /public_id/)
})

test('tests notifications quittent le menu métier et sont masqués en production', () => {
  const data = read('src/data/mockPedagoData.ts')
  const layout = read('src/components/portalComponents.tsx')
  const mainNavigation = data.slice(data.indexOf('managementNavItems'), data.indexOf('managementTechnicalNavItems'))
  assert.doesNotMatch(mainNavigation, /notifications\/tests/)
  assert.match(data, /MODE !== 'production'/)
  assert.match(data, /VITE_NOTIFICATION_MODE === 'test_live'/)
  assert.match(layout, /Outils techniques/)
})

test('les cinq étapes conservent un état unique et finalisent une seule école', () => {
  const page = read('src/pages/management/NewSchoolFlow.tsx')
  const service = read('src/services/schoolOnboarding.ts')
  for (const label of ['Informations école', 'Responsable', 'Configuration scolaire', 'Abonnement & paiement', 'Compte école']) assert.ok(page.includes(label))
  assert.match(page, /setStep\(value=>value\+1\)/)
  assert.match(page, /setStep\(value=>value-1\)/)
  assert.match(page, /Corrigez les champs signalés/)
  assert.match(page, /saveDraft/)
  assert.match(page, /schoolOnboardingApi\.finalize/)
  assert.match(service, /\/schools\/onboarding'/)
})

test('la sauvegarde est automatique, restaurable et sans bouton brouillon visible', () => {
  const page = read('src/pages/management/NewSchoolFlow.tsx')
  const service = read('src/services/schoolOnboarding.ts')
  assert.doesNotMatch(page, />Enregistrer brouillon</)
  assert.match(page, /saveSchoolWizardSnapshot\(\{step,draftId,data\}\)/)
  assert.match(page, /loadSchoolWizardSnapshot\(\)/)
  assert.match(page, /clearSchoolWizardSnapshot\(\)/)
  assert.match(service, /password:undefined/)
  assert.match(service, /if\(current_step>=2\)/)
  assert.match(service, /if\(current_step>=5\)/)
})

test('une erreur réseau conserve les saisies dans le snapshot local', () => {
  const page = read('src/pages/management/NewSchoolFlow.tsx')
  assert.match(page, /catch\(error\)\{backendError\(error\);return null\}/)
  assert.match(page, /useEffect\(\(\)=>\{saveSchoolWizardSnapshot/)
  assert.doesNotMatch(page, /setData\(initialData\)/)
})
