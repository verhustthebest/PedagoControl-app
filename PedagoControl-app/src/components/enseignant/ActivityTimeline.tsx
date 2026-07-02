import { Link } from 'react-router-dom'
import { Icon } from '../common'

export function ActivityTimeline() {
  return <div className="activity-timeline">{[['07:30 - 08:30', 'Cours : MathÃ©matiques (5Ã¨me A)', 'Chapitre 5 : Fractions'], ['09:00 - 10:00', 'Cours : MathÃ©matiques (6Ã¨me B)', 'Chapitre 4 : Nombres dÃ©cimaux'], ['11:30 - 12:30', 'Cours : Physique-Chimie (5Ã¨me A)', 'Chapitre 3 : La matiÃ¨re'], ['14:00 - 15:00', 'Cours : Physique-Chimie (6Ã¨me B)', 'Chapitre 2 : Les mÃ©langes']].map((item) => <div key={item[0]}><time>{item[0]}</time><strong>{item[1]}</strong><span>{item[2]}</span></div>)}<Link className="secondary-button full" to="/enseignant/cahier-texte"><Icon name="calendar" /> Voir mon emploi du temps</Link></div>
}
