import { initialProgressHistory } from '../../data/mockPedagoData'
import { Badge, Icon } from '../common'

export function ProgressHistoryTable({ rows }: { rows: typeof initialProgressHistory }) {
  return <table><thead><tr><th>Date</th><th>Matière</th><th>Classe</th><th>Chapitre / Sous-chapitre</th><th>Statut</th><th>Action</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.date}-${row.chapter}-${index}`} className={row.status === 'En attente' ? 'pending-row' : ''}><td>{row.date}</td><td>{row.subject}</td><td>{row.className}</td><td>{row.chapter}</td><td><Badge status={row.status} /></td><td><button className="icon-button"><Icon name="eye" /></button></td></tr>)}</tbody></table>
}
