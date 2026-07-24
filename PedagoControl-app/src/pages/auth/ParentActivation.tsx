import{useState}from'react'
import{Link}from'react-router-dom'
import{apiErrorMessage}from'../../services/api'
import{parentActivationApi}from'../../services/parentActivation'

/** Parcours public OTP : les jetons restent en mémoire et disparaissent au rechargement. */
export function ParentActivation(){
 const[step,setStep]=useState<1|2|3|4>(1),[loading,setLoading]=useState(false),[error,setError]=useState('')
 const[request,setRequest]=useState({school_code:'',contact:'',channel:'sms'as'email'|'sms'})
 const[verificationId,setVerificationId]=useState(''),[otp,setOtp]=useState(''),[registrationToken,setRegistrationToken]=useState('')
 const[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('')
 const send=async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setError('');try{const result=await parentActivationApi.requestOtp(request);if(!result.verification_id){setError('Si ce contact est éligible, un code sera envoyé.');return}setVerificationId(result.verification_id);setStep(2)}catch(reason){setError(apiErrorMessage(reason))}finally{setLoading(false)}}
 const verify=async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setError('');try{const result=await parentActivationApi.verifyOtp(verificationId,otp);setRegistrationToken(result.registration_token);setStep(3)}catch(reason){setError(apiErrorMessage(reason))}finally{setLoading(false)}}
 const activate=async(e:React.FormEvent)=>{e.preventDefault();if(password!==confirmation){setError('Les mots de passe ne correspondent pas.');return}setLoading(true);setError('');try{await parentActivationApi.register(registrationToken,password);setRegistrationToken('');setOtp('');setStep(4)}catch(reason){setError(apiErrorMessage(reason))}finally{setLoading(false)}}
 return <main className="access-state parent-activation"><section className="admin-card account-form-card"><h1>Activer mon compte Parent</h1>
  {error&&<div className="admin-error" role="alert">{error}</div>}
  {step===1&&<form onSubmit={send}><label>Code école<input required value={request.school_code} onChange={e=>setRequest({...request,school_code:e.target.value})}/></label><label>Canal<select value={request.channel} onChange={e=>setRequest({...request,channel:e.target.value as'email'|'sms'})}><option value="sms">SMS</option><option value="email">E-mail</option></select></label><label>Téléphone ou e-mail<input required value={request.contact} onChange={e=>setRequest({...request,contact:e.target.value})}/></label><button className="admin-button" disabled={loading}>{loading?'Envoi…':'Recevoir mon code'}</button></form>}
  {step===2&&<form onSubmit={verify}><label>Code à 6 chiffres<input required inputMode="numeric" pattern="\d{6}" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)}/></label><button className="admin-button" disabled={loading}>{loading?'Vérification…':'Vérifier le code'}</button></form>}
  {step===3&&<form onSubmit={activate}><p>12 caractères minimum avec majuscule, minuscule, chiffre et symbole.</p><label>Nouveau mot de passe<input required type="password" minLength={12} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmation<input required type="password" autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><button className="admin-button" disabled={loading}>{loading?'Activation…':'Activer mon compte'}</button></form>}
  {step===4&&<><p>Votre compte Parent est actif.</p><Link className="admin-button" to="/login">Se connecter</Link></>}
 </section></main>
}
