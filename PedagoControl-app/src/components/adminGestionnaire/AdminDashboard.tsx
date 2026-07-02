import { AlertCard, BarChart, ClassroomMini, DelayTable, KpiGrid, ProgressRows, PromoBand, RightStack } from '../portalComponents'
import { Card, Donut, Legend, LinkRow } from '../common'

export function AdminDashboard() {
  return (
    <>
      <KpiGrid items={[
        { icon: 'book', value: '120', label: 'Programmes créés', tone: 'blue' },
        { icon: 'checkCircle', value: '97', label: "En cours d'exécution", tone: 'green' },
        { icon: 'shield', value: '15', label: 'Terminés', tone: 'purple' },
        { icon: 'clock', value: '8', label: 'En retard', tone: 'orange' },
        { icon: 'alert', value: '5', label: 'Alertes critiques', tone: 'red' },
        { icon: 'chart', value: '67%', label: "Taux global d'exécution", tone: 'blue' },
      ]} />
      <section className="dashboard-grid">
        <Card title="Vue d’ensemble de l'exécution" className="wide-card"><Donut value={67} /><Legend rows={[['En avance', 25, 'green'], ['Conforme', 42, 'blue'], ['En retard', 22, 'orange'], ['Critique', 11, 'red']]} /><ClassroomMini /></Card>
        <Card title="Avancement par section"><ProgressRows rows={[['Humanités', 78], ['Scientifique', 65], ['Commerciale', 72], ['Pédagogie Générale', 81]]} /><LinkRow to="/directeur/suivi-avancement">Voir le détail par section</LinkRow></Card>
        <Card title="Situation des enseignants"><Donut value={69} center="32" label="Total" /><Legend rows={[['En avance', 38, 'green'], ['Conformes', 31, 'blue'], ['En retard', 22, 'orange'], ['Critiques', 9, 'red']]} /><LinkRow to="/directeur/enseignants">Voir tous les enseignants</LinkRow></Card>
        <AlertCard />
        <Card title="Top 5 enseignants en retard" className="table-card span-2"><DelayTable /></Card>
        <Card title="Avancement par classe (taux moyen)" className="span-2"><BarChart /></Card>
        <RightStack />
      </section>
      <PromoBand />
    </>
  )
}
