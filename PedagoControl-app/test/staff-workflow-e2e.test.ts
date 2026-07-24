import test from'node:test'
import assert from'node:assert/strict'
import fs from'node:fs'
const read=(file:string)=>fs.readFileSync(file,'utf8')

test('Admin crée et affecte les comptes via les API réelles',()=>{
 const page=read('src/pages/admin/academic/AdminAcademicPages.tsx')
 const api=read('src/services/adminAcademic.ts')
 assert.match(page,/adminAcademicApi\.createStaff/)
 assert.match(page,/adminAcademicApi\.assign/)
 assert.match(api,/\/staff/)
 assert.match(api,/\/assignments/)
})

test('activation d’invitation définit le mot de passe puis renvoie à la connexion',()=>{
 const app=read('src/App.tsx'),page=read('src/pages/auth/InvitationActivation.tsx')
 assert.match(app,/path="\/invitation"/)
 assert.match(page,/authApi\.acceptInvitation/)
 assert.match(page,/to="\/login"/)
 assert.doesNotMatch(page,/localStorage|sessionStorage/)
})

test('Préfet et Enseignant arrivent directement sur leur portail exclusif',()=>{
 const policy=read('src/auth/routePolicy.ts')
 const app=read('src/App.tsx')
 assert.match(policy,/PREFET_DES_ETUDES'\]\.includes\(role\)\)\)return'\/prefet'/)
 assert.match(policy,/roles\.includes\('ENSEIGNANT'\)\)return'\/enseignant'/)
 assert.match(app,/allowedRoles=\{\['PREFET', 'PREFET_DES_ETUDES'\]\}/)
 assert.match(app,/allowedRoles=\{\['ENSEIGNANT'\]\}/)
})

test('interface affiche fournisseur statut date et request_id sans faux succès',()=>{
 const page=read('src/pages/admin/academic/AdminAcademicPages.tsx')
 assert.match(page,/delivery\.email\.provider/)
 assert.match(page,/delivery\.email\.status/)
 assert.match(page,/delivery\.created_at/)
 assert.match(page,/delivery\.request_id/)
 assert.doesNotMatch(page,/status="SENT"/)
})
