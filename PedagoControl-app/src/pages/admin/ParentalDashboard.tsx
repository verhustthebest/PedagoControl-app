import { Link } from 'react-router-dom'
import { AdminPageState, value } from './AdminPageState'
import { useAdminPortal } from './useAdminPortal'

export function ParentalDashboardPage() {
  const state = useAdminPortal()
  const active = Boolean(state.data?.settings?.is_enabled)
  return <AdminPageState status={state.status} message={state.message} retry={state.reload}>
    <header className="admin-page-head"><div className="admin-page-icon">♙</div><div><h1>Tableau de bord – Suivi parental</h1><p>Vue d’ensemble des activités, accès et interactions des parents.</p></div><div className="admin-actions"><button className="admin-button secondary">＋ Ajouter un élève</button><button className="admin-button green">♙ Inscrire un parent</button><button className="admin-button purple">♙ Créer un compte Informaticien</button></div></header>
    <section className="admin-kpis">
      <article className="admin-card admin-kpi"><span>État du module</span><strong><i className={`admin-status ${active ? '' : 'off'}`}>{state.data?.settings ? active ? 'Activé' : 'Inactif' : 'Indisponible'}</i></strong><small>Configuration de l’école</small></article>
      <article className="admin-card admin-kpi"><span>Élèves suivis</span><strong>{value(state.data?.trackedStudents)}</strong><small>sur {value(state.data?.students)} élèves</small></article>
      <article className="admin-card admin-kpi"><span>Parents / tuteurs</span><strong>{value(state.data?.guardians)}</strong><small>Enregistrés dans l’école</small></article>
      <article className="admin-card admin-kpi"><span>Notifications non lues</span><strong>{value(state.data?.unreadNotifications)}</strong><small>Centre de notifications</small></article>
      <article className="admin-card admin-kpi"><span>Rattachements</span><strong>Donnée indisponible</strong><small>Aucun agrégat API disponible</small></article>
      <article className="admin-card admin-kpi"><span>Visas parentaux</span><strong>Donnée indisponible</strong><small>Aucun agrégat API disponible</small></article>
      <article className="admin-card admin-kpi"><span>Prochaine facturation</span><strong>{value(state.data?.subscription?.next_invoice_date ? new Date(state.data.subscription.next_invoice_date).toLocaleDateString('fr-FR') : null)}</strong><small>Facture adressée à l’école</small></article>
    </section>
    <section className="admin-grid"><article className="admin-card admin-panel"><h2>Activité du jour</h2><div className="admin-empty">Aucune activité quotidienne disponible.</div></article><article className="admin-card admin-panel"><h2>Configuration du module</h2><ul className="admin-list"><li><span>Suivi parental</span><b className={`admin-status ${active ? '' : 'off'}`}>{active ? 'Activé' : 'Inactif'}</b></li><li><span>Élèves suivis</span><b>{value(state.data?.trackedStudents)}</b></li><li><span>Prix par élève</span><b>{state.data?.subscription?.unit_price_per_student ? `${state.data.subscription.unit_price_per_student} ${state.data.subscription.currency || 'USD'}` : 'Donnée indisponible'}</b></li></ul><Link className="admin-button secondary" to="/admin/suivi-parental/configuration">Voir la configuration</Link></article></section>
  </AdminPageState>
}
