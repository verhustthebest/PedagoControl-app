import { alerts, subjects } from '../../data/mockPedagoData'
import { Badge, Icon } from '../common'

export function PrefectAlertTable() {
  return <table><thead><tr><th>Alerte</th><th>Enseignant</th><th>Classe</th><th>Niveau</th><th>Date</th><th>Action</th></tr></thead><tbody>{alerts.map((alert, index) => <tr key={alert.title}><td><strong>{alert.title}</strong><br /><span className="muted-cell">{alert.detail}</span></td><td>{subjects[index]?.teacher}</td><td>{subjects[index]?.className}</td><td><Badge status={index < 2 ? 'Critique' : 'En retard'} /></td><td>{alert.time}</td><td><button className="secondary-button" type="button"><Icon name="checkCircle" /> Traiter</button></td></tr>)}</tbody></table>
}
