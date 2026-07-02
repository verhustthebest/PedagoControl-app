import { mathChapters } from '../../data/mockPedagoData'
import { Badge, Icon, SubjectIcon } from '../common'

export function ProgramAccordion() {
  return <div className="program-accordion"><div className="program-open"><header><span><SubjectIcon tone="blue" />MathÃ©matiques - 5Ã¨me A</span><em>Progression : 70% (7 / 10 chapitres)</em><Icon name="chevron" /></header><table><thead><tr><th>NÂ°</th><th>Chapitres du programme</th><th>Statut</th><th>Date prÃ©vue</th><th>Date rÃ©alisÃ©e</th><th /></tr></thead><tbody>{mathChapters.map((row, index) => <tr key={row[0]}><td>{index + 1}</td><td>{row[0]}</td><td><Badge status={row[1]} /></td><td>{row[2]}</td><td>{row[3]}</td><td>{row[1] === 'TerminÃ©' ? <span className="ok-dot">âœ“</span> : <span className="empty-dot" />}</td></tr>)}</tbody></table></div>{['Physique-Chimie - 5Ã¨me A|38% (3 / 8 chapitres)', 'Physique-Chimie - 6Ã¨me B|25% (2 / 8 chapitres)', 'MathÃ©matiques - 6Ã¨me B|50% (5 / 10 chapitres)'].map((item) => { const [title, rate] = item.split('|'); return <button className="program-closed" key={title}><span>{title}</span><em>Progression : {rate}</em><Icon name="chevron" /></button> })}</div>
}
