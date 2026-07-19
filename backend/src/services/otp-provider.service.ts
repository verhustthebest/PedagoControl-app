import { maskContact } from '../security/abuse-protection'
import { deliverNotification, type DeliveryResult } from './notification-delivery.service'

export type OtpChannel='email'|'whatsapp'|'sms'
type SendOtpInput={channel:OtpChannel;destination:string;code:string;schoolName:string}

/** Envoie l'OTP via l'architecture commune sans jamais journaliser le code complet. */
export async function sendRegistrationOtp(input:SendOtpInput):Promise<DeliveryResult>{const result=await deliverNotification({channel:input.channel==='email'?'email':'sms',to:input.destination,subject:`Code d'inscription - ${input.schoolName}`,text:`Votre code de vérification est ${input.code}. Ne le partagez avec personne.`});console.info(JSON.stringify({event:'otp_delivery',channel:input.channel,destination:maskContact(input.destination),status:result.status,provider:result.provider}));return result}
