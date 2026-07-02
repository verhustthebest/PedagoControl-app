export function WeekGrid() {
  return <div className="week-grid">{['Lun 29/04', 'Mar 30/04', 'Mer 01/05', 'Jeu 02/05', 'Ven 03/05'].map((day) => <b key={day}>{day}</b>)}{['5ème A Mathématiques', '6ème B Mathématiques'].map((row) => <><strong key={`${row}-label`}>{row}</strong><span>✓</span><span>◔</span><span>-</span><span>✓</span><span>◕</span></>)}</div>
}
