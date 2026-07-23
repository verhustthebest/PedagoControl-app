import { apiRequest } from './api'

export type SubscriptionOption = { code:string;name:string;description:string|null;min_teachers:number;max_teachers:number|null;monthly_price:string;annual_price:string|null }
export type SchoolOnboardingData = {
  school: Record<string, string>
  responsible: Record<string, string>
  academic: { year_name:string;start_date:string;end_date:string;teacher_limit:number }
  subscription: { subscription_code:string;billing_period:'monthly'|'annual' }
  account: Record<string, string>
}
export const SCHOOL_WIZARD_STORAGE_KEY = 'pedago_school_onboarding_draft'
export type SchoolWizardSnapshot = { step:number;draftId:string|null;data:SchoolOnboardingData }

function withoutEmptyValues(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([,item]) => item !== '' && item !== null && item !== undefined))
}

/** Sauvegarde locale non sensible : le mot de passe est toujours supprimé avant sérialisation. */
export function saveSchoolWizardSnapshot(snapshot:SchoolWizardSnapshot){if(typeof window==='undefined')return;window.localStorage.setItem(SCHOOL_WIZARD_STORAGE_KEY,JSON.stringify({...snapshot,data:{...snapshot.data,account:withoutEmptyValues({...snapshot.data.account,password:undefined})}}))}
export function loadSchoolWizardSnapshot():SchoolWizardSnapshot|null{if(typeof window==='undefined')return null;try{return JSON.parse(window.localStorage.getItem(SCHOOL_WIZARD_STORAGE_KEY)||'null')as SchoolWizardSnapshot|null}catch{return null}}
export function clearSchoolWizardSnapshot(){if(typeof window!=='undefined')window.localStorage.removeItem(SCHOOL_WIZARD_STORAGE_KEY)}

function draftData(current_step:number,data:SchoolOnboardingData){
  const groups:Record<string,unknown>={school:withoutEmptyValues(data.school)}
  if(current_step>=2)groups.responsible=withoutEmptyValues(data.responsible)
  if(current_step>=3)groups.academic=withoutEmptyValues(data.academic as unknown as Record<string,unknown>)
  if(current_step>=4)groups.subscription=withoutEmptyValues(data.subscription)
  if(current_step>=5)groups.account=withoutEmptyValues({...data.account,password:undefined})
  return groups
}

/** Toutes les écritures du wizard passent par le client sécurisé commun. */
export const schoolOnboardingApi = {
  subscriptions: () => apiRequest<{ items:SubscriptionOption[] }>('/schools/onboarding/subscriptions'),
  saveDraft: (draft_id:string|null,current_step:number,data:SchoolOnboardingData) => apiRequest<{draft:{public_id:string;status:string;updated_at:string}}>('/schools/onboarding/drafts',{method:'POST',body:JSON.stringify({...(draft_id?{draft_id}:{}),current_step,data:draftData(current_step,data)})}),
  finalize: (draft_id:string,data:SchoolOnboardingData) => apiRequest<{school:{public_id:string};repeated:boolean}>('/schools/onboarding',{method:'POST',body:JSON.stringify({draft_id,...data})}),
}
