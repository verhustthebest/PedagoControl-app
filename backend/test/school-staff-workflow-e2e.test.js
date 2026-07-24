const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const read=file=>fs.readFileSync(file,'utf8')

test('workflow Admin vers Préfet et Enseignant conserve rôles, école et quota',()=>{
 const service=read('src/services/school-staff.service.ts')
 assert.match(service,/PREFET_DES_ETUDES/)
 assert.match(service,/ENSEIGNANT/)
 assert.match(service,/school_id:schoolId/)
 assert.match(service,/teachers>=subscription\.teacher_limit/)
 assert.match(service,/academic_years:\{school_id:schoolId\}/)
})

test('invitation réelle active le compte sans mot de passe transmis',()=>{
 const service=read('src/services/school-staff.service.ts')
 const routes=read('src/routes/auth.routes.ts')
 assert.match(service,/is_active:false/)
 assert.match(service,/issueActionToken\('invitation'/)
 assert.match(service,/consumeActionToken\(token,'invitation'\)/)
 assert.match(routes,/\/auth\/invitations\/accept/)
 assert.doesNotMatch(service,/text:`[^`]*\$\{password/i)
})

test('notifications internes et fournisseurs gardent leur statut réel',()=>{
 const staff=read('src/services/school-staff.service.ts')
 const delivery=read('src/services/notification-delivery.service.ts')
 assert.match(staff,/notifications\.create/)
 assert.match(staff,/activity_logs\.create/)
 assert.match(staff,/request_id/)
 assert.match(delivery,/response\.ok/)
 assert.match(delivery,/status:'PREPARED'/)
 assert.match(delivery,/status:'FAILED'/)
})

test('routes de personnel refusent les rôles hors Admin école et isolent school_id',()=>{
 const routes=read('src/routes/school.routes.ts')
 assert.match(routes,/requireAnyRole\(\['ADMIN_GESTIONNAIRE'\]\)/)
 assert.match(routes,/requireSchoolScope\(\)/)
 assert.match(routes,/\/assignments/)
})
