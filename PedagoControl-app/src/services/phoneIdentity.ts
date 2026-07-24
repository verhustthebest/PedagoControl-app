import{apiRequest}from'./api'
export const PHONE_CONFLICT_MESSAGE='Ce numéro de téléphone est déjà associé à un autre compte utilisateur. Vérifiez le numéro ou sélectionnez la personne existante.'
export type PhoneCheck={status:'AVAILABLE'|'REUSE_ACCOUNT'|'CONTACT_WITHOUT_ACCOUNT'|'CONFLICT';normalized_phone:string;person?:{public_id:string;first_name:string;last_name:string}}
/** Normalisation d'affichage ; le Backend reste l'autorité avant toute écriture. */
export function normalizeDrcPhone(value:string){let digits=value.replace(/\D/g,'');if(digits.startsWith('00243'))digits=digits.slice(2);if(digits.startsWith('0'))digits=`243${digits.slice(1)}`;else if(digits.length===9)digits=`243${digits}`;return/^243\d{9}$/.test(digits)?`+${digits}`:''}
export const phoneIdentityApi={check:(body:{phone:string;first_name:string;last_name:string})=>apiRequest<PhoneCheck>('/contacts/phone-check',{method:'POST',body:JSON.stringify(body)})}
