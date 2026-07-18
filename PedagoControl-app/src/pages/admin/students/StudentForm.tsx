import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth'
import { apiErrorMessage } from '../../../services/api'
import { adminParentalApi, type AnnualClass } from '../../../services/adminParental'
import { PageHeader } from '../../../components/adminParental/PageHeader'
import { ResourceState } from '../../../components/adminParental/ResourceState'
import { StatusBadge } from '../../../components/adminParental/StatusBadge'

/** Le public_id représente la classe annuelle, jamais la clé numérique interne Prisma. */
export function StudentFormPage() {
 const {user}=useAuth(); const schoolId=user?.school_id; const navigate=useNavigate()
 const [form,setForm]=useState({last_name:'',first_name:'',middle_name:'',gender:'',birth_date:'',birth_place:'',address:'',academic_year_class_id:''})
 const [classes,setClasses]=useState<AnnualClass[]>([]); const [classLoading,setClassLoading]=useState(true); const [classError,setClassError]=useState(''); const [search,setSearch]=useState(''); const [year,setYear]=useState(''); const [section,setSection]=useState(''); const [error,setError]=useState(''); const [submitting,setSubmitting]=useState(false)
 const update=(name:string,value:string)=>setForm({...form,[name]:value})
 const loadClasses=()=>{if(!schoolId)return;setClassLoading(true);setClassError('');void adminParentalApi.classes(schoolId,{search,academic_year:year||undefined,section:section||undefined,limit:100}).then(r=>setClasses(r.items)).catch(e=>setClassError(apiErrorMessage(e))).finally(()=>setClassLoading(false))}
 useEffect(loadClasses,[schoolId])
 const years=useMemo(()=>Array.from(new Map(classes.map(item=>[item.academic_year.public_id,item.academic_year])).values()),[classes]); const sections=useMemo(()=>Array.from(new Set(classes.map(item=>item.class.section).filter(Boolean))) as string[],[classes])
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!schoolId||submitting)return;if(!form.academic_year_class_id){setError('Sélectionnez une classe active.');return}setSubmitting(true);setError('');try{const created=await adminParentalApi.createStudent(schoolId,form);navigate(`/admin/eleves/${created.student.public_id}`,{replace:true})}catch(e){setError(apiErrorMessage(e))}finally{setSubmitting(false)}}
 return <><PageHeader icon="♙" title="Ajouter un élève" subtitle="Enregistrez les informations de l’élève dans son établissement." back="/admin/eleves"/>
 <div className="resource-form-shell"><form className="admin-card resource-form" onSubmit={submit}><h2>1. Informations de l’élève</h2>{error&&<div className="admin-error">{error}</div>}<div className="resource-form-grid">
 {([['last_name','Nom *'],['middle_name','Postnom *'],['first_name','Prénom *'],['birth_date','Date de naissance *'],['birth_place','Lieu de naissance *'],['address','Adresse *']] as const).map(([name,label])=><label key={name}>{label}<input type={name==='birth_date'?'date':'text'} value={form[name]} onChange={e=>update(name,e.target.value)} required/></label>)}
 <label>Sexe *<select value={form.gender} onChange={e=>update('gender',e.target.value)} required><option value="">Sélectionner</option><option value="F">Fille</option><option value="M">Garçon</option></select></label></div>
 <h2>2. Classe et année scolaire</h2><div className="resource-toolbar"><label>Rechercher<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom de classe"/></label><label>Année scolaire<select value={year} onChange={e=>setYear(e.target.value)}><option value="">Toutes</option>{years.map(item=><option key={item.public_id} value={item.public_id}>{item.name}</option>)}</select></label><label>Section<select value={section} onChange={e=>setSection(e.target.value)}><option value="">Toutes</option>{sections.map(item=><option key={item}>{item}</option>)}</select></label><button type="button" className="admin-button secondary" onClick={loadClasses}>Recharger / filtrer</button></div>
 <ResourceState loading={classLoading} error={classError} empty={!classLoading&&!classError&&!classes.length} retry={loadClasses}><div className="resource-table-wrap"><table className="resource-table"><thead><tr><th></th><th>Année</th><th>Section</th><th>Niveau</th><th>Classe</th><th>Statut</th></tr></thead><tbody>{classes.map(item=><tr key={item.public_id} className={form.academic_year_class_id===item.public_id?'wizard-selection selected':'wizard-selection'} onClick={()=>item.is_active&&update('academic_year_class_id',item.public_id)}><td><input type="radio" checked={form.academic_year_class_id===item.public_id} readOnly/></td><td>{item.academic_year.name}</td><td>{item.class.section||'—'}</td><td>{item.class.level}</td><td>{item.class.name}{item.class.parallel?` ${item.class.parallel}`:''}</td><td><StatusBadge status={item.is_active&&item.class.is_active&&item.academic_year.is_active?'Actif':'Inactif'}/></td></tr>)}</tbody></table></div></ResourceState>
 <div className="admin-savebar"><Link className="admin-button secondary" to="/admin/eleves">Annuler</Link><button className="admin-button green" disabled={submitting||classLoading||!form.academic_year_class_id}>{submitting?'Enregistrement…':'Enregistrer l’élève'}</button></div></form>
 <aside className="admin-card resource-side"><h2>Aide rapide</h2><ul><li>Le matricule est généré automatiquement.</li><li>La classe provient exclusivement de l’API de l’école connectée.</li><li>L’identifiant public de la classe annuelle est transmis lors de la création.</li></ul></aside></div></>
}
