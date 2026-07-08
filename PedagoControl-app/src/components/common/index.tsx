import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Card({ title, className = '', children }: { title?: string; className?: string; children: ReactNode }) {
  return <section className={`director-card ${className}`}>{title && <h2>{title}</h2>}{children}</section>
}

export function Donut({ value, center, label }: { value: number; center?: string; label?: string }) {
  return <div className="donut" style={{ '--value': `${value * 3.6}deg` } as CSSProperties}><div><strong>{center || `${value}%`}</strong><span>{label || 'Global'}</span></div></div>
}

export function Legend({ rows }: { rows: Array<[string, number, string]> }) {
  return <div className="legend">{rows.map(([label, value, color]) => <div key={label}><span className={color} />{label}<strong>{value}%</strong></div>)}</div>
}

export function Filters({ labels, search, action }: { labels: string[]; search?: string; action?: string }) {
  return <div className="filters">{labels.map((label, index) => <label key={label}><span>{label}</span><select><option>{index === 0 && label !== 'Année scolaire' ? 'Toutes' : label === 'Période' ? 'Septembre 2024' : label === 'Année scolaire' ? '2024 - 2025' : index === 1 ? '1er Trimestre' : 'Tous'}</option></select></label>)}{search && <label className="search-field"><span>&nbsp;</span><input placeholder={search} /><Icon name="search" /></label>}{action && <button className="blue-button"><Icon name="filter" /> {action}</button>}</div>
}

export function Badge({ status }: { status: string }) {
  const tone = status.includes('retard') || status === 'Critique' ? 'red' : status.includes('avance') || status.includes('Réalisée') || status.includes('Mensuel') ? 'green' : status.includes('Conforme') || status.includes('Contrôle') ? 'blue' : status.includes('Trimestriel') || status.includes('Interrogation') ? 'purple' : 'orange'
  return <span className={`badge ${tone}`}>{status}</span>
}

export function MiniBar({ value, tone }: { value: number; tone: string }) {
  return <span className="mini-bar"><i className={tone.includes('retard') ? 'red' : tone.includes('Conforme') ? 'blue' : 'green'} style={{ width: `${value}%` }} /></span>
}

export function SubjectIcon({ tone }: { tone: string }) {
  return <span className={`subject-icon ${tone}`}><Icon name="book" /></span>
}

export function LinkRow({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="link-row" to={to}>{children} <Icon name="arrow" /></Link>
}

export function TeacherStats({ items }: { items: Array<{ icon: string; value: string; label: string; detail: string; tone: string }> }) {
  return <section className="teacher-stats">{items.map((item) => <article className={`teacher-stat ${item.tone}`} key={item.label}><span><Icon name={item.icon} /></span><div><small>{item.label}</small><strong>{item.value}</strong><em>{item.detail}</em></div></article>)}</section>
}

export function MiniList({ rows, icon }: { rows: string[]; icon: string }) {
  return <div className="mini-list">{rows.map((row) => { const parts = row.split('|'); return <div key={row}><span className="mini-list-icon"><Icon name={icon} /></span><p><strong>{parts[0]}</strong><span>{parts[1]}</span></p><em>{parts[2]}</em></div> })}</div>
}

export function Avatar({ name, small = false, crest = false }: { name: string; small?: boolean; crest?: boolean }) {
  return <span className={`avatar${small ? ' small' : ''}${crest ? ' crest' : ''}`} aria-label={name}>{crest ? 'PC' : name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
}

export function FilterBox({ icon, label, value }: { icon?: string; label: string; value: string }) {
  return <button className="filter-box" type="button">{icon && <Icon name={icon} />}<span>{label}<strong>{value}</strong></span><Icon name="chevron" /></button>
}

export function LanguageSelector() {
  return <button className="language-button" type="button" aria-label="Changer de langue"><span className="flag">🇨🇩</span>Français<Icon name="chevron" /></button>
}

export function SecurityNotice({ emphasizePrivacy = false }: { emphasizePrivacy?: boolean }) {
  return <div className={`security-notice${emphasizePrivacy ? ' security-notice-emphasized' : ''}`}><Icon name="shield" /><p><strong>Vos données sont sécurisées et protégées</strong><span>CONTRÔLE PÉDAGOGIQUE respecte la confidentialité de vos informations.</span></p></div>
}

export function Footer({ variant = 'default' }: { variant?: 'default' | 'login' }) {
  if (variant === 'login') {
    return <footer className="auth-footer login-footer"><span>© 2024 CONTRÔLE PÉDAGOGIQUE - Tous droits réservés</span><span className="footer-red">Altas Building Contractor © Copyright</span></footer>
  }

  return <footer className="auth-footer"><span>© 2024 CONTRÔLE PÉDAGOGIQUE - Tous droits réservés</span><span>Ministère de l’Enseignement Primaire, Secondaire et Technique</span><span>République Démocratique du Congo</span><span className="footer-flag">🇨🇩</span></footer>
}

export function Icon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    alert: <path d="M12 3 2.8 20h18.4L12 3Zm0 6v5m0 3h.01" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Zm0 0A2.5 2.5 0 0 1 6.5 8H20" />,
    calendar: <path d="M7 2v4m10-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2Z" />,
    chart: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3m3-6-5 5-3-3-4 4" />,
    checkCircle: <path d="M20 6 9 17l-5-5m18 0a10 10 0 1 1-5-8.7" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    clipboard: <path d="M9 4h6l1 2h3v15H5V6h3l1-2Zm0 7h6m-6 4h6" />,
    clock: <path d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />,
    down: <path d="M12 5v14m6-6-6 6-6-6" />,
    excel: <path d="M6 3h9l3 3v15H6V3Zm4 8 4 5m0-5-4 5" />,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeSoft: <><path d="M2.5 12s3.2-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.2 5.5-9.5 5.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></>,
    file: <path d="M7 3h7l4 4v14H7V3Zm7 0v5h4M10 13h5m-5 4h5" />,
    filter: <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />,
    home: <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z" />,
    info: <path d="M12 17v-6m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />,
    lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
    login: <path d="M10 17l5-5-5-5M15 12H3M14 4h5v16h-5" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    message: <path d="M4 5h16v11H8l-4 4V5Z" />,
    more: <path d="M12 5h.01M12 12h.01M12 19h.01" />,
    network: <path d="M8 6a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm8 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-13-3 7m6-7 2 7M8 18h5" />,
    pdf: <path d="M6 3h9l3 3v15H6V3Zm8 0v5h4M9 15h6m-6-4h3" />,
    person: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    pie: <path d="M12 2v10h10A10 10 0 1 1 12 2Zm3 0a10 10 0 0 1 7 7h-7V2Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    print: <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4h18v4a2 2 0 0 1-2 2h-2M7 14h10v7H7v-7Z" />,
    search: <path d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    settings: <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-13v3m0 13v3m8-11h3M1 12h3m14.4-7.4-2.1 2.1M7.7 17.3l-2.1 2.1m0-14.8 2.1 2.1m8.6 10.6 2.1 2.1" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM9 12l2 2 4-5" />,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m15 9 5-5M20 4v4M20 4h-4" /></>,
    trend: <path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-7M18 7h2v2" />,
    user: <path d="M12 14c4 0 7 2.2 7 5v1H5v-1c0-2.8 3-5 7-5ZM12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
    users: <path d="M16 11a4 4 0 1 0-3.5-5.9M12 21a7 7 0 0 0-14 0m14 0a7 7 0 0 1 12 0M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  }

  return <svg className="ui-icon" viewBox="0 0 24 24" role="presentation" aria-hidden="true">{icons[name]}</svg>
}
