import type { FormEvent } from 'react'
import { Icon } from '../common'

export function TeacherProgressForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="progress-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>Matiere *<select><option>Mathematiques</option></select></label>
        <label>Classe *<select><option>5eme A</option></select></label>
        <label>Programme *<select><option>Repartition annuelle publiee - Mathematiques 5eme A</option></select></label>
        <label>Chapitre *<select><option>Chapitre 4 : Fractions</option></select></label>
        <label>Sous-chapitre *<input defaultValue="4.2 : Addition et soustraction des fractions" /></label>
        <label>Date de la lecon *<input type="date" defaultValue="2024-05-03" /></label>
        <label>Heure du cours<input defaultValue="08:00 a 09:30" /></label>
        <fieldset>
          <legend>Statut *</legend>
          <label><input type="radio" name="status" defaultChecked /> Realise</label>
          <label><input type="radio" name="status" /> Partiellement realise</label>
          <label><input type="radio" name="status" /> Non realise</label>
        </fieldset>
        <div className="objective-box">
          <strong>Objectifs atteints *</strong>
          <span>Comprendre l'addition des fractions.</span>
          <span>Savoir remplacer par le meme denominateur.</span>
          <span>Resoudre des exercices d'application.</span>
        </div>
      </div>
      <label>Resume de la lecon dispensee *<textarea defaultValue="Introduction sur l'addition des fractions. Rappel sur les denominateurs. Methode pour mettre au meme denominateur. Resolution d'exemples au tableau et exercices guides." /></label>
      <div className="form-grid two">
        <label>Exercices realises en classe *<textarea defaultValue="Manuel : Exercices 1 a 6 page 45. Exercices d'application au tableau." /></label>
        <label>Travail a faire / Devoirs *<textarea defaultValue="Exercices 7 a 10 page 46. Apprendre la lecon." /></label>
      </div>
      <div className="attachment-row"><button type="button" className="secondary-button"><Icon name="file" /> Ajouter un fichier</button><span className="muted-cell">PDF, Word, image (max. 5 Mo)</span></div>
      <div className="form-actions"><button type="button" className="secondary-button"><Icon name="file" /> Enregistrer brouillon</button><button type="button" className="secondary-button"><Icon name="down" /> Reinitialiser</button><button className="blue-button" type="submit"><Icon name="arrow" /> Soumettre au Prefet des Etudes</button></div>
    </form>
  )
}
