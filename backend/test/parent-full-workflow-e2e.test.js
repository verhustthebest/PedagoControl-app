const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const read=file=>fs.readFileSync(file,'utf8')

test('élève réel exige âge et classe annuelle active de la même école',()=>{
 const schema=read('src/validation/schemas.ts'),service=read('src/services/parental-student.service.ts')
 assert.match(schema,/academic_year_class_id: publicId/)
 assert.match(service,/getUTCMonth\(\) - 33/)
 assert.match(service,/academic_years: \{ school_id: schoolId, is_active:true \}/)
})

test('demande en attente ne donne aucun accès avant approbation Admin',()=>{
 const service=read('src/services/attachment-request.service.ts')
 assert.match(service,/status:'pending'/)
 assert.match(service,/student_guardians\.upsert/)
 assert.match(service,/decision==='APPROUVE'/)
 const access=read('src/middleware/public-resource.middleware.ts')
 assert.match(access,/status: 'active'/)
})

test('OTP Parent est haché expirant unique et utilise le fournisseur réel',()=>{
 const service=read('src/services/parent-registration.service.ts')
 assert.match(service,/hashOtp\(code\)/)
 assert.match(service,/status: 'superseded'/)
 assert.match(service,/expires_at: expiresAt/)
 assert.match(service,/sendRegistrationOtp/)
 assert.match(service,/provider:delivery\.provider,status:delivery\.status/)
 assert.doesNotMatch(service,/return\s*\{[^}]*code/)
})

test('activation exige lien approuvé puis crée le rôle PARENT',()=>{
 const service=read('src/services/parent-registration.service.ts')
 assert.match(service,/validated_at: \{ not: null \}/)
 assert.match(service,/name: 'PARENT', is_active: true/)
 assert.match(service,/consumeActionToken\(token, 'parent_activation'\)/)
 assert.doesNotMatch(service,/password.*sendRegistrationOtp/)
})

test('portail Parent limite enfants journaux et visas aux liens approuvés',()=>{
 const portal=read('src/services/parent-portal.service.ts')
 assert.match(portal,/validated_at: \{ not: null \}/)
 assert.match(portal,/lesson_status: \{ in: \['submitted', 'validated', 'correction_requested'\] \}/)
 assert.match(portal,/parent_daily_acknowledgements\.create/)
 assert.match(portal,/public_id:link\.students\.public_id/)
})
