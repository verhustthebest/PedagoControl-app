import { useEffect, useState } from 'react'
import { useRef } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import brandLogo from '../assets/pedago-brand.png'
import startupMockup from '../assets/page-de-demarrage.png'
import presentationPanel from '../assets/presentation-panel.png'
import { managementProgramDraft } from '../data/managementPrograms'
import { authApi, getMemorySession } from '../services/api'
import { prepareManagementProgram, sendProgramToAdminGestionnaire } from '../services/managementProgramService'
import { messagesApi, notificationsApi } from '../services/notifications'
import type { AppNotification } from '../services/notifications'
import { NotificationDeliveryBadge } from './common/NotificationDeliveryBadge'
import { reportsApi } from '../services/reports'
import type { PrefectDecision, UiLessonReport } from '../services/reports'
import '../App.css'
import {
  Avatar,
  Badge,
  Card,
  Donut,
  FilterBox,
  Filters,
  Footer,
  Icon,
  LanguageSelector,
  Legend,
  LinkRow,
  MiniBar,
  MiniList,
  SecurityNotice,
  SubjectIcon,
  TeacherStats,
} from './common'
import {
  PrefectActionStrip,
  PrefectAlertList,
  PrefectAlertTable,
  PrefectAutoControl,
  PrefectDelayCards,
  PrefectLessonTable,
  PrefectMessageFeed,
  PrefectObservationList,
  PrefectTeacherTable,
} from './prefet'
import {
  ActivityTimeline,
  HowItWorks,
  PlanningTable,
  ProgramAccordion,
  ProgramSummary,
  ProgressHistoryTable,
  TeacherClassCard,
  TeacherFooter,
  TeacherProgramRows,
  TeacherProgressForm,
  TeacherRecentTextBook,
  WeekGrid,
} from './enseignant'

import type { ProgramChapter } from '../types/program'
import {
  demoAccounts,
  navItems,
  managementNavItems,
  clientSchools,
  subjects,
  alerts,
  evaluations,
  reports,
  teacherNavItems,
  prefectNavItems,
  prefectLessonSubmissions,
  initialProgressHistory,
  textBookRows,
  programClasses,
  programSubjects,
  programTeachers,
  chapterSamples,
  subChapterSamples,
  repartitionRows,
  annualPlanRows,
  schoolCalendarRows
} from '../data/mockPedagoData'

function AccessibilityEnhancer() {
  useEffect(() => {
    function textFromElement(element: Element | null) {
      return element?.textContent?.replace(/\s+/g, ' ').trim() || ''
    }

    function inferControlName(element: HTMLElement, fallback: string) {
      const explicit = element.getAttribute('aria-label') || element.getAttribute('title')
      if (explicit) return explicit

      const label = element.closest('label')
      const labelText = textFromElement(label)
      if (labelText) return labelText

      const labelledBy = element.getAttribute('aria-labelledby')
      const labelledByText = labelledBy ? textFromElement(document.getElementById(labelledBy)) : ''
      if (labelledByText) return labelledByText

      const placeholder = element.getAttribute('placeholder')
      if (placeholder) return placeholder

      const buttonText = textFromElement(element)
      return buttonText || fallback
    }

    function applyAccessibility() {
      document.querySelectorAll<HTMLButtonElement>('button').forEach((button, index) => {
        const name = inferControlName(button, `Action ${index + 1}`)
        if (!button.getAttribute('aria-label') && !textFromElement(button)) button.setAttribute('aria-label', name)
        if (!button.getAttribute('title')) button.setAttribute('title', name)
        if (!button.hasAttribute('type')) button.setAttribute('type', 'button')
      })

      document.querySelectorAll<HTMLElement>('input, textarea').forEach((field, index) => {
        const name = inferControlName(field, `Champ ${index + 1}`)
        if (!field.getAttribute('aria-label')) field.setAttribute('aria-label', name)
      })

      document.querySelectorAll<HTMLElement>('select').forEach((select, index) => {
        const name = inferControlName(select, `Liste de selection ${index + 1}`)
        if (!select.getAttribute('aria-label')) select.setAttribute('aria-label', name)
      })
    }

    applyAccessibility()
    const observer = new MutationObserver(applyAccessibility)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}

function AuthShell({ children, footerVariant = 'default' }: { children: ReactNode; footerVariant?: 'default' | 'login' }) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="CONTRÔLE PÉDAGOGIQUE">
        <aside className="presentation-visual">
          <img src={presentationPanel} alt="Présentation CONTRÔLE PÉDAGOGIQUE" />
        </aside>
        <section className="auth-panel">{children}</section>
      </section>
      <Footer variant={footerVariant} />
    </main>
  )
}

function PresentationScreen() {
  return (
    <main className="startup-page" aria-label="Présentation CONTRÔLE PÉDAGOGIQUE">
      <section className="startup-frame">
        <img src={startupMockup} alt="CONTRÔLE PÉDAGOGIQUE - Contrôlez l’exécution réelle des programmes scolaires" />
        <Link className="startup-login-hotspot" to="/login">
          <span>Se connecter</span>
        </Link>
      </section>
    </main>
  )
}

function localDateInputValue() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function localDisplayDate() {
  return new Intl.DateTimeFormat('fr-FR').format(new Date())
}

function getStoredUserRole() {
  const fallback = { name: 'Utilisateur', role: 'Utilisateur' }
  const user = getMemorySession().user
  try {
    if (user) {
      const role = user.roles?.[0] || ''
      const label = role === 'SUPER_ADMIN' ? 'Admin / Management'
        : role === 'ADMIN_GESTIONNAIRE' ? 'Promoteur'
          : role === 'PREFET' ? 'Préfet / Directeur des Études'
            : role === 'ENSEIGNANT' ? 'Enseignant'
              : 'Utilisateur'
      return { name: [user.first_name, user.last_name].filter(Boolean).join(' ') || label, role: label }
    }

  } catch {
    return fallback
  }

  return fallback
}

function formatNotificationDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

function HeaderFeedDropdown({ icon, title, initialCount, items }: { icon: string; title: string; initialCount: number; items: Array<[string, string, string, string]> }) {
  const [unread, setUnread] = useState(initialCount)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [apiFailed, setApiFailed] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const usesNotificationApi = title === 'Notifications'
  const usesMessagesApi = title === 'Messages'

  async function loadNotifications() {
    if (!usesNotificationApi && !usesMessagesApi) return

    try {
      const [list, count] = usesMessagesApi
        ? await messagesApi.list().then((messages) => [messages, messages.filter((message) => !message.is_read).length] as const)
        : await Promise.all([
            notificationsApi.list(),
            notificationsApi.unreadCount(),
          ])
      setNotifications(list)
      setUnread(count)
      setApiFailed(false)
    } catch {
      setNotifications([])
      setUnread(initialCount)
      setApiFailed(true)
    }
  }

  useEffect(() => {
    void loadNotifications()
    if (!usesNotificationApi && !usesMessagesApi) return undefined

    const timer = window.setInterval(() => {
      void loadNotifications()
    }, 20000)

    return () => window.clearInterval(timer)
  }, [usesNotificationApi, usesMessagesApi])

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) detailsRef.current.open = false
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  async function markRead(notification: AppNotification) {
    if ((!usesNotificationApi && !usesMessagesApi) || notification.is_read) return

    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item))
    setUnread((current) => Math.max(0, current - 1))

    try {
      await (usesMessagesApi ? messagesApi.markRead(notification.id) : notificationsApi.markRead(notification.id))
      await loadNotifications()
    } catch {
      // Keep optimistic UI for demo stability.
    }
  }

  async function markAllRead() {
    if (!usesNotificationApi && !usesMessagesApi) {
      setUnread(0)
      return
    }

    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    setUnread(0)

    try {
      if (usesMessagesApi) {
        await Promise.all(notifications.filter((item) => !item.is_read).map((item) => messagesApi.markRead(item.id)))
      } else {
        await notificationsApi.markAllRead()
      }
      await loadNotifications()
    } catch {
      // Keep optimistic UI for demo stability.
    }
  }

  return (
    <details ref={detailsRef} className="header-feed-dropdown" onToggle={(event) => { if (event.currentTarget.open && !usesNotificationApi && !usesMessagesApi) setUnread(0) }}>
      <summary className="notification" aria-label={title}>
        <Icon name={icon} />
        {unread > 0 && <span>{unread}</span>}
      </summary>
      <div className="management-dropdown feed-dropdown">
        <header><strong>{title}</strong><small>{unread} non lus</small></header>
        {(usesNotificationApi || usesMessagesApi) && notifications.length > 0 ? notifications.map((notification) => (
          <article key={notification.id} className={notification.is_read ? 'read' : 'unread'} onClick={() => void markRead(notification)}>
            <span><Icon name={notification.is_read ? 'checkCircle' : 'bell'} /></span>
            <p><strong>{notification.title}</strong><small>{notification.message}</small><NotificationDeliveryBadge status={notification.delivery_status}/><em>{notification.is_read ? 'Lu' : 'Non lu'}</em></p>
            <time>{formatNotificationDate(notification.created_at)}</time>
          </article>
        )) : apiFailed ? items.map(([itemIcon, itemTitle, preview, time]) => (
          <article key={`${title}-${itemTitle}`}>
            <span><Icon name={itemIcon} /></span>
            <p><strong>{itemTitle}</strong><small>{preview}</small><em>{unread ? 'Non lu' : 'Lu'}</em></p>
            <time>{time}</time>
          </article>
        )) : <article><span><Icon name="info" /></span><p><strong>Aucun élément</strong><small>Aucune donnée récente.</small><em>Lu</em></p><time>-</time></article>}
        <button className="dropdown-view-all" type="button" onClick={() => void markAllRead()}>Tout marquer comme lu <Icon name="checkCircle" /></button>
      </div>
    </details>
  )
}

function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = getStoredUserRole()
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) detailsRef.current.open = false
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function logout() {
    void authApi.logout()
  }

  return (
    <details ref={detailsRef} className={`user-menu${compact ? ' teacher-mini' : ''}`}>
      <summary className={`mini-profile${compact ? ' teacher-mini' : ''}`}>
        <Avatar name={user.name} />
        <div><strong>{user.role}</strong><small><i /> En ligne</small></div>
        <Icon name="chevron" />
      </summary>
      <div className="management-dropdown profile-dropdown">
        <button type="button"><Icon name="user" /> Mon profil</button>
        <button type="button" className="danger" onClick={logout}><Icon name="login" /> Déconnexion</button>
      </div>
    </details>
  )
}

const headerNotifications: Array<[string, string, string, string]> = [
  ['file', 'Rapport quotidien soumis', 'Un rapport attend validation.', 'Maintenant'],
  ['checkCircle', 'Décision enregistrée', 'Statut pédagogique mis à jour.', 'Aujourd’hui'],
  ['alert', 'Correction demandée', 'Observation disponible.', 'Hier'],
]

const headerMessages: Array<[string, string, string, string]> = [
  ['message', 'Préfecture', 'Merci de vérifier les derniers rapports.', '10:35'],
  ['users', 'Direction', 'Point pédagogique disponible.', 'Hier'],
  ['file', 'Système', 'Synthèse prête pour supervision.', 'Lun.'],
]

function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function redirectForRoles(roles: string[]) {
    if (roles.includes('SUPER_ADMIN')) return '/management/ecoles'
    if (roles.includes('ADMIN_GESTIONNAIRE')) return '/admin'
    if (roles.includes('INFORMATICIEN')) return '/informaticien'
    if (roles.includes('PARENT')) return '/parent'
    if (roles.includes('PREFET')) return '/prefet/rapports'
    if (roles.includes('ENSEIGNANT')) return '/enseignant/cahier-texte'
    if (roles.some((role) => ['DIRECTEUR', 'DIRECTION', 'PROMOTEUR', 'DIRECTEUR_ETUDES', 'DIRECTEUR_DES_ETUDES'].includes(role))) return '/directeur/rapports'
    return '/acces-interdit'
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void remember
    setError('')
    setLoading(true)

    try {
      const session = await authApi.login(username.trim().toLowerCase(), password)
      window.location.replace(redirectForRoles(session.roles || session.user.roles))
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Connexion échouée.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell footerVariant="login">
      <LanguageSelector />
      <section className="brand-block">
        <img src={brandLogo} alt="CONTRÔLE PÉDAGOGIQUE - Plateforme intelligente" />
        <div className="promise-row" aria-label="Promesse de la plateforme">
          <span className="promise promise-blue"><Icon name="eye" /> Contrôlez.</span>
          <span className="promise promise-gold"><Icon name="trend" /> Suivez.</span>
          <span className="promise promise-red"><Icon name="target" /> Réussissez.</span>
        </div>
        <p className="tagline">Plateforme intelligente de suivi de l’exécution<br />des programmes scolaires</p>
      </section>

      <form className="login-box login-form" onSubmit={handleSubmit}>
        <h1><Icon name="user" /> Connexion à votre compte</h1>
        <label>
          <span>Nom d'utilisateur</span>
          <div className="field"><Icon name="person" /><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Entrez votre nom d'utilisateur" autoComplete="username" disabled={loading} /></div>
        </label>
        <label>
          <span>Mot de passe</span>
          <div className="field password-field"><Icon name="lock" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Entrez votre mot de passe" autoComplete="current-password" disabled={loading} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword((current) => !current)} disabled={loading}><Icon name="eyeSoft" /></button></div>
        </label>
        {error && <p className="login-error">{error}</p>}
        <div className="form-row">
          <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} disabled={loading} /><span>Se souvenir de moi</span></label>
          <button type="button" className="link-button">Mot de passe oublié ?</button>
        </div>
        <button className="primary-action" type="submit" disabled={loading}><Icon name="login" /> {loading ? 'Connexion...' : 'Se connecter'}</button>
        <div className="demo-credentials" aria-label="Identifiants de démonstration">
          <strong>Accès démo</strong>
          {demoAccounts.map((account) => (
            <button type="button" key={account.username} onClick={() => { setUsername(account.username); setPassword(account.password); setError('') }}>
              <span>{account.role}</span>
              <code>{account.username}</code>
              <em>{account.password}</em>
            </button>
          ))}
        </div>
      </form>
      <SecurityNotice emphasizePrivacy />
    </AuthShell>
  )
}

function DemoAccess() {
  return (
    <AuthShell footerVariant="login">
      <LanguageSelector />
      <section className="brand-block demo-state">
        <img src={brandLogo} alt="CONTRÔLE PÉDAGOGIQUE - Plateforme intelligente" />
        <div className="login-box demo-box">
          <Link className="primary-action" to="/directeur">Commencer</Link>
        </div>
      </section>
    </AuthShell>
  )
}

