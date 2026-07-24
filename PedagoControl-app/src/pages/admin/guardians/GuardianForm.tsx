import{useState}from'react'
import{Link,useNavigate}from'react-router-dom'
import{useAuth}from'../../../auth'
import{adminParentalApi}from'../../../services/adminParental'
import{PHONE_CONFLICT_MESSAGE,phoneIdentityApi}from'../../../services/phoneIdentity'
import{PageHeader}from'../../../components/adminParental/PageHeader'

export function GuardianFormPage(){
 const{user}=useAuth(),navigate=useNavigate()
 const[form,setForm]=useState({first_name:'',last_name:'',middle_name:'',phone:'',email:'',address:'',occupation:'',preferred_contact_method:'sms'})
 const[error,setError]=useState(''),[warning,setWarning]=useState(''),[saving,setSaving]=useState(false)
 const update=(name:string,value:string)=>setForm({...form,[name]:value})
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();if(!user?.school_id||saving)return
  if(!form.phone&&!form.email){setError('Un téléphone ou un e-mail est obligatoire.');return}
  setSaving(true);setError('');setWarning('')
  try{
   if(form.phone){
    const check=await phoneIdentityApi.check({phone:form.phone,first_name:form.first_name,last_name:form.last_name})
    setForm(current=>({...current,phone:check.normalized_phone}))
    if(check.status==='CONFLICT')throw new Error(PHONE_CONFLICT_MESSAGE)
    if(check.status==='REUSE_ACCOUNT'){setWarning(`Compte existant détecté pour ${check.person?.first_name} ${check.person?.last_name}. Sélectionnez cette personne existante.`);return}
    if(check.status==='CONTACT_WITHOUT_ACCOUNT'){
     const reuse=window.confirm(`Ce numéro appartient à un contact sans compte. Réutiliser ce parent existant ?`)
     if(reuse&&check.person){navigate(`/admin/parents/${check.person.public_id}`,{replace:true});return}
     return
    }
   }
   const result=await adminParentalApi.createGuardian(user.school_id,{...form,phone:form.phone||undefined})
   navigate(`/admin/parents/${result.guardian.public_id}`,{replace:true})
  }catch(value){setError(value instanceof Error?value.message:'Création impossible')}finally{setSaving(false)}
 }
 return <><PageHeader icon="♧" title="Ajouter un parent ou tuteur" subtitle="Vérifiez le téléphone avant de créer ou réutiliser une personne." back="/admin/parents"/><div className="resource-form-shell"><form className="admin-card resource-form" onSubmit={submit}><h2>Informations du parent / tuteur</h2>{error&&<div className="admin-error">{error}</div>}{warning&&<div className="wizard-message">{warning}</div>}<div className="resource-form-grid">{([['last_name','Noms *'],['first_name','Prénom *'],['middle_name','Postnom'],['phone','Téléphone'],['email','E-mail'],['occupation','Profession'],['address','Adresse']]as const).map(([name,label])=><label className={name==='address'?'full':''} key={name}>{label}<input type={name==='email'?'email':'text'} value={form[name]} onChange={event=>update(name,event.target.value)} required={label.includes('*')}/></label>)}<label>Méthode de contact<select value={form.preferred_contact_method} onChange={event=>update('preferred_contact_method',event.target.value)}><option value="sms">SMS</option><option value="email">E-mail</option></select></label></div><div className="admin-savebar"><Link className="admin-button secondary" to="/admin/parents">Annuler</Link><button className="admin-button green" disabled={saving}>{saving?'Vérification…':'Enregistrer le parent'}</button></div></form><aside className="admin-card resource-side"><h2>Contrôle du numéro</h2><ul><li>Les formats 0…, 243… et +243… sont comparés comme un même numéro.</li><li>Un compte existant doit être réutilisé.</li><li>Un numéro appartenant à une autre identité bloque la création.</li></ul></aside></div></>
}
