import { useState } from 'react'
import { Badge, Card, Donut, Filters, Icon, Legend, MiniBar, TeacherStats } from '../common'

const initialTeacherEvaluations = [
  { date: '02/05/2024', className: '5eme A', subject: 'Mathematiques', type: 'Controle', topic: 'Chapitre 3 : Nombres decimaux', students: 38, average: '76%', status: 'Corrige' },
  { date: '30/04/2024', className: '6eme B', subject: 'Mathematiques', type: 'Devoir', topic: 'Chapitre 2 : Nombres decimaux', students: 36, average: '68%', status: 'Corrige' },
  { date: '25/04/2024', className: '5eme A', subject: 'Mathematiques', type: 'Interrogation', topic: 'Chapitre 2 : Fractions', students: 38, average: '-', status: 'En cours' },
  { date: '20/04/2024', className: '6eme B', subject: 'Mathematiques', type: 'Test', topic: 'Chapitre 1 : Les entiers', students: 36, average: '-', status: 'En cours' },
  { date: '15/04/2024', className: '5eme A', subject: 'Mathematiques', type: 'Controle', topic: 'Chapitre 1 : Les entiers', students: 38, average: '71%', status: 'Corrige' },
  { date: '10/04/2024', className: '6eme B', subject: 'Mathematiques', type: 'Devoir', topic: 'Chapitre 3 : Fractions', students: 36, average: '74%', status: 'Corrige' },
  { date: '05/04/2024', className: '5eme A', subject: 'Mathematiques', type: 'Interrogation', topic: 'Chapitre 1 : Nombres entiers', students: 38, average: '-', status: 'Planifie' },
  { date: '01/04/2024', className: '6eme B', subject: 'Mathematiques', type: 'Test', topic: 'Chapitre 1 : Nombres entiers', students: 36, average: '-', status: 'Planifie' },
]

export function TeacherEvaluations() {
  const [evaluations, setEvaluations] = useState(initialTeacherEvaluations)
  const [message, setMessage] = useState('')

  function createEvaluation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEvaluations((current) => [
      { date: '03/05/2024', className: '5eme A', subject: 'Mathematiques', type: 'Controle', topic: 'Controle chapitre 3', students: 38, average: '-', status: 'Planifie' },
      ...current,
    ])
    setMessage("Evaluation enregistree et ajoutee a la liste.")
  }

  return (
    <>
      <TeacherStats items={[
        { icon: 'clipboard', value: '8', label: 'Evaluations ce trimestre', detail: 'Toutes classes confondues', tone: 'blue' },
        { icon: 'checkCircle', value: '5', label: 'Evaluations corrigees', detail: 'Avec resultats', tone: 'green' },
        { icon: 'clock', value: '2', label: 'En cours de correction', detail: 'A finaliser', tone: 'orange' },
        { icon: 'chart', value: '73%', label: 'Taux de reussite moyen', detail: 'Ce trimestre', tone: 'purple' },
        { icon: 'calendar', value: '12', label: 'Eleves evalues', detail: 'Moyenne par evaluation', tone: 'cyan' },
      ]} />
      {message && <div className="success-toast"><Icon name="checkCircle" /> {message}</div>}
      <section className="teacher-evaluations-grid">
        <Card title="Liste de mes evaluations" className="table-card teacher-evaluation-list">
          <div className="toolbar-row"><Filters labels={['Classe', 'Matiere', 'Type']} action="Filtrer" /></div>
          <table>
            <thead><tr><th>Date</th><th>Classe</th><th>Matiere</th><th>Type</th><th>Sujet / Chapitres</th><th>Eleves</th><th>Moyenne</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody>{evaluations.map((item, index) => <tr key={`${item.date}-${item.type}-${index}`}><td>{item.date}</td><td>{item.className}</td><td>{item.subject}</td><td><Badge status={item.type} /></td><td>{item.topic}</td><td>{item.students}</td><td className={item.average === '68%' ? 'evaluation-warning' : ''}>{item.average}</td><td><Badge status={item.status} /></td><td><button className="icon-button" type="button"><Icon name="eye" /></button></td></tr>)}</tbody>
          </table>
          <button className="secondary-button evaluation-more" type="button">Voir toutes mes evaluations <Icon name="arrow" /></button>
        </Card>

        <Card title="Creer une nouvelle evaluation">
          <form className="textbook-form" onSubmit={createEvaluation}>
            <div className="form-grid two"><label>Classe *<select><option>Selectionner une classe</option><option>5eme A</option><option>6eme B</option></select></label><label>Matiere *<select><option>Selectionner une matiere</option><option>Mathematiques</option></select></label></div>
            <fieldset className="inline-radios"><legend>Type d'evaluation *</legend><label><input type="radio" name="evalType" defaultChecked /> Controle</label><label><input type="radio" name="evalType" /> Interrogation</label><label><input type="radio" name="evalType" /> Test</label><label><input type="radio" name="evalType" /> Devoir</label></fieldset>
            <label>Titre / Sujet *<input defaultValue="Controle chapitre 3" /></label>
            <label>Chapitres concernes *<input placeholder="Selectionner les chapitres" /></label>
            <div className="form-grid two"><label>Date de l'evaluation *<input type="date" defaultValue="2024-05-03" /></label><label>Duree *<input defaultValue="02:00" /></label></div>
            <button className="blue-button" type="submit"><Icon name="calendar" /> Enregistrer l'evaluation</button>
          </form>
        </Card>

        <Card title="Resume des dernieres evaluations corrigees" className="table-card">
          <table>
            <thead><tr><th>Classe</th><th>Evaluation</th><th>Date</th><th>Eleves</th><th>Moyenne</th><th>Taux de reussite</th></tr></thead>
            <tbody>{evaluations.filter((item) => item.status === 'Corrige').slice(0, 4).map((item) => <tr key={`${item.date}-${item.className}`}><td>{item.className}</td><td>{item.type} - {item.topic.replace('Chapitre ', 'Chap. ')}</td><td>{item.date}</td><td>{item.students}</td><td>{item.average}</td><td><MiniBar value={Number(item.average.replace('%', '')) || 0} tone={Number(item.average.replace('%', '')) > 70 ? 'Conforme' : 'En retard'} /></td></tr>)}</tbody>
          </table>
          <button className="secondary-button evaluation-more" type="button">Voir le detail des resultats <Icon name="arrow" /></button>
        </Card>

        <Card title="Statistiques globales (ce trimestre)">
          <Donut value={73} center="73%" label="Moyenne generale" />
          <Legend rows={[['Tres bien (> 80%)', 35, 'green'], ['Bien (60% - 79%)', 38, 'blue'], ['Passable (40% - 59%)', 20, 'orange'], ['Insuffisant (< 40%)', 7, 'red']]} />
          <div className="total-row"><span>Total evaluations</span><strong>{evaluations.length}</strong></div>
        </Card>

        <Card title="Actions rapides">
          <div className="teacher-evaluation-actions">
            {[
              ['clipboard', 'Saisir les resultats', "Ajouter les notes d'une evaluation"],
              ['print', 'Imprimer une evaluation', 'Imprimer sujet et correction'],
              ['down', 'Telecharger les copies', 'Telecharger toutes les copies'],
              ['excel', 'Exporter les resultats', 'Export en Excel ou PDF'],
            ].map(([icon, title, detail]) => <button type="button" className="secondary-button" key={title}><Icon name={icon} /><span><strong>{title}</strong><small>{detail}</small></span><Icon name="chevron" /></button>)}
          </div>
        </Card>
      </section>
    </>
  )
}
