import { Link } from 'react-router-dom'
import { Icon } from '../common'

export function ActivityTimeline() {
  return <div className="activity-timeline">{[['07:30 - 08:30', 'Cours : Mathématiques (5ème A)', 'Chapitre 5 : Fractions'], ['09:00 - 10:00', 'Cours : Mathématiques (6ème B)', 'Chapitre 4 : Nombres décimaux'], ['11:30 - 12:30', 'Cours : Physique-Chimie (5ème A)', 'Chapitre 3 : La matière'], ['14:00 - 15:00', 'Cours : Physique-Chimie (6ème B)', 'Chapitre 2 : Les mélanges']].map((item) => <div key={item[0]}><time>{item[0]}</time><strong>{item[1]}</strong><span>{item[2]}</span></div>)}<Link className="secondary-button full" to="/enseignant/cahier-texte"><Icon name="calendar" /> Voir mon emploi du temps</Link></div>
}
