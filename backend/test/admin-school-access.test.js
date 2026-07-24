const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const{publicAuthUser}=require('../dist/services/auth.service')

test('création école associe une seule fois Admin actif et école',()=>{
 const source=fs.readFileSync('src/services/school-onboarding.service.ts','utf8')
 assert.match(source,/roles\.findUnique\(\{ where: \{ name: 'ADMIN_GESTIONNAIRE' \}/)
 assert.match(source,/if \(!role\?\.is_active\)/)
 assert.match(source,/user_roles\.upsert/)
 assert.match(source,/user_id_role_id/)
 assert.match(source,/school_id:school\.id/)
 assert.match(source,/INVALID_ADMIN_ASSOCIATION/)
})

test('login et me publient rôle école publique et modules sans ID scolaire interne',()=>{
 const dto=publicAuthUser({
  id:'42',email:'admin@school.test',first_name:'Admin',last_name:'École',school_id:'987',
  school_public_id:'3a26a9a5-55cf-43d1-97db-1ebf945dadc9',school_name:'École Test',
  roles:['ADMIN_GESTIONNAIRE'],permissions:[],modules:{pedagogical_control:true,parental_tracking:true},
 })
 assert.deepEqual(dto.roles,['ADMIN_GESTIONNAIRE'])
 assert.equal(dto.school_id,'3a26a9a5-55cf-43d1-97db-1ebf945dadc9')
 assert.equal(dto.school.public_id,dto.school_id)
 assert.deepEqual(dto.modules,{pedagogical_control:true,parental_tracking:true})
 assert.doesNotMatch(JSON.stringify(dto),/"school_id":"987"/)
})

test('/auth/login et /auth/me utilisent le même DTO public',()=>{
 const controller=fs.readFileSync('src/controllers/auth.controller.ts','utf8')
 assert.ok((controller.match(/publicAuthUser/g)||[]).length>=3)
 assert.match(controller,/school_id: request\.user\.school_public_id/)
})
