import { prefectCommunications } from '../../data/mockPedagoData'
import { Icon } from '../common'

export function PrefectMessageFeed({ detailed = false }: { detailed?: boolean }) {
  return <div className={`prefect-message-feed${detailed ? ' detailed' : ''}`}>{prefectCommunications.map((item) => <article key={`${item.from}-${item.title}`}><span><Icon name={item.icon} /></span><p><strong>{item.from}</strong><b>{item.title}</b><small>{item.preview}</small></p><time>{item.time}</time></article>)}{detailed && <button className="secondary-button" type="button"><Icon name="arrow" /> Voir tout</button>}</div>
}
