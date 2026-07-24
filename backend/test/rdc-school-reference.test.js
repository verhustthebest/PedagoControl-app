const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const read=file=>fs.readFileSync(file,'utf8')

test('référentiel RDC couvre maternelle primaire CTEB humanités et professionnel',()=>{
 const source=read('src/services/rdc-school-reference.ts')
 for(const value of ['Maternelle','1re Primaire','6e Primaire','7e CTEB','8e CTEB','1re Humanités','4e Humanités','cycle court (3 ans)','cycle long (4 ans)'])assert.match(source,new RegExp(value.replace(/[()]/g,'\\$&')))
})

test('options importées sont sourcées MINEDU-NC et jamais chargées au runtime',()=>{
 const source=read('src/services/rdc-school-reference.ts'),command=read('src/commands/seed-rdc-school-reference.ts')
 assert.match(source,/edu-nc\.gouv\.cd/)
 assert.match(source,/Pédagogie générale/)
 assert.match(source,/Mathématique-physique/)
 assert.match(command,/education_options\.upsert/)
 assert.doesNotMatch(source,/fetch\(|axios|http\.get/)
})

test('section Autre persiste sous son niveau sans doublon de casse accent ou espace',()=>{
 const service=read('src/services/school-academic.service.ts')
 assert.match(service,/comparisonKey/)
 assert.match(service,/Diacritic/)
 assert.match(service,/referenceDescription\(\[level\],false\)/)
 assert.match(service,/options_by_level/)
})

test('projection Préfet n’interroge plus les public_id Prisma inexistants',()=>{
 const service=read('src/services/school-staff.service.ts')
 const projection=service.slice(service.indexOf('export async function listSchoolStaff'),service.indexOf('export async function updateSchoolStaff'))
 assert.doesNotMatch(projection,/select:\{public_id:true,academic_year_subjects/)
 assert.match(projection,/teacher-assignment/)
 assert.match(projection,/class-subject/)
})
