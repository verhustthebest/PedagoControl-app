import { prefectTeacherControls } from '../../data/mockPedagoData'
import { Badge, Icon } from '../common'

export function PrefectDelayCards() {
  return <div className="prefect-delay-list">{prefectTeacherControls.filter((row) => row.status !== 'Conforme').map((row) => <article key={row.teacher}><span><Icon name="alert" /></span><p><strong>{row.subject} - {row.className}</strong><small>{row.teacher}</small></p><Badge status={row.status} /><em>{row.delay}</em></article>)}</div>
}
