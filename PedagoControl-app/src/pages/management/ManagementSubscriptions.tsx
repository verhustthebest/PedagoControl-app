import{useEffect,useState}from'react'
import{Link}from'react-router-dom'
import{apiErrorMessage}from'../../services/api'
import{managementSubscriptionsApi,type ManagementSubscription,type SubscriptionResponse}from'../../services/managementSubscriptions'

const date=(value:string)=>new Date(value).toLocaleDateString('fr-FR')
const period=(value:string)=>value==='monthly'?'Mensuelle':value==='quarterly'?'Trimestrielle':'Annuelle'
const statusLabel=(item:ManagementSubscription)=>{
 const end=new Date(item.end_date).getTime(),now=Date.now()
 if(item.status==='active'&&end>=now&&end<=now+30*86_400_000)return'Bientôt expirée'
 if(end<now||item.status==='overdue')return'En retard'
 if(item.status==='suspended')return'Suspendue'
 return'Active'
}

/** Vue réelle des souscriptions : cartes, filtres et pagination partagent le même endpoint. */
export function ManagementSubscriptions(){
 const[items,setItems]=useState<ManagementSubscription[]>([]),[summary,setSummary]=useState<SubscriptionResponse['summary']>({total:0,active:0,expiring_soon:0,overdue:0,teacher_quota:0})
 const[page,setPage]=useState(1),[limit,setLimit]=useState(20),[pages,setPages]=useState(1),[searchInput,setSearchInput]=useState(''),[search,setSearch]=useState(''),[status,setStatus]=useState(''),[plan,setPlan]=useState(''),[billing,setBilling]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const load=()=>{setLoading(true);setError('');void managementSubscriptionsApi.list({page,limit,search:search||undefined,status:status||undefined,plan:plan||undefined,billing_period:billing||undefined}).then(data=>{setItems(data.items);setSummary(data.summary);setPages(Math.max(1,data.pagination.total_pages))}).catch(value=>setError(apiErrorMessage(value))).finally(()=>setLoading(false))}
 useEffect(load,[page,limit,search,status,plan,billing])
 const submit=(event:React.FormEvent)=>{event.preventDefault();setPage(1);setSearch(searchInput.trim())}
 return <section className="client-schools-page"><div className="schools-hero"><div><h2>Souscriptions</h2><p>Écoles et quotas réellement enregistrés.</p></div><Link className="blue-button" to="/management/ecoles/nouvelle">Nouvelle souscription</Link></div>
 <div className="management-kpis">
  <article className="management-kpi blue"><div><strong>{summary.total}</strong><em>Souscriptions</em><small>Toutes les écoles</small></div></article>
  <article className="management-kpi green"><div><strong>{summary.active}</strong><em>Actives</em><small>Données réelles</small></div></article>
  <article className="management-kpi orange subscription-expiring"><div><strong>{summary.expiring_soon}</strong><em>Bientôt expirées</em><small>30 prochains jours</small></div></article>
  <article className="management-kpi red"><div><strong>{summary.overdue}</strong><em>En retard</em><small>Échéance dépassée</small></div></article>
  <article className="management-kpi purple"><div><strong>{summary.teacher_quota}</strong><em>Quotas enseignants</em><small>Autorisés</small></div></article>
 </div>
 <section className="management-card schools-panel"><form className="schools-filters" onSubmit={submit}><label className="schools-search"><span>Recherche</span><input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="École, code ou responsable"/></label><label><span>Statut</span><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Tous</option><option value="active">Actif</option><option value="expiring_soon">Bientôt expiré</option><option value="overdue">En retard</option><option value="suspended">Suspendu</option></select></label><label><span>Plan</span><select value={plan} onChange={e=>{setPlan(e.target.value);setPage(1)}}><option value="">Tous</option>{['LOCAL_TEST','BASIC','GOLD','EXTRA','PROFESSIONAL'].map(value=><option key={value}>{value}</option>)}</select></label><label><span>Période</span><select value={billing} onChange={e=>{setBilling(e.target.value);setPage(1)}}><option value="">Toutes</option><option value="monthly">Mensuelle</option><option value="quarterly">Trimestrielle</option><option value="annual">Annuelle</option></select></label><button className="blue-button">Rechercher</button></form>
 {loading?<div className="admin-empty">Chargement des souscriptions…</div>:error?<div className="admin-error">{error}<button type="button" onClick={load}>Réessayer</button></div>:items.length===0?<div className="admin-empty">Aucune souscription enregistrée.</div>:<div className="schools-table-wrap"><table className="schools-table"><thead><tr><th>Code</th><th>École</th><th>Plan</th><th>Quota</th><th>Période</th><th>Échéance</th><th>Montant</th><th>Statut</th></tr></thead><tbody>{items.map(item=><tr key={`${item.school.public_id}-${item.start_date}`}><td>{item.school.code}</td><td><strong>{item.school.name}</strong><span>{item.school.promoter_name}</span></td><td>{item.plan.name}</td><td>{item.teacher_limit}</td><td>{period(item.billing_period)}</td><td>{date(item.end_date)}</td><td>{item.amount_to_pay} USD</td><td><span className={`school-status ${item.status}`}>{statusLabel(item)}</span></td></tr>)}</tbody></table></div>}
 <div className="schools-pagination"><span>Page {page} sur {pages}</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(v=>v-1)}>‹</button><button type="button" disabled={page>=pages} onClick={()=>setPage(v=>v+1)}>›</button></div><label>Éléments<select value={limit} onChange={e=>{setLimit(Number(e.target.value));setPage(1)}}><option>10</option><option>20</option><option>50</option></select></label></div></section></section>
}