function ManagementLayout({ title, crumb, children }: { title: string; crumb?: string; children: ReactNode }) {
  function logoutToLogin() {
    void authApi.logout()
  }

  return (
    <main className="management-shell">
      <aside className="management-sidebar">
        <Link className="management-brand" to="/management/ecoles">
          <span className="brand-shield"><Icon name="book" /></span>
          <strong>CONTRÔLE</strong>
          <b>PÉDAGOGIQUE</b>
        </Link>
        <span className="management-menu-label">Compte Management</span>
        <nav className="management-nav">
          {managementNavItems.map((item) => (
            <NavLink key={item.label} to={item.to} end={item.to === '/management/ecoles'} className={({ isActive }) => `management-nav-link${isActive ? ' active' : ''}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <b>{item.badge}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="management-secure"><Icon name="shield" /><strong>Compte securise</strong><span>Derniere connexion<br />24/05/2025 a 10:30</span><em>En ligne</em></div>
        <button className="management-logout" type="button" onClick={logoutToLogin}><Icon name="login" /> Deconnexion</button>
      </aside>
      <section className="management-main">
        <header className="management-topbar">
          <button className="hamburger" type="button" aria-label="Menu"><Icon name="menu" /></button>
          <div><h1>{title}</h1>{crumb && <p>{crumb}</p>}</div>
          <div className="management-tools">
            <HeaderFeedDropdown icon="bell" title="Notifications" initialCount={5} items={headerNotifications} />
            <HeaderFeedDropdown icon="message" title="Messages" initialCount={3} items={headerMessages} />
            <UserMenu />
          </div>
        </header>
        <div className="management-content">{children}</div>
      </section>
    </main>
  )
}

function ClientSchools() {
  return (
    <section className="client-schools-page">
      <div className="schools-hero">
        <div>
          <h2>Ecoles clientes</h2>
          <p>Gerez les ecoles abonnees a CONTRÔLE PÉDAGOGIQUE</p>
        </div>
        <Link className="blue-button" to="/management/ecoles/nouvelle"><Icon name="plus" /> Nouvelle ecole</Link>
      </div>
      <div className="management-kpis">
        <ManagementKpi icon="home" value="48" label="Total ecoles" detail="Toutes les ecoles" tone="blue" />
        <ManagementKpi icon="calendar" value="32" label="Ecoles actives" detail="66,7% du total" tone="green" />
        <ManagementKpi icon="clock" value="7" label="Bientot expirees" detail="14,6% du total" tone="blue" />
        <ManagementKpi icon="alert" value="6" label="En retard" detail="12,5% du total" tone="orange" />
        <ManagementKpi icon="shield" value="3" label="Suspendues" detail="6,2% du total" tone="red" />
      </div>
      <section className="management-card schools-panel">
        <div className="schools-toolbar">
          <div>
            <h2>Ecoles clientes enregistrees</h2>
            <p>Suivi des etablissements, abonnements et comptes ecoles crees.</p>
          </div>
          <button className="secondary-button" type="button"><Icon name="down" /> Exporter</button>
        </div>
        <div className="schools-filters">
          <label className="schools-search"><span>Recherche</span><input placeholder="Rechercher une ecole, un responsable, une commune..." /></label>
          <button className="secondary-button reset-filters" type="button"><Icon name="down" /> Reinitialiser les filtres</button>
          <label><span>Statut</span><select><option>Tous les statuts</option><option>Actif</option><option>Bientot expire</option><option>En retard</option><option>Suspendu</option><option>Brouillon</option></select></label>
          <label><span>Categorie</span><select><option>Toutes les categories</option><option>Petite ecole</option><option>Ecole moyenne</option><option>Ecole grande</option></select></label>
          <label><span>Echeance</span><select><option>Toutes les echeances</option><option>7 prochains jours</option><option>30 prochains jours</option><option>Expiree</option></select></label>
          <label><span>Province</span><select><option>Toutes les provinces</option><option>Kinshasa</option><option>Haut-Katanga</option></select></label>
          <label><span>Ville</span><select><option>Toutes les villes</option><option>Kinshasa</option><option>Lubumbashi</option><option>Goma</option></select></label>
          <label><span>Commune</span><select><option>Toutes les communes</option><option>Limete</option><option>Ngaliema</option><option>Gombe</option></select></label>
        </div>
        <div className="schools-table-wrap">
          <table className="schools-table">
            <thead><tr><th>Code ecole</th><th>Nom ecole</th><th>Responsable</th><th>Telephone</th><th>Commune</th><th>Categorie</th><th>Enseignants autorises</th><th>Periode abonnement</th><th>Date fin abonnement</th><th>Solde</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>{clientSchools.map((school) => <ClientSchoolRow key={school.code} school={school} />)}</tbody>
          </table>
        </div>
        <div className="schools-pagination">
          <span>Affichage 1 a 8 sur 48 ecoles</span>
          <div><button type="button">‹</button><button type="button" className="active">1</button><button type="button">2</button><button type="button">3</button><button type="button">4</button><button type="button">5</button><button type="button">...</button><button type="button">6</button><button type="button">›</button></div>
          <label>Elements par page<select><option>10</option><option>20</option><option>50</option></select></label>
        </div>
      </section>
    </section>
  )
}

function ManagementKpi({ icon, value, label, detail, tone }: { icon: string; value: string | number; label: string; detail: string; tone: string }) {
  return <article className={`management-kpi ${tone}`}><span><Icon name={icon} /></span><div><strong>{value}</strong><em>{label}</em><small>{detail}</small></div></article>
}

function ClientSchoolRow({ school }: { school: typeof clientSchools[number] }) {
  return (
    <tr>
      <td><strong>{school.code}</strong></td>
      <td><strong>{school.name}</strong><span>{school.city}, {school.province}</span></td>
      <td><strong>{school.responsible}</strong></td>
      <td>{school.phone}</td>
      <td>{school.commune}</td>
      <td><span className={`school-category ${school.category.toLowerCase().replace(/\s+/g, '-')}`}>{school.category}</span></td>
      <td>{school.teachersAllowed}</td>
      <td>{school.period}</td>
      <td>{school.endDate}</td>
      <td><strong className={school.balance === '0,00 $' || school.balance === '0 $' ? 'balance-ok' : 'balance-due'}>{school.balance}</strong></td>
      <td><span className={`school-status ${school.status.toLowerCase().replace(/\s+/g, '-')}`}>{school.status}</span></td>
      <td><SchoolActions /></td>
    </tr>
  )
}

function SchoolActions() {
  const actions = ['Voir detail', 'Modifier', 'Gerer abonnement', 'Ajouter quota enseignants', 'Envoyer rappel', 'Suspendre', 'Reactiver', 'Historique paiements']
  const [open, setOpen] = useState(false)

  return (
    <div className="school-actions" onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
      <button className="icon-button" type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((current) => !current)}><Icon name="more" /></button>
      {open && <div className="school-actions-menu">{actions.map((action) => <button type="button" key={action}>{action}</button>)}</div>}
    </div>
  )
}

function NewSchoolFlow() {
  return (
    <section className="new-school-page">
      <ManagementWizardSteps />
      <section className="new-school-layout">
        <div className="management-card new-school-form">
          <h2>Etape 1/5 - Informations de l'ecole</h2>
          <p>Renseignez les informations generales de l'ecole cliente.</p>
          <div className="new-school-grid">
            <label>Nom de l'ecole *<input placeholder="Ex : Complexe Scolaire La Reussite" /></label>
            <label>Code ecole<input value="PED-2026-0001" readOnly /></label>
            <label>Type d'ecole *<select><option>Selectionner le type d'ecole</option></select></label>
            <label>Telephone principal *<input defaultValue="+243 81 234 5678" /></label>
            <label>Email officiel de l'ecole *<input placeholder="contact@ecole.cd" /></label>
            <label>Adresse complete<input placeholder="Avenue, numero, quartier, ville..." /></label>
            <label>Province *<select><option>Selectionner la province</option></select></label>
            <label>Ville *<select><option>Selectionner la ville</option></select></label>
            <label>Commune *<select><option>Selectionner la commune</option></select></label>
            <label>Quartier<input placeholder="Ex : Limete, Kintambo, ..." /></label>
            <label className="wide">Reference geographique<input placeholder="Ex : Pres de l'eglise catholique, en face de..." /></label>
          </div>
          <div className="wizard-info"><Icon name="info" /><p><strong>Informations</strong><span>Les champs marques d'un * sont obligatoires. Vous pourrez modifier ces informations plus tard.</span></p></div>
        </div>
        <aside className="management-card school-live-summary">
          <h2>Resume en temps reel</h2>
          {[
            ['home', 'Ecole', 'Non defini'],
            ['person', 'Responsable', 'Non defini'],
            ['calendar', 'Annee scolaire', 'Non definie'],
            ['clipboard', 'Cycles actifs', 'Aucun'],
            ['users', 'Enseignants declares', '0'],
            ['shield', 'Categorie', 'Non definie'],
            ['settings', 'Prix mensuel', '0 $'],
            ['clock', 'Duree abonnement', 'Non definie'],
            ['checkCircle', 'Statut', 'Brouillon'],
          ].map(([icon, label, value]) => <div key={label}><Icon name={icon} /><span>{label}</span><strong>{value}</strong></div>)}
        </aside>
      </section>
      <div className="new-school-actions"><Link className="secondary-button" to="/management/ecoles"><Icon name="login" /> Annuler</Link><button className="secondary-button" type="button"><Icon name="file" /> Enregistrer brouillon</button><button className="blue-button" type="button">Suivant <Icon name="arrow" /></button></div>
    </section>
  )
}

function ManagementWizardSteps() {
  const steps = ['Informations ecole', 'Responsable', 'Configuration scolaire', 'Abonnement & paiement', 'Compte ecole']
  return <section className="management-steps">{steps.map((step, index) => <article className={index === 0 ? 'active' : ''} key={step}><b>{index + 1}</b><span>{step}</span>{index < steps.length - 1 && <i />}</article>)}</section>
}

function ManagementProgramSteps({ active }: { active: number }) {
  const steps = [
    ['Planification annuelle', 'Periodes et calendrier'],
    ['Structure des chapitres', 'Chapitres et sous-chapitres'],
    ['Repartition automatique', 'Calcul des semaines'],
    ['Validation et envoi', 'Transmission Admin-Gestionnaire'],
  ]

  return <section className="program-steps management-program-steps">{steps.map((step, index) => <article className={index <= active ? 'active' : ''} key={step[0]}><b>{index + 1}</b><p><strong>{step[0]}</strong><span>{step[1]}</span></p>{index < steps.length - 1 && <i />}</article>)}</section>
}


function ManagementChapterStructure() {
  const prepared = prepareManagementProgram(managementProgramDraft)
  const [activeChapter, setActiveChapter] = useState(0)
  const selectedChapter = prepared.draft.chapters[activeChapter] || prepared.draft.chapters[0]

  return (
    <section className="program-page management-program-page">
      <ManagementProgramSteps active={1} />
      <section className="program-main-grid">
        <div className="program-left">
          <Card title="2. Structure officielle des chapitres" className="program-card">
            <section className="chapter-editor management-chapter-editor">
              <aside className="chapter-list">
                <header><span>Liste des chapitres</span><Icon name="search" /></header>
                <div>
                  {prepared.draft.chapters.map((chapter, index) => (
                    <button className={index === activeChapter ? 'active' : ''} type="button" key={chapter.id} onClick={() => setActiveChapter(index)}>
                      <Icon name="file" />
                      <span><strong>Chapitre {index + 1}</strong><small>{chapter.title}</small></span>
                    </button>
                  ))}
                </div>
                <em>{prepared.draft.chapters.length} chapitres officiels</em>
              </aside>
              <section className="chapter-details">
                <h3>Details du chapitre {activeChapter + 1}</h3>
                <ProgramField label="Titre du chapitre"><input defaultValue={selectedChapter.title} /></ProgramField>
                <div className="program-form-grid two">
                  <ProgramField label="Nombre de sous-chapitres"><input type="number" defaultValue={selectedChapter.subChapters.length} /></ProgramField>
                  <ProgramField label="Periodes prevues"><input type="number" defaultValue={selectedChapter.periods} /></ProgramField>
                </div>
                <div className="subchapter-fields">
                  <strong>Sous-chapitres / sections</strong>
                  {selectedChapter.subChapters.map((subChapter, index) => (
                    <div key={`${selectedChapter.id}-${subChapter}`}>
                      <span>{activeChapter + 1}.{index + 1}</span>
                      <input defaultValue={subChapter} />
                      <button type="button" aria-label="Supprimer"><Icon name="alert" /></button>
                    </div>
                  ))}
                  <button type="button" className="secondary-button"><Icon name="plus" /> Ajouter un sous-chapitre</button>
                </div>
              </section>
            </section>
          </Card>
        </div>
        <aside className="program-right">
          <Card title="Recapitulatif programme" className="program-card compact-card">
            <dl className="program-recap">
              <dt><Icon name="book" /> Matiere :</dt><dd>{prepared.draft.subject}</dd>
              <dt><Icon name="users" /> Niveau :</dt><dd>{prepared.draft.className}</dd>
              <dt><Icon name="clipboard" /> Sous-chapitres :</dt><dd>{prepared.totalSubChapters}</dd>
              <dt><Icon name="clock" /> Periodes :</dt><dd>{prepared.totalPeriods}</dd>
            </dl>
          </Card>
          <Card title="Preparation base de donnees" className="program-card">
            <div className="program-help no-margin"><Icon name="info" /> Les chapitres sont structures avec des identifiants stables pour les futurs appels API.</div>
          </Card>
        </aside>
      </section>
      <div className="program-actions">
        <Link className="secondary-button" to="/management/programmes/planification">Precedent</Link>
        <button type="button" className="secondary-button">Enregistrer brouillon</button>
        <Link className="blue-button" to="/management/programmes/repartition">Generer la repartition <Icon name="arrow" /></Link>
      </div>
    </section>
  )
}

function ManagementPreviewRows({ rows }: { rows: Array<[string, string]> }) {
  return <div className="management-preview-rows">{rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>
}


function MatrixCell({ value }: { value: string }) {
  return <div className="matrix-cell">{value.split('|').map((part, index) => index % 3 === 0 ? <strong key={`${part}-${index}`}>{part}</strong> : <span key={`${part}-${index}`}>{part}</span>)}</div>
}

function ManagementProgramValidation() {
  const prepared = prepareManagementProgram(managementProgramDraft)
  const [message, setMessage] = useState('Programme pret pour validation')

  function sendProgram() {
    const result = sendProgramToAdminGestionnaire(prepared.draft.id)
    setMessage(`Programme envoye vers ${result.targetPortal} le ${new Date(result.sentAt).toLocaleDateString('fr-FR')}`)
  }

  return (
    <section className="program-page management-program-page">
      <ManagementProgramSteps active={3} />
      {message && <div className="success-toast"><Icon name="checkCircle" /> {message}</div>}
      <section className="program-main-grid">
        <Card title="4. Validation finale du programme officiel" className="program-card">
          <div className="validation-checklist">
            {[
              ['Calendrier scolaire defini', `${prepared.totalWorkingDays} jours ouvrables calcules`],
              ['Periodes manuelles configurees', `${prepared.draft.periods.length} periodes disponibles`],
              ['Chapitres et sous-chapitres saisis', `${prepared.draft.chapters.length} chapitres, ${prepared.totalSubChapters} sous-chapitres`],
              ['Repartition annuelle generee', `${prepared.distribution.length} lignes de planification`],
              ['Destination verifiee', 'Admin-Gestionnaire'],
            ].map((item) => <article key={item[0]}><Icon name="checkCircle" /><p><strong>{item[0]}</strong><span>{item[1]}</span></p></article>)}
          </div>
          <div className="program-help"><Icon name="info" /> Regle metier : seul le programme valide par Management est transmis a l'Admin-Gestionnaire.</div>
        </Card>
        <aside className="program-right">
          <Card title="Synthese d'envoi" className="program-card compact-card">
            <dl className="program-recap">
              <dt><Icon name="book" /> Programme :</dt><dd>{prepared.draft.subject}</dd>
              <dt><Icon name="users" /> Classe :</dt><dd>{prepared.draft.className}</dd>
              <dt><Icon name="calendar" /> Annee :</dt><dd>{prepared.draft.schoolYear}</dd>
              <dt><Icon name="clock" /> Periodes :</dt><dd>{prepared.totalPeriods}</dd>
              <dt><Icon name="arrow" /> Destination :</dt><dd>Admin-Gestionnaire</dd>
            </dl>
          </Card>
          <button type="button" className="blue-button management-send-button" onClick={sendProgram}><Icon name="arrow" /> Envoyer vers l'Admin-Gestionnaire</button>
        </aside>
      </section>
      <div className="program-actions">
        <Link className="secondary-button" to="/management/programmes/repartition">Precedent</Link>
        <button type="button" className="secondary-button">Exporter PDF</button>
        <button type="button" className="blue-button" onClick={sendProgram}>Valider et envoyer <Icon name="arrow" /></button>
      </div>
    </section>
  )
}

type ManagementDataConfig = {
  intro: string
  actionLabel?: string
  actionTo?: string
  kpis: Array<{ icon: string; value: string | number; label: string; detail: string; tone: string }>
  filters: string[]
  columns: string[]
  rows: string[][]
}

function ManagementDataScreen({ intro, actionLabel, actionTo, kpis, filters, columns, rows }: ManagementDataConfig) {
  return (
    <section className="management-data-page">
      <div className="management-page-head">
        <p>{intro}</p>
        {actionLabel && actionTo && <Link className="blue-button" to={actionTo}><Icon name="plus" /> {actionLabel}</Link>}
      </div>
      <section className="management-kpis">{kpis.map((kpi) => <ManagementKpi key={kpi.label} {...kpi} />)}</section>
      <section className="management-card management-data-panel">
        <div className="management-data-toolbar">
          <label className="management-search"><span>Recherche</span><input placeholder="Rechercher..." /></label>
          <button type="button" className="secondary-button"><Icon name="down" /> Reinitialiser les filtres</button>
          {filters.map((filter) => <label key={filter}><span>{filter}</span><select><option>Tous</option><option>Actif</option><option>En attente</option><option>Archive</option></select></label>)}
          <button type="button" className="secondary-button export-button"><Icon name="down" /> Exporter</button>
        </div>
        <div className="management-table-wrap">
          <table className="management-data-table">
            <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}<th>Actions</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.join('-')}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{renderManagementCell(cell)}</td>)}<td><SchoolActions /></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function renderManagementCell(cell: string) {
  if (cell.startsWith('status:')) return <span className={`school-status ${cell.slice(7).toLowerCase().replaceAll(' ', '-')}`}>{cell.slice(7)}</span>
  if (cell.startsWith('money:')) {
    const value = cell.slice(6)
    return <strong className={value.startsWith('-') ? 'balance-due' : 'balance-ok'}>{value}</strong>
  }
  if (cell.startsWith('badge:')) return <span className="school-category ecole-moyenne">{cell.slice(6)}</span>
  return cell
}

function ManagementSubscriptions() {
  return <ManagementDataScreen
    intro="Suivez les souscriptions des ecoles, les quotas enseignants, les echeances et les renouvellements."
    actionLabel="Nouvelle souscription"
    actionTo="/management/ecoles/nouvelle"
    kpis={[
      { icon: 'pie', value: '48', label: 'Souscriptions', detail: 'Toutes les ecoles', tone: 'blue' },
      { icon: 'checkCircle', value: '32', label: 'Actives', detail: '66,7% du parc', tone: 'green' },
      { icon: 'clock', value: '7', label: 'Bientot expirees', detail: '30 prochains jours', tone: 'orange' },
      { icon: 'alert', value: '6', label: 'En retard', detail: 'Paiement attendu', tone: 'red' },
      { icon: 'users', value: '824', label: 'Quotas enseignants', detail: 'Autorises', tone: 'purple' },
    ]}
    filters={['Statut', 'Categorie', 'Echeance', 'Province']}
    columns={['Code', 'Ecole', 'Formule', 'Quota enseignants', 'Periode', 'Echeance', 'Solde', 'Statut']}
    rows={[
      ['PED-2026-0001', 'Complexe Scolaire La Reussite', 'Semestriel', '12 / 15', '01/09/2026 - 28/02/2027', '28/02/2027', 'money:205,00 $', 'status:Actif'],
      ['PED-2026-0002', 'Institut Nzambe Malamu', 'Annuel', '25 / 30', '01/09/2026 - 31/08/2027', '31/08/2027', 'money:0,00 $', 'status:Actif'],
      ['PED-2026-0003', 'CS Les Elites', 'Semestriel', '10 / 12', '01/09/2026 - 15/06/2026', '15/06/2026', 'money:45,00 $', 'status:Bientot expire'],
      ['PED-2026-0004', 'EP Lumiere', 'Trimestriel', '5 / 8', '01/03/2026 - 20/05/2026', '20/05/2026', 'money:-120,00 $', 'status:En retard'],
    ]}
  />
}

function ManagementPayments() {
  return <ManagementDataScreen
    intro="Controlez les paiements, soldes, rappels et historiques financiers des ecoles clientes."
    kpis={[
      { icon: 'file', value: '18 450 $', label: 'Encaissements', detail: 'Mois courant', tone: 'green' },
      { icon: 'clock', value: '2 150 $', label: 'A recevoir', detail: 'Soldes ouverts', tone: 'orange' },
      { icon: 'alert', value: '6', label: 'Retards', detail: 'Relances a envoyer', tone: 'red' },
      { icon: 'checkCircle', value: '91%', label: 'Taux paiement', detail: 'Souscriptions actives', tone: 'blue' },
      { icon: 'pie', value: '37', label: 'Factures payees', detail: 'Ce trimestre', tone: 'purple' },
    ]}
    filters={['Statut', 'Mois', 'Formule', 'Province']}
    columns={['Reference', 'Ecole', 'Montant', 'Paye', 'Solde', 'Mode', 'Date', 'Statut']}
    rows={[
      ['PAY-0001', 'Complexe Scolaire La Reussite', '450,00 $', '245,00 $', 'money:205,00 $', 'Mobile money', '12/06/2026', 'status:Partiel'],
      ['PAY-0002', 'Institut Nzambe Malamu', '1 200,00 $', '1 200,00 $', 'money:0,00 $', 'Banque', '10/06/2026', 'status:Actif'],
      ['PAY-0003', 'EP Lumiere', '300,00 $', '180,00 $', 'money:-120,00 $', 'Cash', '02/06/2026', 'status:En retard'],
      ['PAY-0004', 'College Bel Avenir', '900,00 $', '900,00 $', 'money:0,00 $', 'Banque', '28/05/2026', 'status:Actif'],
    ]}
  />
}

function ManagementSentPrograms() {
  return <ManagementDataScreen
    intro="Liste des programmes officiels envoyes aux Admin-Gestionnaires des ecoles."
    actionLabel="Planifier un programme"
    actionTo="/management/programmes/planification"
    kpis={[
      { icon: 'arrow', value: '24', label: 'Programmes envoyes', detail: 'Annee scolaire', tone: 'blue' },
      { icon: 'checkCircle', value: '19', label: 'Recus', detail: 'Confirmes par les ecoles', tone: 'green' },
      { icon: 'clock', value: '3', label: 'En attente', detail: 'Accuse de reception', tone: 'orange' },
      { icon: 'alert', value: '2', label: 'A renvoyer', detail: 'Correction demandee', tone: 'red' },
      { icon: 'book', value: '8', label: 'Matieres', detail: 'Programmes officiels', tone: 'purple' },
    ]}
    filters={['Ecole', 'Matiere', 'Statut', 'Annee']}
    columns={['Code envoi', 'Ecole', 'Programme', 'Matiere', 'Envoye le', 'Reception', 'Version', 'Statut']}
    rows={[
      ['ENV-001', 'College La Reussite', '6eme A', 'Mathematiques', '01/07/2026', 'Confirmee', 'v1.0', 'status:Actif'],
      ['ENV-002', 'Institut Nzambe Malamu', '5eme B', 'Francais', '01/07/2026', 'En attente', 'v1.0', 'status:En attente'],
      ['ENV-003', 'CS Les Elites', '4eme A', 'SVT', '30/06/2026', 'Correction', 'v1.1', 'status:En retard'],
    ]}
  />
}

function ManagementSendHistory() {
  return <ManagementDataScreen
    intro="Historique chronologique des envois, receptions, corrections et confirmations."
    kpis={[
      { icon: 'clock', value: '86', label: 'Actions tracees', detail: '30 derniers jours', tone: 'blue' },
      { icon: 'checkCircle', value: '64', label: 'Confirmations', detail: 'Receptions valides', tone: 'green' },
      { icon: 'alert', value: '5', label: 'Echecs', detail: 'A investiguer', tone: 'red' },
      { icon: 'file', value: '17', label: 'Corrections', detail: 'Versions renvoyees', tone: 'orange' },
      { icon: 'shield', value: '100%', label: 'Traçabilite', detail: 'Journal complet', tone: 'purple' },
    ]}
    filters={['Type', 'Utilisateur', 'Ecole', 'Periode']}
    columns={['Date', 'Heure', 'Action', 'Programme', 'Ecole', 'Utilisateur', 'Canal', 'Statut']}
    rows={[
      ['01/07/2026', '14:20', 'Envoi programme', 'Mathematiques 6eme A', 'College La Reussite', 'Admin Saas', 'Portail', 'status:Actif'],
      ['01/07/2026', '14:35', 'Accuse reception', 'Mathematiques 6eme A', 'College La Reussite', 'Admin Ecole', 'Portail', 'status:Actif'],
      ['30/06/2026', '10:12', 'Correction demandee', 'SVT 4eme A', 'CS Les Elites', 'Admin Ecole', 'Portail', 'status:En retard'],
    ]}
  />
}

function ManagementReports() {
  return <ManagementDataScreen
    intro="Generez et consultez les rapports de souscription, paiement, programmes et activite pedagogique."
    kpis={[
      { icon: 'clipboard', value: '12', label: 'Rapports generes', detail: 'Ce mois', tone: 'blue' },
      { icon: 'file', value: '5', label: 'Financiers', detail: 'Paiements et soldes', tone: 'green' },
      { icon: 'book', value: '4', label: 'Pedagogiques', detail: 'Programmes envoyes', tone: 'purple' },
      { icon: 'users', value: '3', label: 'Ecoles', detail: 'Souscriptions', tone: 'orange' },
      { icon: 'down', value: '28', label: 'Exports', detail: 'PDF / Excel', tone: 'red' },
    ]}
    filters={['Categorie', 'Periode', 'Format', 'Statut']}
    columns={['Rapport', 'Categorie', 'Periode', 'Donnees', 'Format', 'Genere le', 'Auteur', 'Statut']}
    rows={[
      ['Rapport souscriptions', 'Abonnements', 'Juin 2026', '48 ecoles', 'PDF', '30/06/2026', 'Admin Saas', 'status:Actif'],
      ['Rapport paiements', 'Finance', 'T2 2026', '42 transactions', 'Excel', '29/06/2026', 'Admin Saas', 'status:Actif'],
      ['Rapport programmes envoyes', 'Pedagogie', '2024-2025', '24 programmes', 'PDF', '28/06/2026', 'Management', 'status:Brouillon'],
    ]}
  />
}

function ManagementStatistics() {
  return (
    <section className="management-data-page">
      <div className="management-page-head"><p>Vue statistique du parc ecoles, des souscriptions, paiements et programmes envoyes.</p></div>
      <section className="management-kpis">
        <ManagementKpi icon="home" value="48" label="Ecoles clientes" detail="+6 ce trimestre" tone="blue" />
        <ManagementKpi icon="pie" value="67%" label="Actives" detail="Souscriptions valides" tone="green" />
        <ManagementKpi icon="file" value="18 450 $" label="CA mensuel" detail="Encaissements" tone="orange" />
        <ManagementKpi icon="book" value="24" label="Programmes envoyes" detail="Toutes ecoles" tone="purple" />
        <ManagementKpi icon="alert" value="11" label="Alertes" detail="Retards et echeances" tone="red" />
      </section>
      <section className="management-stat-grid">
        <Card title="Evolution des souscriptions" className="management-card"><BarChart /></Card>
        <Card title="Repartition par statut" className="management-card"><Donut value={67} center="48" label="Ecoles" /><Legend rows={[['Actives', 67, 'green'], ['Bientot expirees', 15, 'blue'], ['En retard', 12, 'orange'], ['Suspendues', 6, 'red']]} /></Card>
        <Card title="Top provinces" className="management-card"><RankList rows={['Kinshasa|24 ecoles|50%', 'Haut-Katanga|8 ecoles|17%', 'Kongo Central|6 ecoles|13%', 'Nord-Kivu|5 ecoles|10%']} good /></Card>
      </section>
    </section>
  )
}

function ManagementSettings() {
  return (
    <section className="management-data-page">
      <div className="management-page-head"><p>Parametres globaux du portail Management, des formules, notifications et jours feries.</p></div>
      <section className="settings-grid">
        {[
          ['settings', 'Parametres generaux', 'Nom plateforme, devise, langue et exercice scolaire'],
          ['pie', 'Formules de souscription', 'Petite ecole, ecole moyenne, ecole grande'],
          ['calendar', 'Jours feries & conges', 'Calendrier utilise pour les repartitions annuelles'],
          ['bell', 'Notifications', 'Rappels paiement, echeances et programmes envoyes'],
          ['users', 'Utilisateurs', 'Comptes Management et niveaux d acces'],
          ['shield', 'Securite', 'Sessions, mots de passe et journalisation'],
        ].map(([icon, title, desc]) => <Card key={title} title={title} className="setting-card"><Icon name={icon} /><p>{desc}</p><button type="button" className="secondary-button">Configurer</button></Card>)}
      </section>
    </section>
  )
}

function ManagementAudit() {
  return <ManagementDataScreen
    intro="Journal d'audit et de tracabilite des actions sensibles du portail Management."
    kpis={[
      { icon: 'shield', value: '186', label: 'Actions auditees', detail: '30 derniers jours', tone: 'blue' },
      { icon: 'login', value: '42', label: 'Connexions', detail: 'Utilisateurs Management', tone: 'green' },
      { icon: 'alert', value: '4', label: 'Alertes securite', detail: 'A verifier', tone: 'red' },
      { icon: 'file', value: '31', label: 'Exports', detail: 'Documents generes', tone: 'orange' },
      { icon: 'checkCircle', value: '99%', label: 'Integrite', detail: 'Journal complet', tone: 'purple' },
    ]}
    filters={['Action', 'Utilisateur', 'Module', 'Risque']}
    columns={['Date', 'Heure', 'Utilisateur', 'Module', 'Action', 'Adresse IP', 'Risque', 'Statut']}
    rows={[
      ['01/07/2026', '15:12', 'Admin Saas', 'Programmes', 'Envoi programme', '192.168.1.20', 'badge:Faible', 'status:Actif'],
      ['01/07/2026', '14:03', 'Admin Saas', 'Paiements', 'Export Excel', '192.168.1.20', 'badge:Moyen', 'status:Actif'],
      ['30/06/2026', '18:44', 'Super Admin', 'Parametres', 'Modification formule', '192.168.1.11', 'badge:Eleve', 'status:En attente'],
    ]}
  />
}

function ManagementUsers() {
  return <ManagementDataScreen
    intro="Gestion des comptes Management, roles et permissions internes."
    actionLabel="Nouvel utilisateur"
    actionTo="/management/utilisateurs"
    kpis={[
      { icon: 'users', value: '8', label: 'Utilisateurs', detail: 'Comptes actifs', tone: 'blue' },
      { icon: 'shield', value: '3', label: 'Super admins', detail: 'Acces complet', tone: 'purple' },
      { icon: 'checkCircle', value: '7', label: 'Actifs', detail: 'Connectables', tone: 'green' },
      { icon: 'clock', value: '1', label: 'Invite', detail: 'Activation en attente', tone: 'orange' },
      { icon: 'alert', value: '0', label: 'Bloques', detail: 'Aucun incident', tone: 'red' },
    ]}
    filters={['Role', 'Statut', 'Derniere connexion', 'Equipe']}
    columns={['Nom', 'Email', 'Role', 'Equipe', 'Derniere connexion', '2FA', 'Statut']}
    rows={[
      ['Admin Saas', 'admin@pedago.cd', 'Super Administrateur', 'Management', '01/07/2026 15:12', 'Active', 'status:Actif'],
      ['Grace Mbuyi', 'grace@pedago.cd', 'Gestionnaire', 'Souscriptions', '01/07/2026 11:02', 'Active', 'status:Actif'],
      ['Patrick Ilunga', 'patrick@pedago.cd', 'Comptable', 'Paiements', '30/06/2026 17:44', 'En attente', 'status:En attente'],
    ]}
  />
}

function ManagementNotifications() {
  const [items,setItems]=useState<AppNotification[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{void notificationsApi.list().then(setItems).catch((reason:unknown)=>setError(reason instanceof Error?reason.message:'Chargement impossible')).finally(()=>setLoading(false))},[])
  return <section className="management-data-page"><div className="management-page-head"><p>Centre de supervision des notifications réellement enregistrées.</p></div>{loading?<div className="management-card">Chargement sécurisé…</div>:error?<div className="management-card">{error}</div>:!items.length?<div className="management-card">Aucune notification disponible.</div>:<div className="management-card"><div className="resource-table-wrap"><table className="resource-table"><thead><tr><th>Date</th><th>Type</th><th>Titre</th><th>Message</th><th>Livraison</th><th>Lecture</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{formatNotificationDate(item.created_at)}</td><td>{item.notification_type}</td><td>{item.title}</td><td>{item.message}</td><td><NotificationDeliveryBadge status={item.delivery_status}/>{!item.delivery_status&&'Non renseigné'}</td><td>{item.is_read?'Lue':'Non lue'}</td></tr>)}</tbody></table></div></div>}</section>
}

function ManagementSupport() {
  return (
    <section className="management-data-page">
      <div className="management-page-head"><p>Ressources d'aide pour accompagner les administrateurs Management.</p></div>
      <section className="settings-grid">
        {[
          ['info', 'Guide Management', 'Creer les ecoles, souscriptions et programmes officiels.'],
          ['message', 'Support client', 'Suivi des demandes venant des ecoles clientes.'],
          ['file', 'Documentation', 'Procedures de paiement, audit et export de rapports.'],
        ].map(([icon, title, desc]) => <Card key={title} title={title} className="setting-card"><Icon name={icon} /><p>{desc}</p><button type="button" className="secondary-button">Ouvrir</button></Card>)}
      </section>
    </section>
  )
}

function DirectorLayout({ title, subtitle, crumb, children, compactFilters = false }: { title: string; subtitle?: string; crumb?: string; children: ReactNode; compactFilters?: boolean }) {
  return (
    <main className="director-shell">
      <Sidebar />
      <section className="director-main">
        <header className="director-topbar">
          <button className="hamburger" type="button" aria-label="Menu"><Icon name="menu" /></button>
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : <p>Accueil <span>›</span> {crumb}</p>}
          </div>
          <div className={`period-filters${compactFilters ? ' period-filters-compact' : ''}`}>
            <FilterBox icon="calendar" label="Année scolaire" value="2024 - 2025" />
            {!compactFilters && <FilterBox label="Trimestre" value="1er Trimestre" />}
            {!compactFilters && <FilterBox label="Mois actuel" value={new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date())} />}
            <HeaderFeedDropdown icon="bell" title="Notifications" initialCount={7} items={headerNotifications} />
            <HeaderFeedDropdown icon="message" title="Messages" initialCount={3} items={headerMessages} />
            <UserMenu />
          </div>
        </header>
        <div className="director-content">{children}</div>
        <DirectorFooter />
      </section>
    </main>
  )
}

function Sidebar() {
  return (
    <aside className="director-sidebar">
      <Link className="director-brand" to="/directeur">
        <img src={brandLogo} alt="CONTRÔLE PÉDAGOGIQUE" />
      </Link>
      <nav className="director-nav">
        {navItems.map((item) => (
          <NavLink key={item.label} to={item.to} end={item.to === '/directeur'} className={({ isActive }) => `director-nav-link${isActive ? ' active' : ''}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.badge && <b>{item.badge}</b>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-arc"><span /><strong>★</strong></div>
      <div className="sidebar-illustration"><div className="teacher-scene">Chapitre 2<br />Les Fractions</div></div>
      <LogoutButton />
      <div className="school-card"><Avatar name="Institut Excellence" crest /><div><strong>Institut Excellence</strong><span>Kinshasa - RDC</span><em>L’excellence aujourd’hui,<br />le leadership demain.</em></div><Icon name="chevron" /></div>
    </aside>
  )
}


function SchoolPrograms() {
  const [schoolStart, setSchoolStart] = useState('2024-09-07')
  const [schoolEnd, setSchoolEnd] = useState('2025-06-06')
  const [includeSaturday, setIncludeSaturday] = useState(true)
  const [className, setClassName] = useState(programClasses[0])
  const [subject, setSubject] = useState(programSubjects[0])
  const [teacher, setTeacher] = useState(programTeachers[0])
  const [chapterCount, setChapterCount] = useState(18)
  const [activeChapter, setActiveChapter] = useState(0)
  const [chapters, setChapters] = useState<ProgramChapter[]>(
    Array.from({ length: 18 }, (_, index) => ({
      title: chapterSamples[index] || `Chapitre ${index + 1}`,
      subCount: index === 0 ? 3 : 2,
      periods: index === 0 ? 4 : index > 10 ? 3 : 4,
      subChapters: Array.from({ length: index === 0 ? 3 : 2 }, (__, subIndex) => subChapterSamples[subIndex] || `Sous-chapitre ${subIndex + 1}`),
    })),
  )

  const totalSubChapters = chapters.reduce((total, chapter) => total + chapter.subCount, 0)
  const totalPeriods = chapters.reduce((total, chapter) => total + chapter.periods, 0)
  const selectedChapter = chapters[activeChapter] || chapters[0]

  function syncChapterCount(value: number) {
    const nextCount = Math.max(1, Math.min(36, value || 1))
    setChapterCount(nextCount)
    setChapters((current) => Array.from({ length: nextCount }, (_, index) => current[index] || {
      title: chapterSamples[index] || `Chapitre ${index + 1}`,
      subCount: 2,
      periods: 4,
      subChapters: Array.from({ length: 2 }, (__, subIndex) => subChapterSamples[subIndex] || `Sous-chapitre ${subIndex + 1}`),
    }))
    setActiveChapter((current) => Math.min(current, nextCount - 1))
  }

  function updateChapter(index: number, patch: Partial<ProgramChapter>) {
    setChapters((current) => current.map((chapter, chapterIndex) => {
      if (chapterIndex !== index) return chapter
      const nextSubCount = patch.subCount ?? chapter.subCount
      const nextSubChapters = patch.subChapters || Array.from({ length: nextSubCount }, (__, subIndex) => chapter.subChapters[subIndex] || subChapterSamples[subIndex] || `Sous-chapitre ${subIndex + 1}`)
      return { ...chapter, ...patch, subCount: nextSubCount, subChapters: nextSubChapters }
    }))
  }

  function updateSubChapter(chapterIndex: number, subIndex: number, value: string) {
    setChapters((current) => current.map((chapter, index) => index === chapterIndex
      ? { ...chapter, subChapters: chapter.subChapters.map((subChapter, currentSubIndex) => currentSubIndex === subIndex ? value : subChapter) }
      : chapter))
  }

  function submitProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <form className="program-page" onSubmit={submitProgram}>
      <ProgramSteps />
      <section className="program-top-grid">
        <Card title="1. Parametres de l'annee scolaire" className="program-card program-school-year">
          <div className="program-form-grid three">
            <ProgramField label="Date de debut">
              <input type="date" value={schoolStart} onChange={(event) => setSchoolStart(event.target.value)} />
            </ProgramField>
            <ProgramField label="Date de fin">
              <input type="date" value={schoolEnd} onChange={(event) => setSchoolEnd(event.target.value)} />
            </ProgramField>
            <label className="program-check">
              <span>Samedi inclus dans les jours ouvrables ?</span>
              <strong><input type="checkbox" checked={includeSaturday} onChange={(event) => setIncludeSaturday(event.target.checked)} /> Oui, inclure les samedis</strong>
              <small>Si decoche, les samedis ne seront pas pris en compte.</small>
            </label>
          </div>
        </Card>
        <div className="program-info-box"><Icon name="info" /><p><strong>Information</strong><span>La repartition annuelle sera generee automatiquement en fonction des parametres definis.</span></p></div>
      </section>

      <section className="program-main-grid">
        <div className="program-left">
          <Card title="2. Selection du cours, classe et enseignant" className="program-card">
            <div className="program-selection-grid">
              <ProgramField label="Classe / Niveau">
                <select value={className} onChange={(event) => setClassName(event.target.value)}>{programClasses.map((item) => <option key={item}>{item}</option>)}</select>
              </ProgramField>
              <ProgramField label="Matiere / Cours">
                <select value={subject} onChange={(event) => setSubject(event.target.value)}>{programSubjects.map((item) => <option key={item}>{item}</option>)}</select>
              </ProgramField>
              <ProgramField label="Enseignant responsable">
                <select value={teacher} onChange={(event) => setTeacher(event.target.value)}>{programTeachers.map((item) => <option key={item}>{item}</option>)}</select>
              </ProgramField>
            </div>
          </Card>

          <Card title="3. Saisie des chapitres et sections" className="program-card">
            <div className="program-form-grid three program-count-row">
              <ProgramField label="Nombre total de chapitres">
                <input type="number" min="1" max="36" value={chapterCount} onChange={(event) => syncChapterCount(Number(event.target.value))} />
              </ProgramField>
              <ProgramField label="Periodes totales pour cette matiere">
                <input value={totalPeriods} readOnly />
              </ProgramField>
              <ProgramField label="Periodes par semaine">
                <input type="number" min="1" defaultValue="2" />
              </ProgramField>
            </div>
            <section className="chapter-editor">
              <aside className="chapter-list">
                <header><span>Liste des chapitres</span><Icon name="search" /></header>
                <div>
                  {chapters.map((chapter, index) => (
                    <button className={index === activeChapter ? 'active' : ''} type="button" key={`${chapter.title}-${index}`} onClick={() => setActiveChapter(index)}>
                      <Icon name="file" />
                      <span><strong>Chapitre {index + 1}</strong><small>{chapter.title}</small></span>
                    </button>
                  ))}
                </div>
                <em>{chapters.length} chapitres au total</em>
              </aside>
              <section className="chapter-details">
                <h3>Details du chapitre {activeChapter + 1}</h3>
                <ProgramField label="Titre du chapitre">
                  <input value={selectedChapter.title} onChange={(event) => updateChapter(activeChapter, { title: event.target.value })} />
                </ProgramField>
                <div className="program-form-grid two">
                  <ProgramField label="Nombre de sous-chapitres / sections">
                    <input type="number" min="1" max="12" value={selectedChapter.subCount} onChange={(event) => updateChapter(activeChapter, { subCount: Number(event.target.value) })} />
                  </ProgramField>
                  <ProgramField label="Periodes prevues pour ce chapitre">
                    <input type="number" min="1" value={selectedChapter.periods} onChange={(event) => updateChapter(activeChapter, { periods: Number(event.target.value) })} />
                  </ProgramField>
                </div>
                <div className="subchapter-fields">
                  <strong>Sous-chapitres / sections</strong>
                  {selectedChapter.subChapters.map((subChapter, index) => (
                    <div key={`${activeChapter}-${index}`}>
                      <span>{activeChapter + 1}.{index + 1}</span>
                      <input value={subChapter} onChange={(event) => updateSubChapter(activeChapter, index, event.target.value)} />
                      <button type="button" aria-label="Supprimer"><Icon name="alert" /></button>
                    </div>
                  ))}
                  <button type="button" className="secondary-button"><Icon name="plus" /> Ajouter un sous-chapitre</button>
                </div>
              </section>
            </section>
            <div className="program-help"><Icon name="info" /> Saisissez tous les chapitres et leurs sous-chapitres. La repartition annuelle sera generee automatiquement apres validation.</div>
          </Card>
        </div>

        <aside className="program-right">
          <Card title="Recapitulatif" className="program-card compact-card">
            <dl className="program-recap">
              <dt><Icon name="users" /> Classe :</dt><dd>{className}</dd>
              <dt><Icon name="book" /> Matiere :</dt><dd>{subject}</dd>
              <dt><Icon name="person" /> Enseignant :</dt><dd>{teacher}</dd>
              <dt><Icon name="calendar" /> Annee scolaire :</dt><dd>{schoolStart.split('-').reverse().join('/')} - {schoolEnd.split('-').reverse().join('/')}</dd>
              <dt><Icon name="clock" /> Samedi inclus :</dt><dd>{includeSaturday ? 'Oui' : 'Non'}</dd>
            </dl>
          </Card>

          <Card title="Statistiques du programme" className="program-card stats-card">
            <div><strong>{chapters.length}</strong><span>Chapitres</span></div>
            <div><strong>{totalSubChapters}</strong><span>Sous-chapitres</span></div>
            <div><strong>{totalPeriods}</strong><span>Periodes totales</span></div>
            <div><strong>36</strong><span>Semaines ouvrables</span></div>
          </Card>

          <Card title="4. Apercu de la repartition automatique" className="program-card repartition-card">
            <button type="button">Apercu base sur les parametres actuels</button>
            <table>
              <thead><tr><th>Mois</th><th>Chapitres prevus</th><th>Periodes</th></tr></thead>
              <tbody>{repartitionRows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td><span>{row[1]}</span></td><td>{row[2]}</td></tr>)}</tbody>
            </table>
            <div className="program-includes">
              <Icon name="info" />
              <p><strong>La repartition tient compte de :</strong><span>La periode de l'annee scolaire</span><span>Les jours ouvrables</span><span>Les periodes par semaine definies</span></p>
              <div className="calendar-prop" />
            </div>
          </Card>
        </aside>
      </section>

      <div className="program-actions">
        <button type="button" className="secondary-button" disabled>Precedent</button>
        <button type="button" className="secondary-button">Enregistrer en brouillon</button>
        <button className="blue-button" type="submit">Valider et generer la repartition annuelle <Icon name="arrow" /></button>
      </div>
    </form>
  )
}

function ProgramField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="program-field"><span>{label} *</span>{children}</label>
}

function ProgramSteps() {
  const steps = [
    ['1', "Parametres de l'annee scolaire", 'Definir la periode et les options'],
    ['2', "Selection du cours et de l'enseignant", "Choisir classe, matiere et enseignant"],
    ['3', 'Saisie des chapitres', 'Definir chapitres et sections'],
    ['4', 'Repartition annuelle', 'Generation automatique'],
  ]

  return <section className="program-steps">{steps.map((step, index) => <article className={index === 0 ? 'active' : ''} key={step[0]}><b>{step[0]}</b><p><strong>{step[1]}</strong><span>{step[2]}</span></p>{index < steps.length - 1 && <i />}</article>)}</section>
}

function AnnualRepartition() {
  const [message, setMessage] = useState('Synchronise avec le portail Enseignant')
  const realised = annualPlanRows.filter((row) => row.status === 'Realise').length
  const inProgress = annualPlanRows.filter((row) => row.status === 'En cours').length
  const late = annualPlanRows.filter((row) => row.status === 'Retard').length
  const totalPeriods = annualPlanRows.reduce((total, row) => total + row.periods, 0)
  const totalSubChapters = annualPlanRows.reduce((total, row) => total + row.subs, 0)

  function runAction(label: string) {
    setMessage(`${label} effectue - repartition publiee et disponible dans le portail Enseignant`)
  }

  return (
    <section className="annual-page">
      <div className="annual-meta-grid">
        <AnnualMeta icon="users" label="Classe / Niveau" value="5eme A" />
        <AnnualMeta icon="book" label="Matiere / Cours" value="Mathematiques" />
        <AnnualMeta icon="person" label="Enseignante" value="Mme. Grace Mbuyi" />
        <AnnualMeta icon="calendar" label="Periode scolaire" value="07/09/2024 - 06/06/2025" />
        <AnnualMeta icon="calendar" label="Samedi inclus" value="Non" />
        <AnnualMeta icon="calendar" label="Semaines ouvrables" value="36 semaines" />
        <AnnualMeta icon="book" label="Nombre de chapitres" value={`${annualPlanRows.length} chapitres`} />
        <AnnualMeta icon="clipboard" label="Nombre de sous-chapitres" value={`${totalSubChapters} sous-chapitres`} />
        <AnnualMeta icon="clock" label="Nombre total de periodes" value={`${totalPeriods} periodes`} />
        <AnnualMeta icon="clock" label="Genere le" value="02 Sept. 2024 a 10:42" />
        <div className="annual-sync"><Icon name="checkCircle" /><p><strong>Synchronise</strong><span>avec le portail Enseignant</span><small>{message}</small></p></div>
      </div>

      <div className="annual-actions">
        <button type="button" className="blue-button" onClick={() => runAction('Modification')}><Icon name="file" /> Modifier la repartition</button>
        <button type="button" className="green-action" onClick={() => runAction('Regeneration automatique')}><Icon name="checkCircle" /> Regenerer automatiquement</button>
        <button type="button" className="secondary-button" onClick={() => runAction('Export PDF')}><Icon name="pdf" /> Export PDF</button>
        <button type="button" className="secondary-button" onClick={() => runAction('Export Excel')}><Icon name="excel" /> Export Excel</button>
        <button type="button" className="secondary-button" onClick={() => runAction('Impression')}><Icon name="print" /> Imprimer</button>
        <button type="button" className="blue-button publish" onClick={() => runAction('Publication aux enseignants')}><Icon name="arrow" /> Publier aux enseignants</button>
      </div>

      <Card title="Planification annuelle des chapitres" className="annual-planning-card table-card">
        <table className="annual-table">
          <thead>
            <tr>
              <th>N</th>
              <th>Chapitres / sous-chapitres</th>
              <th>Sous-chapitres</th>
              <th>Periodes</th>
              <th>Semaines</th>
              <th colSpan={10}>Mois</th>
              <th>Prevu</th>
              <th>Realise</th>
              <th>Statut</th>
            </tr>
            <tr className="months-row">
              <th />
              <th />
              <th />
              <th />
              <th />
              {['Sept.', 'Oct.', 'Nov.', 'Dec.', 'Janv.', 'Fevr.', 'Mars', 'Avr.', 'Mai', 'Juin'].map((month) => <th key={month}>{month}</th>)}
              <th />
              <th />
              <th />
            </tr>
          </thead>
          <tbody>{annualPlanRows.map((row) => <AnnualPlanningRow key={row.no} row={row} />)}</tbody>
        </table>
        <div className="annual-legend">
          <span className="blue" /> 1er Trimestre (Sept. - Dec.)
          <span className="green" /> 2eme Trimestre (Janv. - Mars)
          <span className="orange" /> 3eme Trimestre (Avr. - Mai)
          <span className="purple" /> 4eme Trimestre (Juin)
          <span className="red" /> Retard
        </div>
      </Card>

      <section className="annual-bottom-grid">
        <Card title="Tableau de bord d'execution" className="execution-card">
          <div className="execution-stats">
            <div className="green"><strong>{realised}</strong><span>Realises</span><small>72%</small></div>
            <div className="orange"><strong>{inProgress + 2}</strong><span>En cours</span><small>17%</small></div>
            <div className="red"><strong>{late}</strong><span>En retard</span><small>11%</small></div>
            <div className="blue"><strong>{annualPlanRows.length}</strong><span>Total chapitres</span><small>{totalPeriods} periodes</small></div>
          </div>
        </Card>
        <Card title="Repartition par trimestre" className="annual-donut-card"><Donut value={72} center="18" label="Chapitres" /><Legend rows={[['1er Trimestre : 5 chapitres', 28, 'blue'], ['2eme Trimestre : 5 chapitres', 28, 'green'], ['3eme Trimestre : 4 chapitres', 22, 'orange'], ['4eme Trimestre : 4 chapitres', 22, 'purple']]} /></Card>
        <Card title="Synthese annuelle" className="annual-summary-card">
          {[
            ['1er Trimestre', 'Sept. - Dec.', '5', '24'],
            ['2eme Trimestre', 'Janv. - Mars', '5', '24'],
            ['3eme Trimestre', 'Avr. - Mai', '4', '22'],
            ['4eme Trimestre', 'Juin', '4', '24'],
          ].map((item) => <article key={item[0]}><strong>{item[0]}</strong><span>{item[1]}</span><b>{item[2]}</b><em>{item[3]} periodes</em></article>)}
        </Card>
        <Card title="Calendrier scolaire" className="annual-calendar-card">
          {schoolCalendarRows.map(([label, date, color]) => <div key={label}><span className={color} /><strong>{label}</strong><em>{date}</em></div>)}
          <LinkRow to="/directeur/calendrier">Voir calendrier officiel</LinkRow>
        </Card>
      </section>

      <div className="program-help annual-note"><Icon name="info" /> Cette repartition est basee sur les parametres de l'annee scolaire selectionnee. Elle est automatiquement disponible dans le portail Enseignant.</div>
      <div className="teacher-published-source" aria-hidden="true">Publication active : Mes programmes et Ma progression Enseignant</div>
    </section>
  )
}

function AnnualMeta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <article className="annual-meta"><Icon name={icon} /><p><span>{label}</span><strong>{value}</strong></p></article>
}

