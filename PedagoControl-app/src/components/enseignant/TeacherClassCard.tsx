import { SubjectIcon } from '../common'

export function TeacherClassCard({ name, count, next, subject }: { name: string; count: string; next: string; subject: string }) {
  return <article className="teacher-class-card"><SubjectIcon tone="blue" /><strong>{name}</strong><span>Effectif</span><b>{count}</b><span>Prochain cours</span><b>{next}</b><span>MatiÃ¨re</span><b>{subject}</b></article>
}
