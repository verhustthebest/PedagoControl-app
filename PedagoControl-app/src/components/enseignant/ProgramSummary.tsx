import { Donut, MiniBar } from '../common'

export function ProgramSummary() {
  return <div className="program-summary"><dl><dt>Matière</dt><dd>Mathématiques</dd><dt>Classe</dt><dd>5ème A</dd><dt>Total chapitres</dt><dd>10</dd><dt>Chapitres réalisés</dt><dd>7</dd><dt>Chapitres restants</dt><dd>3</dd><dt>Taux d’avancement</dt><dd><MiniBar value={70} tone="En avance" /> 70%</dd></dl><Donut value={70} label="Avancement" /></div>
}