function AnnualPlanningRow({ row }: { row: typeof annualPlanRows[number] }) {
  const monthIndex = ['sept', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun'].indexOf(row.month)

  return (
    <tr>
      <td>{row.no}</td>
      <td><strong>{row.chapter}</strong></td>
      <td>{row.subs}</td>
      <td>{row.periods}</td>
      <td>{row.weeks}</td>
      {Array.from({ length: 10 }, (_, index) => (
        <td className="month-cell" key={index}>{index === monthIndex && <span className={`plan-bar ${row.tone}`} style={{ '--span': row.span } as React.CSSProperties} />}</td>
      ))}
      <td>{row.planned}</td>
      <td>{row.done}</td>
      <td><span className={`annual-status ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td>
    </tr>
  )
}

function ProgressTracking() {
  return (
    <>
      <KpiGrid items={[
        { icon: 'chart', value: '67%', label: "Taux global d'exécution", tone: 'blue', delta: '+5% vs mois dernier' },
        { icon: 'book', value: '97', label: 'Programmes en cours', tone: 'green', delta: '+3 vs mois dernier' },
        { icon: 'clock', value: '8', label: 'Programmes en retard', tone: 'orange', delta: '-2 vs mois dernier' },
        { icon: 'alert', value: '5', label: 'Alertes critiques', tone: 'red' },
      ]} side={<StudentBanner />} />
      <section className="two-col">
        <Card title="Avancement des programmes par matière" className="table-card main-table">
          <Filters labels={['Classe', 'Matière', 'Statut']} search="Rechercher une matière..." />
          <SubjectTable />
        </Card>
        <aside className="right-column">
          <Card title="Situation des programmes"><Donut value={67} center="120" label="Programmes" /><Legend rows={[['En avance', 37, 'green'], ['Conformes', 43, 'blue'], ['En retard', 12, 'orange'], ['Critiques', 8, 'red']]} /></Card>
          <AlertCard />
        </aside>
      </section>
      <section className="bottom-grid">
        <Card title="Évolution du taux d'exécution"><LineTrend /></Card>
        <Card title="Top 5 des matières (meilleur taux)"><RankList rows={['Éducation Civique 83%', 'Histoire-Géographie 78%', 'Mathématiques 71%', 'SVT 71%', 'Français 65%']} good /></Card>
        <Card title="Matières à améliorer"><RankList rows={['Anglais 50%', 'Physique-Chimie 56%', 'Français 65%', 'Mathématiques 71%', 'SVT 71%']} /></Card>
        <InfoPanel />
      </section>
      <PromoBand />
    </>
  )
}

function EvaluationControl() {
  return (
    <>
      <section className="content-with-side">
        <div>
          <KpiGrid items={[
            { icon: 'clipboard', value: '128', label: 'Évaluations programmées', tone: 'blue', delta: '+12 vs mois dernier' },
            { icon: 'checkCircle', value: '96', label: 'Évaluations réalisées', tone: 'green', delta: '+20 vs mois dernier' },
            { icon: 'clock', value: '15', label: 'Évaluations en retard', tone: 'orange', delta: '-5 vs mois dernier' },
            { icon: 'chart', value: '75%', label: 'Taux de réalisation', tone: 'purple', delta: '+8% vs mois dernier' },
          ]} />
          <Card className="table-card">
            <div className="toolbar-row"><Filters labels={['Classe', 'Matière', "Type d'évaluation", 'Période']} search="Rechercher une évaluation..." /><button className="blue-button"><Icon name="plus" /> Nouvelle évaluation</button></div>
            <EvaluationTable />
          </Card>
          <section className="bottom-grid eval-bottom">
            <Card title="Top 5 matières les plus régulières"><RankList rows={['Histoire-Géographie 89%', 'Informatique 83%', 'Mathématiques 78%', 'Français 76%', 'SVT 74%']} good /></Card>
            <Card title="Top 5 enseignants respectant le calendrier"><RankList rows={['Mme. Rachel Banza 93%', 'M. Jean Kabasele 90%', 'Mme. Grace Mbuyi 88%', 'M. David Mukendi 84%', 'M. Junior Mbala 80%']} good /></Card>
            <Card title="Répartition des statuts"><Donut value={75} center="128" label="Évaluations" /><Legend rows={[['Réalisées', 75, 'green'], ['À venir', 13, 'orange'], ['En retard', 12, 'red'], ['Annulées', 0, 'gray']]} /></Card>
          </section>
        </div>
        <aside className="right-column">
          <AlertCard title="Alertes d'évaluations" />
          <CalendarCard />
          <InfoPanel />
        </aside>
      </section>
    </>
  )
}

function Reports() {
  const [rows, setRows] = useState<UiLessonReport[]>([])
  const [summary, setSummary] = useState({ soumis: 0, valides: 0, rejetes: 0, corrections: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadReports() {
      setLoading(true)
      setError('')

      try {
        const data = await reportsApi.getSupervisionReports()
        if (!mounted) return
        setRows(Array.from(new Map(data.reports.map((report) => [report.rawId, report])).values()))
        setSummary(data.summary)
      } catch (apiError) {
        if (!mounted) return
        setError(apiError instanceof TypeError ? 'Connexion backend indisponible.' : 'Impossible de charger les rapports.')
        setRows([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadReports()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="content-with-side">
      <div>
        <KpiGrid items={[
          { icon: 'file', value: String(summary.soumis), label: 'Rapports quotidiens soumis', tone: 'blue', delta: 'Vue observation' },
          { icon: 'checkCircle', value: String(summary.valides), label: 'Rapports validés', tone: 'green', delta: 'Par le Préfet' },
          { icon: 'alert', value: String(summary.rejetes), label: 'Rapports rejetés', tone: 'red', delta: 'Décisions Préfet' },
          { icon: 'clock', value: String(summary.corrections), label: 'Corrections demandées', tone: 'orange', delta: 'À suivre' },
          { icon: 'users', value: '34', label: 'Enseignants actifs', tone: 'purple', delta: 'Aujourd’hui' },
        ]} />
        <Card><Filters labels={['Date', 'Enseignant', 'Classe', 'Matière', 'Statut']} action="Filtrer" /></Card>
        <Card title="Centre de Supervision - rapports quotidiens" className="table-card reports-table">
          {loading && <div className="note-box"><Icon name="clock" /> Chargement des rapports...</div>}
          {error && <div className="login-error">{error}</div>}
          {!loading && !rows.length ? <div className="note-box"><Icon name="info" /> Aucun rapport réel disponible.</div> : <DailyReportsSupervisionTable reports={rows} />}
          <div className="readonly-note"><Icon name="eye" /> Le Promoteur observe silencieusement. Les décisions restent réservées au Préfet / Directeur des Études.</div>
        </Card>
        <section className="supervision-grid">
          <Card title="Actions récentes du Préfet">
            <DecisionHistoryList reports={rows} />
          </Card>
          <Card title="Retards ou absences de rapport">
            <div className="report-summary-list">
              {[
                ['Esther Tshi', '2nde C - Histoire-Géographie', 'Rapport rejeté, justification attendue'],
                ['David Mukendi', '6ème A - Anglais', 'Rapport du 06/07 non reçu à 12:30'],
                ['Junior Mbala', '5ème B - SVT', 'Correction demandée depuis hier'],
              ].map(([name, meta, detail]) => <article key={name}><Icon name="clock" /><p><strong>{name}</strong><span>{meta}</span><em>{detail}</em></p></article>)}
            </div>
          </Card>
        </section>
      </div>
      <aside className="right-column">
        <Card title="Alertes pédagogiques importantes"><PrefectAlertList /></Card>
        <Card title="Synthèse des statuts"><Donut value={67} label="Validés" /><Legend rows={[['Soumis', 17, 'blue'], ['Validés', 67, 'green'], ['Rejetés', 8, 'red'], ['Corrections', 8, 'orange']]} /></Card>
        <Card title="Activité pédagogique"><LineTrend /><div className="note-box"><Icon name="info" /> Supervision consolidée des rapports quotidiens avant connexion backend.</div></Card>
      </aside>
    </section>
  )
}

function DailyReportsSupervisionTable({ reports = [] }: { reports?: UiLessonReport[] }) {
  return <table><thead><tr><th>Date</th><th>Enseignant</th><th>Classe</th><th>Matiere</th><th>Chapitre</th><th>Statut</th><th>Action</th><th>Observation</th></tr></thead><tbody>{reports.map((report) => <tr key={report.rawId || report.id} onClick={() => window.location.assign(`/directeur/supervision/${report.rawId || report.id}`)} className="clickable-row"><td>{report.date}</td><td><Avatar name={report.teacher} small /><button className="link-button table-link" type="button" onClick={(event) => { event.stopPropagation(); window.location.assign(`/directeur/supervision/${report.rawId || report.id}`) }}>{report.teacher}</button></td><td>{report.className}</td><td>{report.subject}</td><td><strong>{report.chapter}</strong><span className="data-line">{report.subChapter}</span></td><td><ReportStatusBadge status={report.status} /></td><td>{report.decision}</td><td>{report.prefectObservation}</td></tr>)}</tbody></table>
}

function ReportStatusBadge({ status }: { status: string }) {
  const tone = status.includes('Rejet') ? 'red' : status.includes('Valid') ? 'green' : status.includes('Soumis') ? 'blue' : status.includes('Correction') ? 'purple' : 'orange'
  return <span className={`badge ${tone}`}>{status}</span>
}

function DecisionHistoryList({ reports = [] }: { reports?: UiLessonReport[] }) {
  return <div className="report-summary-list decision-history">{reports.map((report) => <article key={`decision-${report.id}`}><Icon name={report.decision === 'Validé' ? 'checkCircle' : report.decision === 'Rejeté' ? 'alert' : 'message'} /><p><strong>{report.decision}</strong><span>{report.teacher} - {report.subject} - {report.className}</span><em>{report.prefectObservation}</em></p><time>{report.date}</time></article>)}</div>
}

function KpiGrid({ items, side }: { items: Array<{ icon: string; value: string; label: string; tone: string; delta?: string }>; side?: ReactNode }) {
  return (
    <section className={`kpi-grid kpi-${items.length}`}>
      {items.map((item) => <KpiCard key={item.label} {...item} />)}
      {side}
    </section>
  )
}

function KpiCard({ icon, value, label, tone, delta }: { icon: string; value: string; label: string; tone: string; delta?: string }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-head"><span><Icon name={icon} /></span><strong>{value}</strong></div>
      <p>{label}</p>
      <div className="kpi-line" />
      <Link to="/directeur/suivi-avancement">{delta || 'Voir détails'} <Icon name={delta?.startsWith('-') ? 'down' : 'arrow'} /></Link>
    </article>
  )
}

function ProgressRows({ rows }: { rows: Array<[string, number]> }) {
  return <div className="progress-rows">{rows.map(([label, value]) => <div key={label}><span>{label}</span><b><i style={{ width: `${value}%` }} /></b><strong>{value}%</strong></div>)}</div>
}

function AlertCard({ title = 'Alertes critiques' }: { title?: string }) {
  return <Card title={title} className="alert-card"><LinkRow to="/directeur/suivi-avancement">Voir toutes</LinkRow>{alerts.map((alert) => <div className="alert-row" key={alert.title}><Icon name="alert" /><p><strong>{alert.title}</strong><span>{alert.detail}</span></p><time>{alert.time}</time></div>)}</Card>
}

function DelayTable() {
  return <table><thead><tr><th>#</th><th>Enseignant</th><th>Matière</th><th>Classe</th><th>Retard</th><th>Statut</th></tr></thead><tbody>{subjects.slice(0, 5).map((item, index) => <tr key={item.name}><td>{index + 1}</td><td>{item.teacher}</td><td>{item.name}</td><td>{item.className}</td><td>{item.delay}</td><td><Badge status={index === 0 ? 'Critique' : 'En retard'} /></td></tr>)}</tbody></table>
}

function SubjectTable() {
  return <table><thead><tr><th>Matière</th><th>Programmes en cours</th><th>Chapitres totaux</th><th>Chapitres réalisés</th><th>Taux d'exécution</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{subjects.map((item) => <tr key={item.name}><td><SubjectIcon tone={item.color} />{item.name}</td><td>{item.programs}</td><td>{item.total}</td><td>{item.done}</td><td><MiniBar value={item.rate} tone={item.status} /> {item.rate}%</td><td><Badge status={item.status} /></td><td><button className="icon-button"><Icon name="eye" /></button></td></tr>)}</tbody></table>
}

function EvaluationTable() {
  return <table><thead><tr><th>Matière</th><th>Classe</th><th>Enseignant</th><th>Évaluation</th><th>Type</th><th>Date prévue</th><th>Date réalisée</th><th>Statut</th><th>Notes publiées</th><th>Actions</th></tr></thead><tbody>{evaluations.map((item) => <tr key={`${item.subject}-${item.className}`}><td><SubjectIcon tone="blue" />{item.subject}</td><td>{item.className}</td><td><Avatar name={item.teacher} small />{item.teacher}</td><td>{item.type === 'Interrogation' ? 'Interrogation orale' : item.type}</td><td><Badge status={item.type} /></td><td>{item.planned}</td><td>{item.done}</td><td><Badge status={item.status} /></td><td><span className={item.notes ? 'ok-dot' : 'bad-dot'}>{item.notes ? '✓' : '×'}</span></td><td><button className="icon-button"><Icon name="eye" /></button><button className="icon-button"><Icon name="more" /></button></td></tr>)}</tbody></table>
}

function ReportTable() {
  return <table><thead><tr><th>Type de rapport</th><th>Description</th><th>Données incluses</th><th>Période</th><th>Dernière génération</th><th>Actions</th></tr></thead><tbody>{reports.map((report) => <tr key={report.title}><td><SubjectIcon tone={report.color} />{report.title}</td><td>{report.desc}</td><td>{report.data.split('|').map((line) => <span className="data-line" key={line}>• {line}</span>)}</td><td><Badge status={report.period} /></td><td>{report.date}</td><td><button className="icon-button"><Icon name="eye" /></button><button className="icon-button red"><Icon name="pdf" /></button><button className="icon-button green"><Icon name="excel" /></button><button className="icon-button purple"><Icon name="print" /></button></td></tr>)}</tbody></table>
}

function BarChart() {
  return <div className="bar-chart">{[['1ère', 80], ['2ème', 72], ['3ème', 65], ['4ème', 58], ['5ème', 62], ['6ème', 75]].map(([label, value]) => <div key={label}><strong>{value}%</strong><span style={{ height: `${Number(value) * 1.75}px` }} /><em>{label}</em></div>)}</div>
}

function LineTrend() {
  return <div className="line-trend">{[52, 56, 59, 62, 63, 67].map((value, index) => <div key={index}><span>{value}%</span><b style={{ height: `${value}%` }} /></div>)}<em>Avr.</em><em>Mai</em><em>Juin</em><em>Juil.</em><em>Août</em><em>Sept.</em></div>
}

function RankList({ rows, good = false }: { rows: string[]; good?: boolean }) {
  return <ol className="rank-list">{rows.map((row, index) => { const [label, value] = row.replace(/ (\d+%)/, '|$1').split('|'); return <li key={row}><span>{index + 1}</span><strong>{label}</strong><em className={good ? 'good' : index < 2 ? 'bad' : ''}>{value}</em></li> })}</ol>
}

function CalendarCard() {
  const days = Array.from({ length: 35 }, (_, index) => index + 1)
  return <Card title="Calendrier des évaluations" className="calendar-card"><div className="calendar-legend"><span className="blue" />Contrôle mensuel <span className="purple" />Interrogation <span className="orange" />Examen trimestriel</div><h3>Septembre 2024</h3><div className="calendar-grid">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <b key={day}>{day}</b>)}{days.map((day) => <span key={day} className={day === 5 ? 'selected' : day % 7 === 2 ? 'marked' : ''}>{day <= 30 ? day : day - 30}</span>)}</div><LinkRow to="/directeur/calendrier">Voir tout le calendrier</LinkRow></Card>
}

function RightStack() {
  return <aside className="right-stack"><Card title="Calendrier pédagogique"><EventRows /></Card><Card title="Activité récente"><ActivityRows /></Card></aside>
}

function EventRows() {
  return <>{[['25 SEPT', 'Contrôle mensuel des programmes', "Aujourd'hui"], ['15 OCT', 'Inspection interne', '15 Oct. 2024'], ['02 DÉC', 'Réunion pédagogique', '02 Déc. 2024'], ['20 DÉC', 'Évaluation trimestrielle', '20 Déc. 2024']].map(([date, title, time]) => <div className="event-row" key={title}><span>{date}</span><strong>{title}</strong><time>{time}</time></div>)}</>
}

function ActivityRows() {
  return <>{['M. Jean Kabasele a terminé le chapitre 3 de Mathématiques - 5ème', 'Mme. Grace Mbuyi a justifié un retard en Français - 3ème', 'Nouveau programme ajouté : Chimie - 4ème', 'Évaluation mensuelle planifiée le 25 Sept. 2024'].map((text, index) => <div className="activity-row" key={text}><Icon name={index % 2 ? 'checkCircle' : 'calendar'} /><span>{text}</span><time>Il y a {index ? `${index} h` : '30 min'}</time></div>)}</>
}

function StudentBanner() {
  return <article className="student-banner"><strong>Chaque jour,</strong><span>on avance vers l’excellence !</span><div className="students-visual" /></article>
}

function PromoBand() {
  return <section className="promo-band"><div className="book-stack" /><p><strong>Notre objectif : une éducation de qualité pour un avenir meilleur.</strong><span>Avec CONTRÔLE PÉDAGOGIQUE, suivez, contrôlez et améliorez l’exécution des programmes scolaires en toute simplicité.</span></p><div className="flag-wave">★</div></section>
}

function InfoPanel() {
  return <Card className="info-panel"><h2><Icon name="info" /> Bon à savoir</h2><p>Un suivi régulier permet d’anticiper les retards et de garantir la réussite de tous les élèves.</p><div className="students-visual small" /></Card>
}

function ClassroomMini() {
  return <div className="classroom-mini"><span /></div>
}

function PrefectLayout({ title, subtitle, crumb, children }: { title: string; subtitle?: string; crumb?: string; children: ReactNode }) {
  return (
    <main className="director-shell prefect-shell">
      <aside className="director-sidebar prefect-sidebar">
        <Link className="director-brand teacher-brand" to="/prefet">
          <img src={brandLogo} alt="CONTRÔLE PÉDAGOGIQUE" />
          <span>Prefet des Etudes</span>
        </Link>
        <div className="teacher-profile"><Avatar name="Prefet Etudes" /><div><strong>M. Kalala</strong><span>Prefet des Etudes</span><small><i /> En ligne</small></div></div>
        <nav className="director-nav teacher-nav">
          {prefectNavItems.map((item) => (
            <NavLink key={item.label} to={item.to} end={item.to === '/prefet'} className={({ isActive }) => `director-nav-link${isActive ? ' active' : ''}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <b>{item.badge}</b>}
            </NavLink>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <section className="director-main">
        <header className="director-topbar teacher-topbar">
          <button className="hamburger" type="button" aria-label="Menu"><Icon name="menu" /></button>
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : <p>Accueil <span>›</span> {crumb}</p>}
          </div>
          <div className="period-filters period-filters-compact">
            <FilterBox icon="calendar" label="Annee scolaire" value="2024 - 2025" />
            <HeaderFeedDropdown icon="bell" title="Notifications" initialCount={5} items={headerNotifications} />
            <HeaderFeedDropdown icon="message" title="Messages" initialCount={2} items={headerMessages} />
            <UserMenu compact />
          </div>
        </header>
        <div className="director-content teacher-content">{children}</div>
        <TeacherFooter />
      </section>
    </main>
  )
}

