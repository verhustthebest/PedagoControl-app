import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
export function PageHeader({ icon, title, subtitle, back, actions }: { icon: string; title: string; subtitle: string; back?: string; actions?: ReactNode }) {
  return <header className="admin-page-head">{back ? <Link className="admin-page-icon" to={back}>←</Link> : <div className="admin-page-icon">{icon}</div>}<div><h1>{title}</h1><p>{subtitle}</p></div>{actions && <div className="admin-actions">{actions}</div>}</header>
}
