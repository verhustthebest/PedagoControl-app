export function WeekGrid() {
  return <div className="week-grid">{['Lun 29/04', 'Mar 30/04', 'Mer 01/05', 'Jeu 02/05', 'Ven 03/05'].map((day) => <b key={day}>{day}</b>)}{['5Ã¨me A MathÃ©matiques', '6Ã¨me B MathÃ©matiques'].map((row) => <><strong key={`${row}-label`}>{row}</strong><span>âœ“</span><span>â—”</span><span>-</span><span>âœ“</span><span>â—•</span></>)}</div>
}