function PrefectDashboard() {
  return (
    <>
      <TeacherStats items={[
        { icon: 'checkCircle', value: '18', label: 'Progressions a valider', detail: '8 urgentes aujourd hui', tone: 'blue' },
        { icon: 'book', value: '92', label: 'Programmes controles', detail: 'Toutes classes', tone: 'green' },
        { icon: 'users', value: '34', label: 'Enseignants suivis', detail: '5 en retard', tone: 'purple' },
        { icon: 'alert', value: '5', label: 'Alertes pedagogiques', detail: 'A traiter', tone: 'red' },
        { icon: 'chart', value: '76%', label: 'Execution globale', detail: '+4% ce mois', tone: 'cyan' },
      ]} />
      <section className="prefect-grid">
        <Card title="Lecons soumises aujourd hui" className="table-card span-2"><TodayReportsTable /></Card>
        <Card title="Controle des programmes"><Donut value={76} /><Legend rows={[['Conformes', 64, 'green'], ['En retard', 24, 'orange'], ['Critiques', 12, 'red']]} /></Card>
        <Card title="Alertes prioritaires"><PrefectAlertList compact /></Card>
        <Card title="Calendrier academique" className="span-2"><EventRows /></Card>
        <Card title="Messages recents"><PrefectMessageFeed /></Card>
      </section>
    </>
  )
}

