const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const{normalizeDrcPhone,PHONE_CONFLICT_MESSAGE}=require('../dist/security/phone-identity')

test('les variantes congolaises produisent le même numéro international',()=>{
 const expected='+243812345678'
 for(const value of['0812345678','812345678','243812345678','+243 812 345 678','00243 812 345 678'])assert.equal(normalizeDrcPhone(value),expected)
 assert.throws(()=>normalizeDrcPhone('1234'))
})

test('créations responsables Admin Préfet Enseignant et Parent utilisent le contrôle central',()=>{
 const onboarding=fs.readFileSync('src/services/school-onboarding.service.ts','utf8')
 const staff=fs.readFileSync('src/services/school-staff.service.ts','utf8')
 const parent=fs.readFileSync('src/services/parental-guardian.service.ts','utf8')
 assert.match(onboarding,/assertPhoneAvailable/)
 assert.match(staff,/assertPhoneAvailable/)
 assert.match(parent,/normalizeDrcPhone/)
 assert.ok(onboarding.match(/assertPhoneAvailable/g).length>=2)
})

test('le message de conflit public est exactement celui demandé',()=>{
 assert.equal(PHONE_CONFLICT_MESSAGE,'Ce numéro de téléphone est déjà associé à un autre compte utilisateur. Vérifiez le numéro ou sélectionnez la personne existante.')
})

test('endpoint de vérification reste authentifié et isolé par école',()=>{
 const routes=fs.readFileSync('src/routes/school.routes.ts','utf8')
 const controller=fs.readFileSync('src/controllers/phone-identity.controller.ts','utf8')
 assert.match(routes,/\/contacts\/phone-check/)
 assert.match(routes,/phoneIdentityBody/)
 assert.match(controller,/request\.user\?\.school_id/)
})
