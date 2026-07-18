import { NavLink } from 'react-router-dom'

const groups = [
  { label: 'Tableau de bord', items: [['⌂', 'Tableau de bord', '/admin']] },
  { label: 'Gestion académique', items: [['▦', 'Classes', '#'], ['♙', 'Enseignants', '#'], ['▤', 'Matières', '#'], ['◫', 'Emplois du temps', '#'], ['✓', 'Évaluations', '#'], ['↗', 'Résultats', '#']] },
  { label: 'Suivi parental', items: [['♙', 'Tableau de bord', '/admin/suivi-parental'], ['◎', 'Élèves', '/admin/eleves'], ['♧', 'Parents & Tuteurs', '/admin/parents'], ['⇄', 'Demandes de liaison', '/admin/rattachements/demandes'], ['▣', 'Comptes parents', '#'], ['▤', 'Journal numérique', '#'], ['✓', 'Visas parentaux', '#'], ['♢', 'Notifications', '#']] },
  { label: 'Paramètres', items: [['♙', 'Utilisateurs', '#'], ['⚙', 'Configuration du module', '/admin/suivi-parental/configuration']] },
] as const

export function AdminNavigation({ close }: { close?: () => void }) {
  return <nav className="admin-nav" aria-label="Navigation Admin gestionnaire">
    {groups.map(group => <section key={group.label}>
      <p>{group.label}</p>
      {group.items.map(([icon, label, to]) => to === '#'
        ? <span className="admin-nav-disabled" key={label}><b>{icon}</b>{label}<small>À venir</small></span>
        : <NavLink key={to} to={to} end={to === '/admin'} onClick={close}><b>{icon}</b>{label}</NavLink>)}
    </section>)}
  </nav>
}
