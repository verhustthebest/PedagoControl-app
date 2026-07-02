import { Badge } from '../common'

export function TeacherRecentTextBook() {
  return <table><thead><tr><th>Date</th><th>Heure</th><th>Classe</th><th>MatiÃ¨re</th><th>Contenu enseignÃ©</th><th>Statut</th></tr></thead><tbody>{[['03/05/2024', '07:30 - 08:30', '5Ã¨me A', 'MathÃ©matiques', 'Fractions : addition et soustraction des fractions'], ['03/05/2024', '09:00 - 10:00', '6Ã¨me B', 'MathÃ©matiques', 'Nombres dÃ©cimaux : comparaison et rangement'], ['03/05/2024', '11:30 - 12:30', '5Ã¨me A', 'Physique-Chimie', 'La matiÃ¨re : Ã©tats physiques'], ['02/05/2024', '14:00 - 15:00', '6Ã¨me B', 'Physique-Chimie', 'Les mÃ©langes : homogÃ¨nes et hÃ©tÃ©rogÃ¨nes']].map((row) => <tr key={`${row[0]}-${row[1]}`}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td><Badge status="Saisi" /></td></tr>)}</tbody></table>
}
