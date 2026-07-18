import { AdminPageState, value } from './AdminPageState'
import { useAdminPortal } from './useAdminPortal'

export function AdminDashboardPage() {
  const state = useAdminPortal()
  return <AdminPageState status={state.status} message={state.message} retry={state.reload}>
    <header className="admin-page-head"><div className="admin-page-icon">⌂</div><div><h1>Tableau de bord</h1><p>Vue d’ensemble de votre établissement scolaire.</p></div></header>
    <section className="admin-kpis" aria-label="Indicateurs de l'établissement">
      {[['École connectée', state.data?.school?.name], ['Année scolaire', null], ['Utilisateurs', null], ['Élèves', state.data?.students], ['Enseignants', null], ['Abonnement principal', state.data?.school?.status]].map(([label, number]) => <article className="admin-card admin-kpi" key={label}><span>{label}</span><strong>{value(number)}</strong><small>Information issue des services disponibles</small></article>)}
    </section>
    <section className="admin-grid"><article className="admin-card admin-panel"><h2>Activités récentes</h2><div className="admin-empty">Aucune activité récente disponible depuis l’API actuelle.</div></article><article className="admin-card admin-panel"><h2>État de l’établissement</h2><ul className="admin-list"><li><span>École</span><b>{value(state.data?.school?.name)}</b></li><li><span>Code</span><b>{value(state.data?.school?.code)}</b></li><li><span>Statut</span><b>{value(state.data?.school?.status)}</b></li></ul></article></section>
  </AdminPageState>
}