function TodayReportsTable() {
  const [rows, setRows] = useState<UiLessonReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadToday() {
      try {
        const data = await reportsApi.getPendingPrefectReports()
        const today = localDisplayDate()
        setRows(data.filter((report) => report.date === today))
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    void loadToday()
  }, [])

  if (loading) return <div className="note-box"><Icon name="clock" /> Chargement...</div>
  if (!rows.length) return <div className="note-box"><Icon name="info" /> Aucun rapport soumis aujourd hui.</div>

  return <table><thead><tr><th>Enseignant</th><th>Classe</th><th>Matiere</th><th>Chapitre</th><th>Date</th><th>Statut</th></tr></thead><tbody>{rows.map((report) => <tr key={report.rawId}><td><Avatar name={report.teacher} small />{report.teacher}</td><td>{report.className}</td><td>{report.subject}</td><td>{report.chapter}</td><td>{report.date}</td><td><ReportStatusBadge status={report.status} /></td></tr>)}</tbody></table>
}

function PrefectValidations() {
  const [rows, setRows] = useState(prefectLessonSubmissions)
  const [selectedId, setSelectedId] = useState(prefectLessonSubmissions[0].id)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const filteredRows = rows.filter((row) => {
    const matchesSearch = `${row.teacher} ${row.subject} ${row.className} ${row.chapter}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'Tous' || row.status === statusFilter
    return matchesSearch && matchesStatus
  })
  const selected = rows.find((row) => row.id === selectedId) || rows[0]

  function decide(status: 'Valide' | 'Rejete') {
    // Regle metier: chaque decision du Prefet doit conserver une observation pour tracer le controle pedagogique.
    setRows((current) => current.map((row) => row.id === selected.id ? { ...row, status } : row))
    setNotice(status === 'Valide' ? 'Lecon validee et retour envoye a l enseignant.' : 'Lecon rejetee avec observation envoyee a l enseignant.')
  }

  return (
    <>
      <TeacherStats items={[
        { icon: 'clipboard', value: '18', label: 'Lecons recues', detail: 'Cette semaine', tone: 'blue' },
        { icon: 'clock', value: '8', label: 'En attente', detail: 'A controler', tone: 'orange' },
        { icon: 'checkCircle', value: '7', label: 'Validees', detail: 'Retour transmis', tone: 'green' },
        { icon: 'alert', value: '3', label: 'A corriger', detail: 'Observation requise', tone: 'red' },
        { icon: 'chart', value: '86%', label: 'Conformite', detail: 'Cahier + programme', tone: 'purple' },
      ]} />
      {notice && <div className="success-toast"><Icon name="checkCircle" /> {notice}</div>}
      <section className="prefect-review-layout">
        <Card title="Lecons soumises par les enseignants" className="table-card">
          <div className="toolbar-row">
            <div className="filters">
              <label><span>Statut</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Tous</option><option>En attente</option><option>Valide</option><option>Rejete</option></select></label>
              <label className="search-field"><span>Recherche</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une progression..." /><Icon name="search" /></label>
            </div>
          </div>
          <PrefectLessonProgressionTable rows={filteredRows} selectedId={selected.id} onSelect={setSelectedId} />
        </Card>
        <Card title="Controle pedagogique detaille">
          <article className="prefect-review-card">
            <header>
              <Avatar name={selected.teacher} />
              <div><strong>{selected.teacher}</strong><span>{selected.subject} - {selected.className}</span></div>
              <Badge status={selected.status} />
            </header>
            <dl>
              <dt>Lecon declaree</dt><dd>{selected.chapter}<br /><span>{selected.subChapter}</span></dd>
              <dt>Horaire</dt><dd>{selected.date} - {selected.time}</dd>
              <dt>Attendu programme</dt><dd>{selected.expected}</dd>
              <dt>Retard detecte</dt><dd>{selected.delay}</dd>
            </dl>
            <div className="prefect-content-check">
              <strong>Contenu dispense</strong>
              <p>{selected.content}</p>
            </div>
            <form className="prefect-observation-form">
              <label>Observation du Prefet<textarea defaultValue="Contenu coherent avec le cahier de textes. Preciser les exercices corriges lors de la prochaine soumission." /></label>
              <div className="prefect-decision-actions">
                <button type="button" className="secondary-button" onClick={() => decide('Rejete')}><Icon name="alert" /> Rejeter avec observation</button>
                <button type="button" className="blue-button" onClick={() => decide('Valide')}><Icon name="checkCircle" /> Valider la lecon</button>
              </div>
            </form>
          </article>
        </Card>
      </section>
    </>
  )
}

function PrefectLessonProgressionTable({ rows, selectedId, onSelect }: { rows: typeof prefectLessonSubmissions; selectedId: number; onSelect: (id: number) => void }) {
  return <table><thead><tr><th>Enseignant</th><th>Classe</th><th>Matiere</th><th>Chapitre</th><th>Date</th><th>Statut</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'prefect-selected-row' : ''} onClick={() => onSelect(row.id)}><td><Avatar name={row.teacher} small />{row.teacher}</td><td>{row.className}</td><td>{row.subject}</td><td><strong>{row.chapter}</strong><span className="data-line">{row.subChapter}</span></td><td>{row.date}</td><td><Badge status={row.status} /></td><td><button className="decision-button blue" type="button" onClick={(event) => { event.stopPropagation(); window.location.assign(`/prefet/progressions/${row.id}`) }}>Visualiser</button></td></tr>)}</tbody></table>
}

function PrefectProgramControl() {
  return (
    <>
      <TeacherStats items={[
        { icon: 'book', value: '92', label: 'Programmes suivis', detail: 'Toutes classes', tone: 'blue' },
        { icon: 'checkCircle', value: '64%', label: 'Conformes', detail: 'Selon repartition', tone: 'green' },
        { icon: 'clock', value: '24%', label: 'Retards', detail: 'A rattraper', tone: 'orange' },
        { icon: 'alert', value: '12%', label: 'Critiques', detail: 'Controle requis', tone: 'red' },
        { icon: 'chart', value: '76%', label: 'Execution', detail: 'Global etablissement', tone: 'purple' },
      ]} />
      <section className="prefect-grid">
        <Card title="Controle par matiere et classe" className="table-card span-2">
          <div className="toolbar-row"><Filters labels={['Classe', 'Matiere', 'Statut', 'Mois']} search="Rechercher..." /><button className="blue-button" type="button"><Icon name="chart" /> Generer controle</button></div>
          <SubjectTable />
        </Card>
        <Card title="Ecarts detectes"><PrefectDelayCards /></Card>
        <Card title="Taux d execution"><Donut value={76} label="Execution" /><Legend rows={[['Cahier conforme', 70, 'green'], ['Lecons non validees', 18, 'orange'], ['Retards critiques', 12, 'red']]} /></Card>
        <Card title="Actions rapides" className="span-2"><PrefectActionStrip /></Card>
      </section>
    </>
  )
}

function PrefectTeachersFollowUp() {
  return <PrefectStandardPage title="Suivi des enseignants" action="Notifier enseignants"><PrefectTeacherTable /></PrefectStandardPage>
}

function PrefectTextBook() {
  return (
    <section className="prefect-grid">
      <Card title="Cahier de textes numerique" className="table-card span-2">
        <div className="toolbar-row"><Filters labels={['Classe', 'Matiere', 'Statut']} search="Rechercher une seance..." /><button className="blue-button" type="button"><Icon name="excel" /> Exporter</button></div>
        <TextBookHistoryTable />
      </Card>
      <Card title="Controle automatique"><PrefectAutoControl /></Card>
      <Card title="Lecons a verifier" className="span-2"><PrefectLessonTable rows={prefectLessonSubmissions.slice(0, 3)} /></Card>
      <Card title="Observations recentes"><PrefectObservationList /></Card>
    </section>
  )
}

function PrefectEvaluations() {
  return <PrefectStandardPage title="Evaluations" action="Planifier evaluation"><EvaluationTable /></PrefectStandardPage>
}

function PrefectReports() {
  const [observation, setObservation] = useState('Conforme au programme prévu. Validation recommandée.')
  const [reports, setReports] = useState<UiLessonReport[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reportSearch, setReportSearch] = useState('')
  const [reportStatus, setReportStatus] = useState('Tous')
  const selectedReport = reports.find((report) => report.rawId === selectedId) || reports[0]
  const filteredReports = reports.filter((report) => {
    const matchesSearch = `${report.teacher} ${report.className} ${report.subject} ${report.chapter} ${report.status}`.toLowerCase().includes(reportSearch.toLowerCase())
    const matchesStatus = reportStatus === 'Tous' || report.status === reportStatus
    return matchesSearch && matchesStatus
  })

  function exportReports() {
    const header = ['id', 'date', 'enseignant', 'classe', 'matiere', 'chapitre', 'statut', 'observation']
    const rows = filteredReports.map((report) => [report.id, report.date, report.teacher, report.className, report.subject, report.chapter, report.status, report.prefectObservation])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'rapports-prefet.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function loadReports() {
    setLoading(true)
    setError('')

    try {
      const data = await reportsApi.getPendingPrefectReports()
      setReports(data)
      setSelectedId((current) => data.find((report) => report.rawId === current)?.rawId || data[0]?.rawId || '')
    } catch (apiError) {
      setError(apiError instanceof TypeError ? 'Connexion backend indisponible.' : 'Impossible de charger les rapports.')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  async function decideReport(decision: PrefectDecision, reportId = selectedReport?.rawId) {
    const targetReport = reports.find((report) => report.rawId === reportId) || selectedReport
    if (!targetReport) return
    setLoading(true)
    setError('')
    setNotice('')

    try {
      await reportsApi.decidePrefectReport(targetReport.rawId, decision, observation)
      setNotice('Décision enregistrée.')
      await loadReports()
    } catch (apiError) {
      if (apiError instanceof TypeError) {
        setError('Connexion backend indisponible. Décision non enregistrée.')
      } else {
        setError('Impossible d’enregistrer la décision.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TeacherStats items={[
        { icon: 'file', value: '18', label: 'Rapports reçus', detail: 'Aujourd’hui', tone: 'blue' },
        { icon: 'clock', value: '4', label: 'En attente', detail: 'À décider', tone: 'orange' },
        { icon: 'checkCircle', value: '12', label: 'Validés', detail: 'Par le Préfet', tone: 'green' },
        { icon: 'alert', value: '2', label: 'Rejetés', detail: 'Justification requise', tone: 'red' },
        { icon: 'message', value: '3', label: 'Corrections', detail: 'Demandées', tone: 'purple' },
      ]} />
      {notice && <div className="success-toast"><Icon name="checkCircle" /> {notice}</div>}
      <section className="prefect-report-grid">
        <Card title="Rapports reçus des enseignants" className="table-card">
          <div className="toolbar-row">
            <div className="filters">
              <label><span>Statut</span><select value={reportStatus} onChange={(event) => setReportStatus(event.target.value)}><option>Tous</option><option>Soumis</option><option>Valide</option><option>Rejete</option><option>Correction demandee</option></select></label>
              <label className="search-field"><span>Recherche</span><input value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} placeholder="Rechercher un rapport..." /><Icon name="search" /></label>
            </div>
            <button className="secondary-button" type="button" onClick={exportReports}><Icon name="excel" /> Exporter</button>
          </div>
          {loading && <div className="note-box"><Icon name="clock" /> Chargement des rapports...</div>}
          {error && <div className="login-error">{error}</div>}
          {!loading && !filteredReports.length && <div className="note-box"><Icon name="info" /> Aucun rapport réel reçu.</div>}
          <PrefectDailyValidationTable reports={filteredReports} selectedId={selectedId} onSelect={setSelectedId} onDecision={(reportId, decision) => { setSelectedId(reportId); void decideReport(decision, reportId) }} />
        </Card>
        <aside className="right-column">
          <Card title="Détail du rapport">
            {selectedReport && <article className="report-detail-card">
              <header><Avatar name={selectedReport.teacher} /><div><strong>{selectedReport.teacher}</strong><span>{selectedReport.className} - {selectedReport.subject}</span></div><ReportStatusBadge status={selectedReport.status} /></header>
              <dl>
                <dt>Chapitre</dt><dd>{selectedReport.chapter}</dd>
                <dt>Sous-chapitre</dt><dd>{selectedReport.subChapter}</dd>
                <dt>Date</dt><dd>{selectedReport.date}</dd>
                <dt>Périodes</dt><dd>{selectedReport.periods}</dd>
                <dt>Résumé</dt><dd>{selectedReport.summary}</dd>
                <dt>Objectifs</dt><dd>{selectedReport.objectives || 'Non renseigné'}</dd>
                <dt>Exercices</dt><dd>{selectedReport.exercises || 'Non renseigné'}</dd>
                <dt>Devoirs</dt><dd>{selectedReport.homework || 'Non renseigné'}</dd>
                <dt>Observations</dt><dd>{selectedReport.observations || 'Aucune'}</dd>
              </dl>
            </article>}
          </Card>
          <Card title="Observation du Préfet">
            <form className="prefect-observation-form">
              <label>Rapport sélectionné<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{reports.map((report) => <option key={report.rawId} value={report.rawId}>{report.id} - {report.teacher} - {report.className}</option>)}</select></label>
              <label>Observation<textarea value={observation} onChange={(event) => setObservation(event.target.value)} /></label>
              <div className="prefect-decision-actions visible-actions">
                <button className="decision-button green" type="button" disabled={loading} onClick={() => void decideReport('validated')}><Icon name="checkCircle" /> Valider</button>
                <button className="decision-button blue" type="button" disabled={loading} onClick={() => void decideReport('correction_requested')}><Icon name="message" /> Demander correction</button>
                <button className="decision-button red" type="button" disabled={loading} onClick={() => void decideReport('rejected')}><Icon name="alert" /> Rejeter</button>
              </div>
            </form>
          </Card>
          <Card title="Historique des décisions"><DecisionHistoryList reports={reports} /></Card>
          <Card title="Synthèse actuelle"><Donut value={67} label="Validés" /><Legend rows={[['Validés', 67, 'green'], ['Soumis', 17, 'blue'], ['Corrections', 8, 'orange'], ['Rejets', 8, 'red']]} /></Card>
        </aside>
      </section>
    </>
  )
}

function PrefectDailyValidationTable({ reports = [], selectedId, onSelect, onDecision }: { reports?: UiLessonReport[]; selectedId?: string; onSelect?: (id: string) => void; onDecision?: (id: string, decision: PrefectDecision) => void }) {
  return <table><thead><tr><th>Rapport</th><th>Enseignant</th><th>Classe</th><th>Matière</th><th>Chapitre</th><th>Date soumission</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id} className={report.rawId === selectedId ? 'prefect-selected-row' : ''} onClick={() => { onSelect?.(report.rawId); window.location.assign(`/prefet/rapports/${report.rawId}`) }}><td>{report.id}</td><td><Avatar name={report.teacher} small />{report.teacher}</td><td>{report.className}</td><td>{report.subject}</td><td><strong>{report.chapter}</strong><span className="data-line">{report.subChapter}</span></td><td>{report.date}</td><td><ReportStatusBadge status={report.status} /></td><td><div className="validation-actions visible-actions"><button className="decision-button green" type="button" onClick={(event) => { event.stopPropagation(); onDecision?.(report.rawId, 'validated') }}>Valider</button><button className="decision-button blue" type="button" onClick={(event) => { event.stopPropagation(); onDecision?.(report.rawId, 'correction_requested') }}>Correction</button><button className="decision-button red" type="button" onClick={(event) => { event.stopPropagation(); onDecision?.(report.rawId, 'rejected') }}>Rejeter</button></div></td></tr>)}</tbody></table>
}

function ReportDetailBlock({ report }: { report: UiLessonReport }) {
  return <article className="report-detail-card"><header><Avatar name={report.teacher} /><div><strong>{report.teacher}</strong><span>{report.className} - {report.subject}</span></div><ReportStatusBadge status={report.status} /></header><dl><dt>Chapitre</dt><dd>{report.chapter}</dd><dt>Sous-chapitre</dt><dd>{report.subChapter}</dd><dt>Date</dt><dd>{report.date}</dd><dt>Périodes</dt><dd>{report.periods}</dd><dt>Résumé</dt><dd>{report.summary}</dd><dt>Objectifs</dt><dd>{report.objectives || 'Non renseigné'}</dd><dt>Exercices</dt><dd>{report.exercises || 'Non renseigné'}</dd><dt>Devoirs</dt><dd>{report.homework || 'Non renseigné'}</dd><dt>Observations</dt><dd>{report.observations || 'Aucune'}</dd><dt>Action Préfet</dt><dd>{report.decision}</dd><dt>Observation Préfet</dt><dd>{report.prefectObservation}</dd></dl></article>
}

function PrefectReportDetail() {
  const reportId = window.location.pathname.split('/').pop() || ''
  const [report, setReport] = useState<UiLessonReport | null>(null)
  const [observation, setObservation] = useState('Observation du Préfet.')
  const [message, setMessage] = useState('')

  async function load() {
    try {
      const supervision = await reportsApi.getSupervisionReports()
      setReport(supervision.reports.find((item) => item.rawId === reportId) || null)
    } catch {
      setReport(null)
    }
  }

  useEffect(() => { void load() }, [reportId])

  async function decide(decision: PrefectDecision) {
    if (!report) return
    try {
      await reportsApi.decidePrefectReport(report.rawId, decision, observation)
      setMessage('Décision enregistrée.')
      await load()
    } catch {
      setMessage('Connexion backend indisponible. Décision non enregistrée.')
    }
  }

  return <section className="prefect-report-grid"><Card title="Détail du rapport" className="span-2">{report ? <ReportDetailBlock report={report} /> : <div className="note-box">Rapport réel introuvable.</div>}</Card><Card title="Actions"><form className="prefect-observation-form"><label>Observation<textarea value={observation} onChange={(event) => setObservation(event.target.value)} /></label><div className="visible-actions"><button className="decision-button green" type="button" disabled={!report} onClick={() => void decide('validated')}>Valider</button><button className="decision-button blue" type="button" disabled={!report} onClick={() => void decide('correction_requested')}>Demander correction</button><button className="decision-button red" type="button" disabled={!report} onClick={() => void decide('rejected')}>Rejeter</button></div></form>{message && <div className="success-toast"><Icon name="checkCircle" /> {message}</div>}</Card></section>
}

function SupervisionDetail() {
  const reportId = window.location.pathname.split('/').pop() || ''
  const [report, setReport] = useState<UiLessonReport | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supervision = await reportsApi.getSupervisionReports()
        setReport(supervision.reports.find((item) => item.rawId === reportId) || null)
      } catch {
        setReport(null)
      }
    }

    void load()
  }, [reportId])

  return <section className="content-with-side"><div><Card title="Détail supervision du rapport">{report ? <ReportDetailBlock report={report} /> : <div className="note-box">Rapport réel introuvable.</div>}</Card></div><aside className="right-column"><Card title="Action récente"><DecisionHistoryList reports={report ? [report] : []} /></Card></aside></section>
}

function PrefectProgressionDetail() {
  const progressionId = window.location.pathname.split('/').pop() || ''
  const progression = prefectLessonSubmissions.find((item) => String(item.id) === progressionId) || prefectLessonSubmissions[0]

  return <section className="prefect-report-grid"><Card title="Détail progression" className="span-2"><article className="report-detail-card"><header><Avatar name={progression.teacher} /><div><strong>{progression.teacher}</strong><span>{progression.className} - {progression.subject}</span></div><Badge status={progression.status} /></header><dl><dt>Chapitre</dt><dd>{progression.chapter}</dd><dt>Sous-chapitre</dt><dd>{progression.subChapter}</dd><dt>Date</dt><dd>{progression.date}</dd><dt>Périodes</dt><dd>{progression.time}</dd><dt>Statut</dt><dd>{progression.status}</dd><dt>Observations</dt><dd>{progression.content}</dd></dl></article></Card></section>
}

function PrefectCalendar() {
  return <section className="prefect-grid"><Card title="Calendrier academique" className="calendar-card span-2"><CalendarCard /></Card><Card title="Evenements pedagogiques"><EventRows /></Card><Card title="Legende"><Legend rows={[['Evaluations', 38, 'blue'], ['Reunions', 22, 'green'], ['Alertes', 12, 'red'], ['Rapports', 28, 'purple']]} /></Card></section>
}

function PrefectAlerts() {
  return <PrefectStandardPage title="Alertes pedagogiques" action="Tout marquer traite"><PrefectAlertTable /></PrefectStandardPage>
}

function PrefectMessages() {
  const [recipient, setRecipient] = useState('Tous les enseignants')
  const [subject, setSubject] = useState('Observation pedagogique')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setError('')
    setSending(true)

    try {
      await messagesApi.broadcast({
        recipient: recipient === 'Tous les enseignants' ? 'all_teachers' : 'teachers',
        title: subject,
        message: message || subject,
      })
      setNotice('Message envoyé aux enseignants.')
      setMessage('')
    } catch {
      setError('Message non envoyé. Vérifiez la connexion au backend.')
    } finally {
      setSending(false)
    }
  }

  return <section className="prefect-message-layout"><Card title="Boite de reception"><PrefectMessageFeed detailed /></Card><Card title="Nouveau message"><form className="textbook-form" onSubmit={sendMessage}><label>Destinataire<select value={recipient} onChange={(event) => setRecipient(event.target.value)}><option>Enseignants en retard</option><option>Tous les enseignants</option><option>Direction</option></select></label><label>Objet<input value={subject} onChange={(event) => setSubject(event.target.value)} /></label><label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ecrire un message..." /></label>{notice && <div className="note-box"><Icon name="checkCircle" /> {notice}</div>}{error && <div className="login-error">{error}</div>}<button className="blue-button" type="submit" disabled={sending}><Icon name="message" /> {sending ? 'Envoi...' : 'Envoyer'}</button></form></Card></section>
}

function PrefectSettings() {
  return <section className="prefect-grid"><Card title="Parametres pedagogiques" className="span-2"><form className="progress-form"><div className="form-grid three"><label>Delai validation<select><option>48 heures</option></select></label><label>Seuil retard<input defaultValue="2 chapitres" /></label><label>Notifications<select><option>Actives</option></select></label></div><label>Instructions pedagogiques<textarea defaultValue="Verifier la conformite entre cahier de textes, repartition annuelle et progression declaree." /></label><button className="blue-button" type="button">Enregistrer</button></form></Card><InfoPanel /></section>
}

function PrefectStandardPage({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return (
    <>
      <TeacherStats items={[
        { icon: 'clipboard', value: '128', label: 'Elements suivis', detail: title, tone: 'blue' },
        { icon: 'checkCircle', value: '84', label: 'Conformes', detail: 'A jour', tone: 'green' },
        { icon: 'clock', value: '23', label: 'En attente', detail: 'A verifier', tone: 'orange' },
        { icon: 'alert', value: '8', label: 'Critiques', detail: 'Action requise', tone: 'red' },
        { icon: 'chart', value: '76%', label: 'Taux global', detail: 'Mois courant', tone: 'purple' },
      ]} />
      <Card title={title} className="table-card">
        <div className="toolbar-row"><Filters labels={['Classe', 'Matiere', 'Statut', 'Mois']} search="Rechercher..." /><button className="blue-button" type="button"><Icon name="checkCircle" /> {action}</button></div>
        {children}
      </Card>
    </>
  )
}

function TeacherLayout({ title, subtitle, crumb, children }: { title: string; subtitle?: string; crumb?: string; children: ReactNode }) {
  return (
    <main className="director-shell teacher-shell">
      <aside className="director-sidebar teacher-sidebar">
        <Link className="director-brand teacher-brand" to="/enseignant">
          <img src={brandLogo} alt="CONTRÔLE PÉDAGOGIQUE" />
          <span>Portail Enseignant</span>
        </Link>
        <div className="teacher-profile">
          <Avatar name="Jean Kabasele" />
          <div><strong>Jean Kabasele</strong><span>Enseignant</span><small><i /> En ligne</small></div>
        </div>
        <nav className="director-nav teacher-nav">
          {teacherNavItems.map((item) => (
            <NavLink key={item.label} to={item.to} end={item.to === '/enseignant'} className={({ isActive }) => `director-nav-link${isActive ? ' active' : ''}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <b>{item.badge}</b>}
            </NavLink>
          ))}
        </nav>
        <TeacherLogoutButton />
      </aside>
      <section className="director-main">
        <header className="director-topbar teacher-topbar">
          <button className="hamburger" type="button" aria-label="Menu"><Icon name="menu" /></button>
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : <p>Accueil <span>›</span> {crumb}</p>}
          </div>
          <div className="period-filters period-filters-compact">
            <FilterBox label="Année scolaire" value="2024 - 2025" />
            <HeaderFeedDropdown icon="bell" title="Notifications" initialCount={3} items={headerNotifications} />
            <HeaderFeedDropdown icon="message" title="Messages" initialCount={2} items={headerMessages} />
            <UserMenu compact />
          </div>
        </header>
        <div className="director-content teacher-content">{children}</div>
        <TeacherFooter />
      </section>
    </main>
  )
}

