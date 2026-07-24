const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const read=path=>fs.readFileSync(path,'utf8')

test('dashboard école est isolé et réservé à ADMIN_GESTIONNAIRE',()=>{
 const routes=read('src/routes/school.routes.ts')
 assert.match(routes,/\/schools\/:schoolId\/dashboard/)
 assert.match(routes,/requireAnyRole\(\['ADMIN_GESTIONNAIRE'\]\).*requireSchoolScope\(\).*schoolDashboard/)
})

test('dashboard utilise des agrégats réels et un DTO sans ID interne',()=>{
 const service=read('src/services/school-dashboard.service.ts')
 for(const query of ['users.count','students.count','academic_years.findFirst','school_subscriptions.findFirst','activity_logs.findMany'])assert.ok(service.includes(query))
 assert.match(service,/public_id: true/)
 assert.match(service,/pedagogical_control: true/)
 assert.match(service,/school_parental_settings\?\.is_enabled/)
 assert.doesNotMatch(service,/\bid:\s*true/)
})
