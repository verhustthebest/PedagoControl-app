import{useState}from'react'
import{Link,useSearchParams}from'react-router-dom'
import{apiErrorMessage,authApi}from'../../services/api'

/** Active un compte scolaire au moyen du jeton opaque reçu par invitation. */
export function InvitationActivation(){
 const[tokenParams]=useSearchParams(),token=tokenParams.get('token')||''
 const[form,setForm]=useState({password:'',confirmation:''})
 const[loading,setLoading]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('')
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();setError('')
  if(!token){setError('Invitation invalide ou incomplète.');return}
  setLoading(true)
  try{await authApi.acceptInvitation(token,form.password,form.confirmation);setDone(true)}
  catch(reason){setError(apiErrorMessage(reason))}
  finally{setLoading(false)}
 }
 return <main className="access-state invitation-activation"><section className="admin-card account-form-card">
  <h1>Activer votre compte</h1>
  {done?<><p>Votre mot de passe a été défini. Vous pouvez maintenant vous connecter.</p><Link className="admin-button" to="/login">Aller à la connexion</Link></>:
  <form onSubmit={submit}>
   <p>Choisissez un mot de passe d’au moins 12 caractères avec majuscule, minuscule, chiffre et symbole.</p>
   <label>Nouveau mot de passe<input type="password" autoComplete="new-password" required minLength={12} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
   <label>Confirmation<input type="password" autoComplete="new-password" required value={form.confirmation} onChange={e=>setForm({...form,confirmation:e.target.value})}/></label>
   {error&&<div className="admin-error" role="alert">{error}</div>}
   <button className="admin-button" disabled={loading}>{loading?'Activation…':'Activer mon compte'}</button>
  </form>}
 </section></main>
}
