export function PlanningTable() {
  return <table><thead><tr><th>PÃ©riode</th><th>PÃ©riode</th><th>Chapitres prÃ©vus</th></tr></thead><tbody>{[['PÃ©riode 1', 'Sept. - Oct.', 'Chap. 1 Ã  3'], ['PÃ©riode 2', 'Nov. - DÃ©c.', 'Chap. 4 Ã  6'], ['PÃ©riode 3', 'Janv. - FÃ©vr.', 'Chap. 7 Ã  8'], ['PÃ©riode 4', 'Mars - Juin', 'Chap. 9 Ã  10']].map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table>
}
