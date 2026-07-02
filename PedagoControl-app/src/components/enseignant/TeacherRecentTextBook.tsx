import { Badge } from '../common'

export function TeacherRecentTextBook() {
  return <table><thead><tr><th>Date</th><th>Heure</th><th>Classe</th><th>Matière</th><th>Contenu enseigné</th><th>Statut</th></tr></thead><tbody>{[['03/05/2024', '07:30 - 08:30', '5ème A', 'Mathématiques', 'Fractions : addition et soustraction des fractions'], ['03/05/2024', '09:00 - 10:00', '6ème B', 'Mathématiques', 'Nombres décimaux : comparaison et rangement'], ['03/05/2024', '11:30 - 12:30', '5ème A', 'Physique-Chimie', 'La matière : états physiques'], ['02/05/2024', '14:00 - 15:00', '6ème B', 'Physique-Chimie', 'Les mélanges : homogènes et hétérogènes']].map((row) => <tr key={`${row[0]}-${row[1]}`}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td><Badge status="Saisi" /></td></tr>)}</tbody></table>
}
