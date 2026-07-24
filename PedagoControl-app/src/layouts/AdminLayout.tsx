import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { AdminNavigation } from '../components/adminGestionnaire/AdminNavigation'
import './admin-layout.css'
import '../components/adminParental/admin-resources.css'

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  // L'école provient de /auth/me : l'Admin ne doit jamais appeler la liste globale Management.
  const schoolName = user?.school?.name || 'Donnée indisponible'
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Administrateur Gestion'
  return <div className="admin-shell">
    <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
      <div className="admin-brand"><img src="/favicon.svg" alt="" /><div><strong>PEDAGO CONTROL</strong><span>Portail École</span></div></div>
      <div className="admin-profile"><span>{user?.first_name?.[0]}{user?.last_name?.[0]}</span><div><strong>{fullName}</strong><small>Administrateur Gestion</small><em>● En ligne</em></div></div>
      <AdminNavigation close={() => setOpen(false)} />
      <button className="admin-logout" onClick={() => void logout()}>⇥ Déconnexion sécurisée</button>
    </aside>
    {open && <button className="admin-overlay" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}
    <div className="admin-workspace">
      <header className="admin-topbar">
        <button className="admin-menu-button" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}>☰</button>
        <div><small>École connectée</small><strong>{schoolName}</strong></div>
        <div className="admin-top-actions"><button aria-label="Notifications">♢</button><div className="admin-avatar">{user?.first_name?.[0] ?? 'A'}</div><span><strong>{fullName}</strong><small>Administrateur Gestion</small></span></div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  </div>
}
