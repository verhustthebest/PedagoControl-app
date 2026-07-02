import { Icon } from '../common'

export function PrefectObservationList() {
  return <div className="prefect-observation-list">{['Preciser les exercices corriges avant validation finale.', 'Retard justifie mais rattrapage attendu vendredi.', 'Cahier conforme au programme officiel.'].map((item, index) => <article key={item}><Icon name={index === 0 ? 'alert' : 'checkCircle'} /><p>{item}</p><time>{index ? `${index} j` : 'Aujourd hui'}</time></article>)}</div>
}
