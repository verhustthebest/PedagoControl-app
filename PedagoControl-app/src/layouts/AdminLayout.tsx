import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { AdminNavigation } from '../components/adminGestionnaire/AdminNavigation'
import './admin-layout.css'
import '../components/adminParental/admin-resources.css'
import { apiRequest } from '../services/api'

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [schoolName, setSchoolName] = useState('Donnée indisponible')
  const [notificationCount, setNotificationCount] = useState<number | null>(null)
  const { user, logout } = useAuth()
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Administrateur Gestion'
  useEffect(() => {
    let active = true
    void Promise.allSettled([
      apiRequest<{ schools?: { name: string }[] }>('/schools?page=1&limit=1'),
      apiRequest<{ count?: number }>('/notifications/unread-count'),
    ]).then(([school, notifications]) => {
      if (!active) return
      if (school.status === 'fulfilled' && school.value.schools?.[0]?.name) setSchoolName(school.value.schools[0].name)
      if (notifications.status === 'fulfilled' && typeof notifications.value.count === 'number') setNotificationCount(notifications.value.count)
    })
    return () => { active = false }
  }, [])
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
        <div className="admin-top-actions"><button aria-label={notificationCount === null ? 'Notifications' : `${notificationCount} notifications non lues`}>♢{notificationCount !== null && <sup>{notificationCount}</sup>}</button><div className="admin-avatar">{user?.first_name?.[0] ?? 'A'}</div><span><strong>{fullName}</strong><small>Administrateur Gestion</small></span></div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  </div>
}
