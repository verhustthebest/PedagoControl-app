import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

test('souscriptions affichent seulement les réponses API réelles',()=>{
 const page=read('src/pages/management/ManagementSubscriptions.tsx'),service=read('src/services/managementSubscriptions.ts'),legacy=read('src/components/portalComponents.tsx')
 assert.match(page,/managementSubscriptionsApi\.list/)
 assert.match(page,/summary\.expiring_soon/)
 assert.match(page,/Aucune souscription enregistrée/)
 assert.match(service,/\/management\/subscriptions/)
 assert.doesNotMatch(page,/PED-2026-0001|Complexe Scolaire La Reussite/)
 assert.doesNotMatch(legacy,/function ManagementSubscriptions/)
})

test('quota est à étape 4, fixe hors Professionnel',()=>{
 const page=read('src/pages/management/NewSchoolFlow.tsx')
 const stage3=page.slice(page.indexOf('step===3'),page.indexOf('step===4'))
 assert.doesNotMatch(stage3,/teacher_limit/)
 assert.match(page,/readOnly=\{selectedPlan\.code!=='PROFESSIONAL'\}/)
 assert.match(page,/configured_teacher_limit/)
 assert.match(page,/min=\{selectedPlan\.code==='PROFESSIONAL'\?25/)
})

test('ADMIN_GESTIONNAIRE retourne directement à son portail et les modules pilotent le menu',()=>{
 const policy=read('src/auth/routePolicy.ts'),route=read('src/auth/ProtectedRoute.tsx'),navigation=read('src/components/adminGestionnaire/AdminNavigation.tsx')
 assert.match(policy,/ADMIN_GESTIONNAIRE'\)\)return'\/admin'/)
 assert.match(route,/portalForRoles\(roles\)/)
 assert.match(navigation,/modules\?\.parental_tracking/)
})

test('texte sous Bientôt expirées est noir',()=>{
 assert.match(read('src/App.css'),/\.subscription-expiring small \{ color: #111 !important; \}/)
})
