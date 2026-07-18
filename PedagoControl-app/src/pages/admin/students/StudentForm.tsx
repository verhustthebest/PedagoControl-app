import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth'
import { adminParentalApi } from '../../../services/adminParental'
import { PageHeader } from '../../../components/adminParental/PageHeader'

export function StudentFormPage() {
 const {user}=useAuth(); const navigate=useNavigate(); const [form,setForm]=useState({last_name:'',first_name:'',middle_name:'',gender:'',birth_date:'',birth_place:'',address:''}); const [error,setError]=useState(''); const [submitting,setSubmitting]=useState(false)
 const update=(name:string,value:string)=>setForm({...form,[name]:value})
 return <><PageHeader icon="♙" title="Ajouter un élève" subtitle="Enregistrez les informations de l’élève dans son établissement." back="/admin/eleves"/>
 <div className="resource-form-shell"><form className="admin-card resource-form" onSubmit={e=>e.preventDefault()}><h2>1. Informations de l’élève</h2>{error&&<div className="admin-error">{error}</div>}<div className="resource-form-grid">
 {([['last_name','Nom *'],['middle_name','Postnom'],['first_name','Prénom *'],['birth_date','Date de naissance *'],['birth_place','Lieu de naissance *'],['address','Adresse *']] as const).map(([name,label])=><label key={name}>{label}<input type={name==='birth_date'?'date':'text'} value={form[name]} onChange={e=>update(name,e.target.value)} required={label.includes('*')}/></label>)}
 <label>Sexe *<select value={form.gender} onChange={e=>update('gender',e.target.value)}><option value="">Sélectionner</option><option value="F">Fille</option><option value="M">Garçon</option></select></label><label>Classe / inscription annuelle<input disabled placeholder="API des classes indisponible"/><small className="field-error">Une classe réelle est obligatoire pour enregistrer l’élève.</small></label></div>
 <div className="admin-savebar"><Link className="admin-button secondary" to="/admin/eleves">Annuler</Link><button className="admin-button" disabled title="La liste des classes n’est pas exposée par l’API" onClick={async()=>{if(!user?.school_id)return;setSubmitting(true);try{const created=await adminParentalApi.createStudent(user.school_id,form);navigate(`/admin/eleves/${created.student.public_id}`,{replace:true})}catch(e){setError(e instanceof Error?e.message:'Création impossible')}finally{setSubmitting(false)}}}>{submitting?'Enregistrement…':'Enregistrer l’élève'}</button></div></form>
 <aside className="admin-card resource-side"><h2>Aide rapide</h2><ul><li>Le matricule est généré automatiquement.</li><li>Les champs marqués d’un astérisque sont obligatoires.</li><li>La classe doit provenir de l’établissement connecté.</li></ul><div className="resource-unavailable">Création désactivée tant que l’API ne fournit pas les classes et leur identifiant d’inscription.</div></aside></div></>
}
