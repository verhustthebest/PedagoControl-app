import { alerts } from '../../data/mockPedagoData'
import { Badge, Icon } from '../common'

export function PrefectAlertList({ compact = false }: { compact?: boolean }) {
  const rows = alerts.slice(0, compact ? 3 : alerts.length)
  return <div className="prefect-alert-list">{rows.map((alert, index) => <article key={alert.title}><span><Icon name="alert" /></span><p><strong>{alert.title}</strong><small>{alert.detail}</small></p><div className="prefect-alert-meta"><Badge status={index < 2 ? 'Critique' : 'En retard'} /><time>{alert.time}</time></div></article>)}</div>
}
