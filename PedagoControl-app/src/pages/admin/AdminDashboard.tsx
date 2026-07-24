import { AdminPageState } from './AdminPageState'
import { useSchoolDashboard } from './useSchoolDashboard'

const subscriptionPeriod: Record<string, string> = {
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  annual: 'Annuel',
}

const statusLabel = (status: string | undefined) => {
  if (!status) return 'Aucun'
  if (status.toLowerCase() === 'active') return 'Actif'
  if (status.toLowerCase() === 'inactive') return 'Inactif'
  if (status.toLowerCase() === 'suspended') return 'Suspendu'
  return status
}

export function AdminDashboardPage() {
  const state = useSchoolDashboard()
  const dashboard = state.data
  const cards = dashboard ? [
    { icon: '⌂', label: 'École connectée', value: dashboard.school.name, detail: 'Établissement de la session' },
    { icon: '▣', label: 'Année scolaire', value: dashboard.academic_year?.name || 'Aucune année active', detail: dashboard.academic_year ? 'Période active' : 'À configurer' },
    { icon: '♙', label: 'Utilisateurs', value: dashboard.counts.users, detail: 'Comptes actifs' },
    { icon: '♧', label: 'Élèves', value: dashboard.counts.students, detail: 'Élèves actifs' },
    { icon: '♟', label: 'Enseignants', value: dashboard.counts.teachers, detail: dashboard.subscription ? `${dashboard.counts.teachers} sur ${dashboard.subscription.teacher_limit}` : 'Aucun quota actif' },
    { icon: '◇', label: 'Abonnement principal', value: dashboard.subscription?.plan.name || 'Aucun abonnement', detail: dashboard.subscription ? `${subscriptionPeriod[dashboard.subscription.billing_period] || dashboard.subscription.billing_period} · quota ${dashboard.subscription.teacher_limit}` : 'Aucun plan actif' },
  ] : []

  return <AdminPageState status={state.status} message={state.message} retry={state.reload}>
    {dashboard && <>
      <header className="admin-page-head"><div className="admin-page-icon">⌂</div><div><h1>Tableau de bord</h1><p>Vue d’ensemble de votre établissement scolaire.</p></div></header>
      <section className="admin-dashboard-kpis" aria-label="Indicateurs de l'établissement">
        {cards.map(card => <article className="admin-card admin-dashboard-kpi" key={card.label}>
          <div className="admin-kpi-icon" aria-hidden="true">{card.icon}</div>
          <div><span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small></div>
        </article>)}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-card admin-dashboard-panel">
          <div className="admin-panel-title"><div><h2>Activités récentes</h2><p>Dernières actions enregistrées dans votre école</p></div></div>
          {!dashboard.activities.length
            ? <div className="admin-empty">Aucune activité récente.</div>
            : <ul className="admin-activity-list">{dashboard.activities.map((activity, index) =>
              <li key={`${activity.occurred_at}-${activity.type}-${index}`}>
                <span className="admin-activity-icon" aria-hidden="true">●</span>
                <div><strong>{activity.title}</strong><small>{activity.actor.name} · {activity.module}</small></div>
                <time dateTime={activity.occurred_at}>{new Date(activity.occurred_at).toLocaleString('fr-FR')}</time>
              </li>)}</ul>}
        </article>

        <article className="admin-card admin-dashboard-panel">
          <div className="admin-panel-title"><div><h2>État de l’établissement</h2><p>Configuration active</p></div></div>
          <dl className="admin-dashboard-details">
            <div><dt>Code école</dt><dd>{dashboard.school.code}</dd></div>
            <div><dt>Statut école</dt><dd><span className={`admin-status ${dashboard.school.status === 'active' ? '' : 'off'}`}>{statusLabel(dashboard.school.status)}</span></dd></div>
            <div><dt>Plan</dt><dd>{dashboard.subscription?.plan.name || 'Aucun plan'}</dd></div>
            <div><dt>Quota enseignants</dt><dd>{dashboard.subscription?.teacher_limit ?? 0}</dd></div>
            <div><dt>Contrôle pédagogique</dt><dd><span className="admin-status">Activé</span></dd></div>
            <div><dt>Suivi parental</dt><dd><span className={`admin-status ${dashboard.modules.parental_tracking ? '' : 'off'}`}>{dashboard.modules.parental_tracking ? 'Activé' : 'Inactif'}</span></dd></div>
          </dl>
        </article>
      </section>
    </>}
  </AdminPageState>
}
