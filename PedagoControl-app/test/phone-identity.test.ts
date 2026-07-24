import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

test('Frontend normalise et vérifie avant la création',()=>{
 const service=read('src/services/phoneIdentity.ts'),wizard=read('src/pages/management/NewSchoolFlow.tsx')
 assert.match(service,/\/contacts\/phone-check/)
 assert.match(service,/startsWith\('0'\)/)
 assert.match(wizard,/verifyPersonPhone\('responsible'\)/)
 assert.match(wizard,/verifyPersonPhone\('account'\)/)
})

test('même personne propose la réutilisation et autre identité bloque',()=>{
 const wizard=read('src/pages/management/NewSchoolFlow.tsx'),parent=read('src/pages/admin/guardians/GuardianForm.tsx')
 assert.match(wizard,/REUSE_ACCOUNT/)
 assert.match(wizard,/CONTACT_WITHOUT_ACCOUNT/)
 assert.match(parent,/Réutiliser ce parent existant/)
 assert.match(parent,/PHONE_CONFLICT_MESSAGE/)
})

test('message de conflit est identique au Backend',()=>{
 const service=read('src/services/phoneIdentity.ts')
 assert.match(service,/Ce numéro de téléphone est déjà associé à un autre compte utilisateur\. Vérifiez le numéro ou sélectionnez la personne existante\./)
})