function TeacherDashboard() {
  return (
    <>
      <TeacherStats items={[
        { icon: 'book', value: '2', label: 'Mes matières', detail: 'Mathématiques, Physique-Chimie', tone: 'blue' },
        { icon: 'users', value: '2', label: 'Classes', detail: '5ème A, 6ème B', tone: 'green' },
        { icon: 'clipboard', value: 'Chapitre 5', label: 'Chapitre en cours', detail: 'Fractions (5ème A)', tone: 'purple' },
        { icon: 'checkCircle', value: '8 / 10', label: 'Progressions validées', detail: '80% validées', tone: 'orange' },
        { icon: 'chart', value: '87%', label: 'Taux de conformité', detail: 'Très bon', tone: 'cyan' },
      ]} />
      <section className="teacher-dashboard-grid">
        <Card title="Mes programmes" className="table-card span-2"><LinkRow to="/enseignant/mes-programmes">Voir tout</LinkRow><TeacherProgramRows /></Card>
        <Card title="Ma progression globale"><Donut value={87} /><Legend rows={[['Chapitres réalisés', 87, 'green'], ['En cours', 13, 'orange'], ['Non commencés', 0, 'red']]} /><div className="total-row"><span>Total chapitres</span><strong>23</strong></div></Card>
        <Card title="Activités du jour" className="teacher-day-card"><ActivityTimeline /></Card>
        <Card title="Cahier de textes - Dernières séances" className="table-card span-2"><LinkRow to="/enseignant/cahier-texte">Voir tout</LinkRow><TeacherRecentTextBook /></Card>
        <Card title="Évaluations à venir"><MiniList rows={['Contrôle Mathématiques|5ème A|15/05/2024', 'Interrogation Physique-Chimie|6ème B|16/05/2024', 'Test Mathématiques|6ème B|20/05/2024']} icon="clipboard" /></Card>
        <aside className="teacher-side-stack"><Card title="Messages récents"><MiniList rows={['Préfet des Études|Validation de votre progression du chapitre 4|Nouveau', 'Directeur des Études|Réunion pédagogique le 10 Mai 2024|01/05/2024', 'Administration|Merci de mettre à jour vos cahiers|30/04/2024']} icon="message" /></Card><Card title="Documents récents"><MiniList rows={['Support - Fractions.pdf|02/05/2024', 'Exercices - Nombres décimaux.docx|02/05/2024', 'Correction - Devoir 4.pdf|30/04/2024']} icon="file" /></Card></aside>
        <Card title="Mes classes" className="span-2"><div className="class-cards"><TeacherClassCard name="5ème A" count="38 élèves" next="03/05/2024 à 07:30" subject="Mathématiques" /><TeacherClassCard name="6ème B" count="36 élèves" next="03/05/2024 à 09:00" subject="Mathématiques" /></div></Card>
      </section>
    </>
  )
}

