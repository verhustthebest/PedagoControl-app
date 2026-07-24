const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const read=path=>fs.readFileSync(path,'utf8')

test('souscriptions Management utilisent Prisma, filtres, pagination et DTO public',()=>{
 const service=read('src/services/management-subscription.service.ts'),routes=read('src/routes/school.routes.ts')
 assert.match(service,/school_subscriptions\.findMany/)
 assert.match(service,/skip:\(input\.page-1\)\*input\.limit/)
 assert.match(service,/public_id:true/)
 assert.match(service,/summary:/)
 assert.doesNotMatch(service,/PED-2026|Complexe Scolaire La Reussite/)
 assert.match(routes,/\/management\/subscriptions/)
 assert.match(routes,/requireAnyRole\(\['SUPER_ADMIN'\]\)/)
})

test('quota du plan est figé sauf Professionnel et réutilisé pour les Enseignants',()=>{
 const onboarding=read('src/services/school-onboarding.service.ts'),staff=read('src/services/school-staff.service.ts')
 assert.match(onboarding,/catalog\.code === 'PROFESSIONAL'/)
 assert.match(onboarding,/LOCAL_TEST_TEACHER_QUOTA/)
 assert.match(onboarding,/input\.academic\.teacher_limit !== expectedQuota/)
 assert.match(staff,/teachers>=subscription\.teacher_limit/)
})

test('notifications Admin utilisent deux canaux, deux modes et conservent le résultat réel',()=>{
 const onboarding=read('src/services/school-onboarding.service.ts'),delivery=read('src/services/notification-delivery.service.ts')
 assert.match(onboarding,/to: input\.account\.email/)
 assert.match(onboarding,/channel:'sms',to:input\.account\.phone/)
 assert.doesNotMatch(onboarding,/input\.account\.password.*text:/)
 for(const field of ['provider','status','date','request_id'])assert.ok(onboarding.includes(field))
 assert.match(delivery,/EMAIL_NOTIFICATION_MODE/)
 assert.match(delivery,/SMS_NOTIFICATION_MODE/)
})

test('auth me expose rôle et modules du compte Admin école',()=>{
 const auth=read('src/services/auth.service.ts'),controller=read('src/controllers/auth.controller.ts')
 assert.match(auth,/school_parental_settings/)
 assert.match(auth,/parental_tracking:/)
 assert.match(controller,/roles: request\.user\.roles/)
})
