import { Icon } from '../common'

export function PrefectActionStrip({ compact = false }: { compact?: boolean }) {
  const actions = compact ? ['Execution des programmes', 'Retards enseignants', 'Validations hebdomadaires'] : ['Notifier les enseignants en retard', 'Exporter les ecarts', 'Programmer une reunion pedagogique', 'Generer rapport de controle']
  return <div className="prefect-action-strip">{actions.map((action, index) => <button className={index === 0 ? 'blue-button' : 'secondary-button'} type="button" key={action}><Icon name={index === 0 ? 'message' : 'file'} /> {action}</button>)}</div>
}