function TeacherPrograms() {
  return (
    <>
      <TeacherStats items={[
        { icon: 'book', value: '4', label: 'Programmes attribués', detail: 'Toutes matières confondues', tone: 'blue' },
        { icon: 'checkCircle', value: '17 / 25', label: 'Chapitres réalisés', detail: '68% de chapitres terminés', tone: 'green' },
        { icon: 'clock', value: '6 / 25', label: 'Chapitres restants', detail: 'À enseigner', tone: 'orange' },
        { icon: 'chart', value: '68%', label: "Taux d'avancement global", detail: 'Bonne progression', tone: 'purple' },
        { icon: 'calendar', value: 'Mai 2024', label: 'Période en cours', detail: '3ème période', tone: 'cyan' },
      ]} />
      <div className="teacher-published-banner"><Icon name="checkCircle" /> Repartition annuelle publiee : Mathematiques - 5eme A, 18 chapitres, 36 semaines ouvrables, disponible pour la progression.</div>
      <section className="teacher-two-col">
        <Card title="Détail de mes programmes" className="table-card">
          <Filters labels={['Classe', 'Matière']} action="Actualiser" />
          <ProgramAccordion />
        </Card>
        <aside className="right-column">
          <Card title="Résumé du programme sélectionné"><ProgramSummary /></Card>
          <Card title="Calendrier prévisionnel (5ème A)" className="table-card"><PlanningTable /></Card>
          <InfoPanel />
        </aside>
      </section>
    </>
  )
}

