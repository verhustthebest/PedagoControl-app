import { teacherPrograms } from '../../data/mockPedagoData'
import { MiniBar, SubjectIcon } from '../common'

export function TeacherProgramRows() {
  return <table><thead><tr><th>Matière</th><th>Classe</th><th>Chapitre en cours</th><th>Progression</th></tr></thead><tbody>{teacherPrograms.map((item) => <tr key={`${item.subject}-${item.className}`}><td><SubjectIcon tone={item.color} />{item.subject}</td><td>{item.className}</td><td><strong>{item.chapter}</strong><br />{item.topic}</td><td><MiniBar value={item.rate} tone="En avance" /> {item.rate}%</td></tr>)}</tbody></table>
}
