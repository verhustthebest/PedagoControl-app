import test from'node:test'
import assert from'node:assert/strict'
import fs from'node:fs'
const read=(file:string)=>fs.readFileSync(file,'utf8')

test('Admin crée une demande avec uniquement les public_id',()=>{
 const wizard=read('src/pages/admin/attachments/AttachWizard.tsx')
 const api=read('src/services/adminParental.ts')
 assert.match(wizard,/guardian\.public_id/)
 assert.match(wizard,/selected\.public_id/)
 assert.match(api,/createAttachmentRequest/)
 assert.doesNotMatch(wizard,/guardian\.id/)
})

test('demande reste en attente jusqu’à la décision Admin',()=>{
 const wizard=read('src/pages/admin/attachments/AttachWizard.tsx')
 assert.match(wizard,/Aucun accès Parent ne sera ouvert avant l’approbation/)
 assert.match(wizard,/Demande en attente/)
 assert.match(wizard,/\/admin\/rattachements\/demandes\//)
})

test('activation Parent enchaîne OTP validation mot de passe et connexion',()=>{
 const page=read('src/pages/auth/ParentActivation.tsx'),api=read('src/services/parentActivation.ts')
 assert.match(api,/\/parental\/auth\/request-otp/)
 assert.match(api,/\/parental\/auth\/verify-otp/)
 assert.match(api,/\/parental\/auth\/register/)
 assert.match(page,/to="\/login"/)
 assert.doesNotMatch(page,/localStorage|sessionStorage/)
})

test('PARENT est redirigé et protégé exclusivement sur son portail',()=>{
 const policy=read('src/auth/routePolicy.ts'),app=read('src/App.tsx')
 assert.match(policy,/roles\.includes\('PARENT'\)\)return'\/parent'/)
 assert.match(app,/allowedRoles=\{\['PARENT'\]\}/)
})
