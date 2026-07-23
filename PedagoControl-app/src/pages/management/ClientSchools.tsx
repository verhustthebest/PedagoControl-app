import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiErrorMessage } from '../../services/api'
import { schoolsApi, type PublicSchool } from '../../services/schools'

/** Liste Management exclusivement alimentée par l'API paginée, sans école de démonstration. */
export function ClientSchools() {
  const [params] = useSearchParams()
  const created = params.get('created')
  const [items, setItems] = useState<PublicSchool[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true); setError('')
    void schoolsApi.list({ page, limit, search: search || undefined, status: status || undefined })
      .then(result => {
        setItems(result.schools); setTotal(result.pagination.total)
        setPages(Math.max(1, result.pagination.total_pages))
      })
      .catch(value => setError(apiErrorMessage(value)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [page, limit, search, status])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }
  const reset = () => { setSearchInput(''); setSearch(''); setStatus(''); setPage(1) }

  return <section className="client-schools-page">
    <div className="schools-hero"><div><h2>Écoles clientes</h2><p>Recherche réelle par nom, code ou responsable.</p></div><Link className="blue-button" to="/management/ecoles/nouvelle">Nouvelle école</Link></div>
    {created && <div className="wizard-message" role="status">École créée avec succès et mise en évidence dans la liste.</div>}
    <div className="management-kpis"><article className="management-kpi blue"><div><strong>{total}</strong><em>Total écoles</em><small>Donnée issue de l’API</small></div></article></div>
    <section className="management-card schools-panel">
      <form className="schools-filters" onSubmit={submit}>
        <label className="schools-search"><span>Recherche</span><input value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Nom, code ou responsable"/></label>
        <label><span>Statut</span><select value={status} onChange={event=>{setStatus(event.target.value);setPage(1)}}><option value="">Tous</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="inactive">Inactif</option></select></label>
        <button className="blue-button" type="submit">Rechercher</button>
        <button className="secondary-button reset-filters" type="button" onClick={reset}>Réinitialiser</button>
      </form>
      {loading?<div className="admin-empty">Chargement des écoles…</div>:error?<div className="admin-error">{error}<button type="button" onClick={load}>Réessayer</button></div>:items.length===0?<div className="admin-empty">Aucune école ne correspond à la recherche.</div>:
      <div className="schools-table-wrap"><table className="schools-table"><thead><tr><th>Code école</th><th>Nom école</th><th>Responsable</th><th>Téléphone</th><th>Statut</th><th>Créée le</th></tr></thead><tbody>{items.map(school=><tr key={school.public_id} className={created===school.public_id?'school-newly-created':''}><td><strong>{school.code}</strong></td><td>{school.name}</td><td>{school.promoter_name}</td><td>{school.phone||'Donnée indisponible'}</td><td><span className={`school-status ${school.status}`}>{school.status}</span></td><td>{new Date(school.created_at).toLocaleDateString('fr-FR')}</td></tr>)}</tbody></table></div>}
      <div className="schools-pagination"><span>{total} école(s)</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(value=>value-1)}>‹</button><span>Page {page} / {pages}</span><button type="button" disabled={page>=pages} onClick={()=>setPage(value=>value+1)}>›</button></div><label>Éléments par page<select value={limit} onChange={event=>{setLimit(Number(event.target.value));setPage(1)}}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label></div>
    </section>
  </section>
}
