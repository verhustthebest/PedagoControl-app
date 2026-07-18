import type { ReactNode } from 'react'
export function ResourceState({ loading, error, empty, children, retry }: { loading: boolean; error?: string; empty?: boolean; children: ReactNode; retry?: () => void }) {
  if (loading) return <div className="admin-loading" role="status"><div><div className="admin-skeleton"/><p>Chargement sécurisé…</p></div></div>
  if (error) return <div className="admin-card resource-feedback"><strong>Chargement impossible</strong><p>{error}</p>{retry && <button className="admin-button" onClick={retry}>Réessayer</button>}</div>
  if (empty) return <div className="admin-card resource-feedback"><strong>Aucune donnée</strong><p>Aucun élément ne correspond aux critères actuels.</p></div>
  return <>{children}</>
}
