import { Icon } from '../common'

export function HowItWorks() {
  return <section className="how-it-works"><h2>Comment Ã§a fonctionne ?</h2>{[['file', 'DÃ©clarez', 'DÃ©clarez chaque leÃ§on ou chapitre que vous avez dispensÃ©.'], ['clipboard', 'Soumettez', 'Soumettez votre progression au PrÃ©fet des Ã‰tudes.'], ['checkCircle', 'Validation', 'Le PrÃ©fet vÃ©rifie et valide votre progression.'], ['trend', 'Suivi', 'Votre avancement est pris en compte dans le suivi global.']].map((step) => <article key={step[1]}><Icon name={step[0]} /><strong>{step[1]}</strong><span>{step[2]}</span></article>)}</section>
}
