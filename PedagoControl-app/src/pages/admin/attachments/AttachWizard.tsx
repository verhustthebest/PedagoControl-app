import{useEffect,useState}from'react'
import{Link,useParams}from'react-router-dom'
import{useAuth}from'../../../auth'
import{PageHeader}from'../../../components/adminParental/PageHeader'
import{ResourceState}from'../../../components/adminParental/ResourceState'
import{StatusBadge}from'../../../components/adminParental/StatusBadge'
import{adminParentalApi,type AttachmentRequest,type Guardian,type Student}from'../../../services/adminParental'
import{apiErrorMessage}from'../../../services/api'

/** Prépare une demande : seul l'écran de décision Admin active ensuite le rattachement. */
export function AttachWizardPage(){
 const{publicId}=useParams(),{user}=useAuth()
 const[guardian,setGuardian]=useState<Guardian|null>(null),[students,setStudents]=useState<Student[]>([])
 const[selected,setSelected]=useState<Student|null>(null),[relationship,setRelationship]=useState('father')
 const[search,setSearch]=useState(''),[step,setStep]=useState(1),[loading,setLoading]=useState(true)
 const[error,setError]=useState(''),[saving,setSaving]=useState(false),[request,setRequest]=useState<AttachmentRequest|null>(null)
 const load=()=>{if(!user?.school_id||!publicId)return;setLoading(true);Promise.all([adminParentalApi.guardian(user.school_id,publicId),adminParentalApi.students(user.school_id,{limit:100})]).then(([parent,children])=>{setGuardian(parent.guardian);setStudents(children.items);setError('')}).catch(reason=>setError(apiErrorMessage(reason))).finally(()=>setLoading(false))}
 useEffect(load,[user?.school_id,publicId])
 const submit=async()=>{if(!user?.school_id||!guardian||!selected)return;setSaving(true);setError('');try{const result=await adminParentalApi.createAttachmentRequest(user.school_id,selected.public_id,guardian.public_id,relationship);setRequest(result.request);setStep(4)}catch(reason){setError(apiErrorMessage(reason))}finally{setSaving(false)}}
 const shown=students.filter(item=>`${item.first_name} ${item.last_name} ${item.matricule||''}`.toLowerCase().includes(search.toLowerCase()))
 return <><PageHeader icon="←" title={step===4?'Demande créée':'Attacher un élève à ce parent'} subtitle={`Étape ${step} sur 4`} back={`/admin/parents/${publicId}`}/>
 <div className="wizard-steps"><span className={step>=1?'active':''}>Élève</span><span className={step>=2?'active':''}>Lien</span><span className={step>=3?'active':''}>Confirmation</span><span className={step>=4?'active':''}>Résultat</span></div>
 <ResourceState loading={loading} error={error} empty={!guardian} retry={load}>{guardian&&<>
  <section className="admin-card resource-profile"><b>Parent / Tuteur : {guardian.first_name} {guardian.last_name}</b> · {guardian.phone||guardian.email}</section>
  {step===1&&<section className="admin-card"><label>Rechercher l’élève<input value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="resource-table-wrap"><table className="resource-table"><thead><tr><th></th><th>Élève</th><th>Matricule</th><th>Classe</th></tr></thead><tbody>{shown.map(item=><tr key={item.public_id} className={selected?.public_id===item.public_id?'wizard-selection selected':'wizard-selection'} onClick={()=>setSelected(item)}><td><input type="radio" readOnly checked={selected?.public_id===item.public_id}/></td><td>{item.first_name} {item.last_name}</td><td>{item.matricule||'—'}</td><td>{item.enrollment?.academic_year_classes?.school_classes?.name||'—'}</td></tr>)}</tbody></table></div><div className="admin-savebar"><button className="admin-button" disabled={!selected} onClick={()=>setStep(2)}>Suivant</button></div></section>}
  {step===2&&selected&&<section className="admin-card resource-form"><h2>Type de lien</h2><label>Lien avec l’enfant<select value={relationship} onChange={e=>setRelationship(e.target.value)}><option value="father">Père</option><option value="mother">Mère</option><option value="guardian">Tuteur légal</option><option value="other">Autre</option></select></label><p>Aucun accès Parent ne sera ouvert avant l’approbation de la demande.</p><div className="admin-savebar"><button className="admin-button secondary" onClick={()=>setStep(1)}>Précédent</button><button className="admin-button" onClick={()=>setStep(3)}>Suivant</button></div></section>}
  {step===3&&selected&&<section className="admin-card resource-form"><h2>Confirmer la demande</h2><p>{guardian.first_name} {guardian.last_name} — {relationship} de {selected.first_name} {selected.last_name}</p><StatusBadge status="EN_ATTENTE"/><div className="admin-savebar"><button className="admin-button secondary" onClick={()=>setStep(2)}>Précédent</button><button className="admin-button" disabled={saving} onClick={()=>void submit()}>{saving?'Création…':'Créer la demande'}</button></div></section>}
  {step===4&&request&&<section className="admin-card resource-form"><h2>Demande en attente</h2><p>La demande {request.request_code} doit maintenant être approuvée par l’Admin école.</p><StatusBadge status={request.status}/><div className="admin-savebar"><Link className="admin-button" to={`/admin/rattachements/demandes/${request.public_id}`}>Examiner la demande</Link></div></section>}
 </>}</ResourceState></>
}
