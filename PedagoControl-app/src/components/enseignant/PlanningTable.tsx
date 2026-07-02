export function PlanningTable() {
  return <table><thead><tr><th>Période</th><th>Période</th><th>Chapitres prévus</th></tr></thead><tbody>{[['Période 1', 'Sept. - Oct.', 'Chap. 1 à 3'], ['Période 2', 'Nov. - Déc.', 'Chap. 4 à 6'], ['Période 3', 'Janv. - Févr.', 'Chap. 7 à 8'], ['Période 4', 'Mars - Juin', 'Chap. 9 à 10']].map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table>
}
