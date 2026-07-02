import { prefectLessonSubmissions } from '../../data/mockPedagoData'
import { Avatar, Badge, Icon, MiniBar } from '../common'

export function PrefectLessonTable({ rows = prefectLessonSubmissions, selectedId, onSelect }: { rows?: typeof prefectLessonSubmissions; selectedId?: number; onSelect?: (id: number) => void }) {
  return <table><thead><tr><th>Enseignant</th><th>Matiere</th><th>Classe</th><th>Lecon soumise</th><th>Date</th><th>Conformite</th><th>Statut</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'prefect-selected-row' : ''}><td><Avatar name={row.teacher} small />{row.teacher}</td><td>{row.subject}</td><td>{row.className}</td><td><strong>{row.chapter}</strong><br /><span className="muted-cell">{row.subChapter}</span></td><td>{row.date}</td><td><MiniBar value={row.rate} tone={row.status} /> {row.rate}%</td><td><Badge status={row.status} /></td><td><button className="icon-button" type="button" onClick={() => onSelect?.(row.id)}><Icon name="eye" /></button></td></tr>)}</tbody></table>
}
