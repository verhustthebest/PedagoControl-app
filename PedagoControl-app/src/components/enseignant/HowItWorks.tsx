import { Icon } from '../common'

export function HowItWorks() {
  return <section className="how-it-works"><h2>Comment ça fonctionne ?</h2>{[['file', 'Déclarez', 'Déclarez chaque leçon ou chapitre que vous avez dispensé.'], ['clipboard', 'Soumettez', 'Soumettez votre progression au Préfet des Études.'], ['checkCircle', 'Validation', 'Le Préfet vérifie et valide votre progression.'], ['trend', 'Suivi', 'Votre avancement est pris en compte dans le suivi global.']].map((step) => <article key={step[1]}><Icon name={step[0]} /><strong>{step[1]}</strong><span>{step[2]}</span></article>)}</section>
}
