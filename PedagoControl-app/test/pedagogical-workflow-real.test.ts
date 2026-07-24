import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=(file:string)=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8')

test('Enseignant choisit une affectation réelle sans ID interne',()=>{
  const page=read('src/components/portalComponents.tsx')
  const api=read('src/services/reports.ts')
  assert.match(page,/reportsApi\.getTeacherAssignments/)
  assert.match(page,/max=\{localDateInputValue\(\)\}/)
  assert.match(api,/assignment_public_id/)
  assert.match(api,/distribution_public_id/)
})

test('Préfet valide ou retourne sans rejet opaque',()=>{
  const page=read('src/components/portalComponents.tsx')
  assert.match(page,/Retourner à l’Enseignant/)
  assert.match(page,/Visibles aux Parents/)
})

test('Parent utilise le public_id et conserve le visa existant',()=>{
  const api=read('src/services/parentApi.ts')
  const detail=read('src/pages/parent/ParentJournalDetail.tsx')
  assert.match(api,/encodeURIComponent\(publicId\)/)
  assert.match(detail,/lesson_count_snapshot/)
  assert.match(detail,/En attente de contrôle/)
  assert.match(detail,/Validé par le Préfet/)
  assert.match(detail,/En correction/)
  assert.doesNotMatch(detail,/lessons\.filter/)
})