function TeacherProgress() {
  const [history, setHistory] = useState(initialProgressHistory)
  const [message, setMessage] = useState('')

  function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHistory((current) => [
      { date: '03/05/2024', subject: 'Mathématiques', className: '5ème A', chapter: 'Ch. 4 / 4.2 : Addition et soustraction des fractions', status: 'En attente' },
      ...current,
    ])
    setMessage('Progression envoyée au Préfet pour validation')
  }

  return (
    <>
      <TeacherStats items={[
        { icon: 'book', value: '4', label: 'Programmes attribués', detail: 'Toutes matières confondues', tone: 'blue' },
        { icon: 'checkCircle', value: '17', label: 'Chapitres soumis', detail: 'Ce trimestre', tone: 'green' },
        { icon: 'clock', value: '12', label: 'En attente de validation', detail: 'Par le Préfet des Études', tone: 'orange' },
        { icon: 'shield', value: '5', label: 'Validés', detail: 'Ce trimestre', tone: 'purple' },
        { icon: 'chart', value: '70%', label: "Taux d'avancement global", detail: 'Bonne progression', tone: 'cyan' },
      ]} />
      {message && <div className="success-toast"><Icon name="checkCircle" /> {message}</div>}
      <section className="teacher-two-col progress-layout">
        <Card title="1. Déclarer une leçon / chapitre réalisé">
          <TeacherProgressForm onSubmit={submitProgress} />
        </Card>
        <Card title="2. Historique de mes progressions" className="table-card">
          <div className="status-filter"><select><option>Tous les statuts</option></select></div>
          <ProgressHistoryTable rows={history} />
          <LinkRow to="/enseignant/ma-progression">Voir toutes mes progressions</LinkRow>
        </Card>
      </section>
      <HowItWorks />
    </>
  )
}

function TeacherTextBook() {
  const [message, setMessage] = useState('')
  const [reports, setReports] = useState<UiLessonReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reference = reports[0]

  async function loadTeacherReports() {
    setLoading(true)
    setError('')

    try {
      const data = await reportsApi.getTeacherReports()
      setReports(data)
    } catch (apiError) {
      setError(apiError instanceof TypeError ? 'Connexion backend indisponible.' : 'Impossible de charger vos rapports.')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTeacherReports()
  }, [])

  async function submitDailyReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const reference = reports[0]
    if (!reference) {
      setError('Aucun programme réel disponible pour soumettre un rapport.')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await reportsApi.createTeacherReport({
        program_distribution_id: reference.programDistributionId,
        teacher_assignment_id: reference.teacherAssignmentId,
        actual_date: String(formData.get('actual_date') || new Date().toISOString().slice(0, 10)),
        actual_periods: Number(formData.get('actual_periods') || 1),
        lesson_summary: String(formData.get('lesson_summary') || ''),
        objectives_achieved: String(formData.get('objectives_achieved') || ''),
        exercises_given: String(formData.get('exercises_given') || ''),
        homework_given: String(formData.get('homework_given') || ''),
        observations: String(formData.get('observations') || ''),
      })
      setMessage('Rapport quotidien soumis au Préfet / Directeur des Études')
      await loadTeacherReports()
    } catch (apiError) {
      if (apiError instanceof TypeError) {
        setError('Connexion backend indisponible. Rapport non soumis.')
      } else {
        setError('Impossible de soumettre le rapport.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TeacherStats items={[
        { icon: 'calendar', value: localDisplayDate(), label: 'Date du jour', detail: 'Rapport à soumettre', tone: 'blue' },
        { icon: 'book', value: reference?.chapter || 'Aucun', label: 'Programme reçu', detail: reference ? `${reference.className} - ${reference.subject}` : 'Aucune donnée réelle', tone: 'purple' },
        { icon: 'clock', value: String(reference?.periods || 0), label: 'Périodes réalisées', detail: 'Dernier rapport réel', tone: 'orange' },
        { icon: 'checkCircle', value: String(reports.filter((report) => report.status === 'Valide').length), label: 'Rapports validés', detail: 'Historique réel', tone: 'green' },
        { icon: 'alert', value: String(reports.filter((report) => report.status === 'Correction demandee').length), label: 'Correction demandée', detail: 'Historique réel', tone: 'red' },
      ]} />
      {message && <div className="success-toast"><Icon name="checkCircle" /> {message}</div>}
      {error && <div className="login-error">{error}</div>}
      <section className="teacher-two-col">
        <div>
          <Card title="Rapport Quotidien de Cours / Pointage">
            <form className="textbook-form" onSubmit={submitDailyReport}>
              <div className="form-grid two"><label>Programme reçu<input value={reference?.program || 'Aucun programme réel disponible'} readOnly /></label><label>Date du jour<input name="actual_date" type="date" defaultValue={localDateInputValue()} /></label></div>
              <div className="form-grid three"><label>Classe<input value={reference?.className || ''} readOnly /></label><label>Matière<input value={reference?.subject || ''} readOnly /></label><label>Nombre de périodes réalisées<input name="actual_periods" type="number" min="0" defaultValue={reference?.periods || 1} /></label></div>
              <div className="form-grid two"><label>Chapitre prévu<input value={reference?.chapter || ''} readOnly /></label><label>Sous-chapitre prévu<input value={reference?.subChapter || ''} readOnly /></label></div>
              <label>Résumé du cours enseigné<textarea name="lesson_summary" placeholder="Saisir le résumé réel du cours..." /></label>
              <div className="form-grid two"><label>Objectifs atteints<textarea name="objectives_achieved" placeholder="Saisir les objectifs atteints..." /></label><label>Observations<textarea name="observations" placeholder="Saisir les observations..." /></label></div>
              <div className="form-grid two"><label>Exercices donnés<textarea name="exercises_given" placeholder="Saisir les exercices donnés..." /></label><label>Devoirs donnés<textarea name="homework_given" placeholder="Saisir les devoirs donnés..." /></label></div>
              <div className="form-actions"><button type="button" className="secondary-button"><Icon name="file" /> Enregistrer brouillon</button><button type="submit" className="blue-button" disabled={loading || !reference}><Icon name="arrow" /> {loading ? 'Chargement...' : 'Soumettre le rapport'}</button></div>
            </form>
          </Card>
          <div className="note-box teacher-note"><Icon name="info" /> Le rapport quotidien sert au pointage pédagogique et à la validation du Préfet / Directeur des Études.</div>
        </div>
        <aside className="right-column textbook-side">
          <Card title="Historique de mes rapports" className="table-card">{loading && <div className="note-box"><Icon name="clock" /> Chargement...</div>}<TeacherDailyReportHistory rows={reports} /></Card>
          <Card title="Programme attendu"><div className="control-box"><span>Chapitre prévu : <b>{reference?.chapter || 'Aucune donnée réelle'}</b></span><span>Sous-chapitre prévu : <b>{reference?.subChapter || 'Aucune donnée réelle'}</b></span><strong><Icon name="checkCircle" /> Données backend</strong><p>{reference ? 'Le formulaire reprend le dernier programme réel reçu.' : 'Aucun rapport réel disponible.'}</p></div></Card>
          <Card title="Calendrier de cette semaine"><WeekGrid /></Card>
        </aside>
      </section>
    </>
  )
}

function TeacherDailyReportHistory({ rows = [] }: { rows?: UiLessonReport[] }) {
  if (!rows.length) return <div className="note-box"><Icon name="info" /> Aucun rapport soumis</div>
  return <table><thead><tr><th>Date</th><th>Classe</th><th>Matière</th><th>Chapitre</th><th>Périodes</th><th>Statut</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.date}</td><td>{row.className}</td><td>{row.subject}</td><td>{row.chapter}</td><td>{row.periods}</td><td><ReportStatusBadge status={row.status} /></td></tr>)}</tbody></table>
}

function TextBookHistoryTable() {
  return <table><thead><tr><th>Date</th><th>Classe</th><th>Matière</th><th>Sujet</th><th>Statut</th><th>Action</th></tr></thead><tbody>{textBookRows.map((row) => <tr key={`${row[0]}-${row[1]}-${row[4]}`}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><Badge status={row[4]} /></td><td><button className="icon-button"><Icon name="eye" /></button></td></tr>)}</tbody></table>
}

function LogoutButton() {
  function handleLogout() {
    void authApi.logout()
  }

  return <button className="logout-card" type="button" onClick={handleLogout}><Icon name="login" /> Déconnexion <Icon name="chevron" /></button>
}

function TeacherLogoutButton() {
  function handleLogout() {
    void authApi.logout()
  }

  return <button className="logout-card" type="button" onClick={handleLogout}><Icon name="login" /> Deconnexion <Icon name="chevron" /></button>
}

function DirectorFooter() {
  return <footer className="director-footer"><span>CONTRÔLE PÉDAGOGIQUE - Pilotage pédagogique intelligent pour une éducation de qualité en RDC.</span><span>© 2024 CONTRÔLE PÉDAGOGIQUE. Tous droits réservés.</span></footer>
}

export {
  AccessibilityEnhancer,
  AuthShell,
  PresentationScreen,
  LoginScreen,
  DemoAccess,
  ManagementLayout,
  ManagementKpi,
  ManagementPreviewRows,
  ManagementProgramSteps,
  ClientSchools,
  NewSchoolFlow,
  ManagementChapterStructure,
  ManagementProgramValidation,
  ManagementSubscriptions,
  ManagementPayments,
  ManagementSentPrograms,
  ManagementSendHistory,
  ManagementReports,
  ManagementStatistics,
  ManagementSettings,
  ManagementAudit,
  ManagementUsers,
  ManagementNotifications,
  ManagementSupport,
  DirectorLayout,
  AlertCard,
  BarChart,
  ClassroomMini,
  DelayTable,
  KpiGrid,
  ProgressRows,
  PromoBand,
  RightStack,
  SchoolPrograms,
  AnnualRepartition,
  AnnualMeta,
  MatrixCell,
  ProgressTracking,
  EvaluationControl,
  Reports,
  SupervisionDetail,
  PrefectLayout,
  PrefectDashboard,
  PrefectValidations,
  PrefectProgramControl,
  PrefectTeachersFollowUp,
  PrefectTextBook,
  PrefectEvaluations,
  PrefectReports,
  PrefectReportDetail,
  PrefectProgressionDetail,
  PrefectCalendar,
  PrefectAlerts,
  PrefectMessages,
  PrefectSettings,
  TeacherLayout,
  TeacherDashboard,
  TeacherPrograms,
  TeacherProgress,
  TeacherTextBook,
  Card,
  Icon,
  Avatar,
  Badge,
  Filters,
  MiniBar,
  TeacherStats,
  TextBookHistoryTable,
  ProgramField,
  SubjectTable,
  EvaluationTable,
  ReportTable,
}

