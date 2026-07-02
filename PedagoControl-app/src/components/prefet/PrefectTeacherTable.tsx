import { prefectTeacherControls } from '../../data/mockPedagoData'
import { Avatar, Badge, MiniBar } from '../common'

export function PrefectTeacherTable() {
  return <table><thead><tr><th>Enseignant</th><th>Matiere</th><th>Classe</th><th>Soumises</th><th>Validees</th><th>Rejetees</th><th>Attente</th><th>Avancement</th><th>Retard</th><th>Statut</th></tr></thead><tbody>{prefectTeacherControls.map((row) => <tr key={row.teacher}><td><Avatar name={row.teacher} small />{row.teacher}</td><td>{row.subject}</td><td>{row.className}</td><td>{row.submitted}</td><td>{row.validated}</td><td>{row.rejected}</td><td>{row.waiting}</td><td><MiniBar value={row.rate} tone={row.status} /> {row.rate}%</td><td>{row.delay}</td><td><Badge status={row.status} /></td></tr>)}</tbody></table>
}
