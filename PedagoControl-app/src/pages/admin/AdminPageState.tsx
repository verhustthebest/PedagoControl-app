import type { ReactNode } from 'react'

export function AdminPageState({ status, message, retry, children }: { status: string; message?: string; retry: () => void; children: ReactNode }) {
  if (status === 'loading') return <div className="admin-loading" role="status"><div><div className="admin-skeleton" /><p>Chargement sécurisé…</p></div></div>
  if (status === 'error') return <div className="admin-card admin-panel"><div className="admin-error">{message || 'Impossible de charger les données.'}</div><button className="admin-button" onClick={retry}>Réessayer</button></div>
  return <>{children}</>
}

export const value = (input: number | string | null | undefined) => input === null || input === undefined || input === '' ? 'Donnée indisponible' : input
