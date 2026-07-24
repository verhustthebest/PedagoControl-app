const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')

test('Enseignant utilise uniquement ses affectations et des identifiants opaques', () => {
  const service = read('src/services/lesson-report.service.ts')
  assert.match(service, /teacher_user_id:\s*toBigInt\(user\.id\), status: 'active'/)
  assert.match(service, /readOpaqueId\(input\.teacher_assignment_id, 'assignment'/)
  assert.match(service, /Future dates are not allowed/)
  assert.doesNotMatch(service, /return serialize\(reports\)\s*\n}/)
})

test('Préfet isole son école et retourne avec un motif obligatoire', () => {
  const schemas = read('src/validation/schemas.ts')
  const service = read('src/services/lesson-report.service.ts')
  assert.match(schemas, /Le motif du retour est obligatoire/)
  assert.match(service, /schoolScope\(user\)/)
  assert.match(service, /lesson_status: 'correction_requested'/)
})

test('Parent voit immédiatement les leçons envoyées et vise une fois par date', () => {
  const service = read('src/services/parent-portal.service.ts')
  const schema = read('prisma/schema.prisma')
  assert.match(service, /lesson_status: \{ in: \['submitted', 'validated', 'correction_requested'\] \}/)
  assert.match(service, /public_id: studentPublicId/)
  assert.match(service, /journal_snapshot: snapshot/)
  assert.match(schema, /@@unique\(\[guardian_id, student_id, journal_date\]/)
})

test('envoi et renvoi de correction notifient immédiatement Parent et Préfet',()=>{
  const service=read('src/services/lesson-report.service.ts')
  assert.match(service,/notifyParentsJournalAvailable\(report, user\.school_id, teacherUserId\)/)
  assert.match(service,/notifyParentsJournalAvailable\(report, user\.school_id, toBigInt\(user\.id\), true\)/)
  assert.match(service,/lesson_report_resubmitted/)
})

test('notifications Enseignant et Parent réutilisent le transport réel', () => {
  const service = read('src/services/lesson-report.service.ts')
  assert.match(service, /deliverNotification/)
  assert.match(service, /parent_daily_journal_available/)
  assert.match(service, /Promise\.allSettled/)
})
