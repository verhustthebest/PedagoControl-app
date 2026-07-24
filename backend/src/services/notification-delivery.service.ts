export type NotificationMode='sandbox'|'test_live'|'production'
export type DeliveryStatus='PREPARED'|'SIMULATED'|'SENT'|'DELIVERED'|'FAILED'
export type DeliveryChannel='email'|'sms'
export type DeliveryResult={status:DeliveryStatus;channel:DeliveryChannel;provider:'mailtrap'|'resend'|'simulated'|'infobip';provider_message_id?:string;reason?:'provider_not_configured'|'recipient_not_allowed'|'provider_rejected'}
export type DeliveryMessage={channel:DeliveryChannel;to:string;subject?:string;text:string}

const normalizePhone=(value:string)=>value.replace(/[\s().-]/g,'')
const list=(value:string|undefined,normalizer:(item:string)=>string)=>new Set((value||'').split(',').map(item=>normalizer(item.trim())).filter(Boolean))

/** Mode explicite. Un environnement de production ne peut jamais retomber silencieusement en sandbox. */
export function notificationMode(environment=process.env):NotificationMode{const value=environment.NOTIFICATION_MODE||(environment.NODE_ENV==='production'?'production':'sandbox');if(!['sandbox','test_live','production'].includes(value))throw new Error('NOTIFICATION_MODE is invalid');return value as NotificationMode}
/** Le mode est résolu par canal ; NOTIFICATION_MODE reste un fallback de compatibilité. */
export function channelNotificationMode(channel:DeliveryChannel,environment=process.env):NotificationMode{
  const configured=channel==='email'?environment.EMAIL_NOTIFICATION_MODE:environment.SMS_NOTIFICATION_MODE
  const value=configured||notificationMode(environment)
  if(!['sandbox','test_live','production'].includes(value))throw new Error(`${channel.toUpperCase()}_NOTIFICATION_MODE is invalid`)
  return value as NotificationMode
}

export function isRecipientAllowed(message:DeliveryMessage,environment=process.env){if(channelNotificationMode(message.channel,environment)!=='test_live')return true;const allowed=message.channel==='email'?list(environment.NOTIFICATION_TEST_EMAIL_ALLOWLIST,item=>item.toLowerCase()):list(environment.NOTIFICATION_TEST_PHONE_ALLOWLIST,normalizePhone);const recipient=message.channel==='email'?message.to.trim().toLowerCase():normalizePhone(message.to);return allowed.has(recipient)}

function testMessage(message:DeliveryMessage,mode:NotificationMode):DeliveryMessage{return mode==='test_live'?{...message,subject:message.subject?`[TEST PEDAGO CONTROL] ${message.subject}`:'[TEST PEDAGO CONTROL]',text:`[TEST PEDAGO CONTROL] ${message.text}`} :message}
const acceptedId=async(response:Response)=>{const body=await response.json().catch(()=>null)as Record<string,unknown>|null;return typeof body?.id==='string'?body.id:typeof body?.messageId==='string'?body.messageId:undefined}

/** Mailtrap Sandbox utilise son API HTTP, sans SDK ni transport SMTP local. */
async function sendMailtrap(message:DeliveryMessage,environment:NodeJS.ProcessEnv,fetcher:typeof fetch):Promise<DeliveryResult>{const token=environment.MAILTRAP_API_TOKEN,inbox=environment.MAILTRAP_INBOX_ID,from=environment.NOTIFICATION_EMAIL_FROM;if(!token||!inbox||!from)return{status:'PREPARED',channel:'email',provider:'mailtrap',reason:'provider_not_configured'};const response=await fetcher(`https://sandbox.api.mailtrap.io/api/send/${encodeURIComponent(inbox)}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({from:{email:from,name:environment.NOTIFICATION_EMAIL_FROM_NAME||'PEDAGO CONTROL'},to:[{email:message.to}],subject:message.subject||'PEDAGO CONTROL',text:message.text})});if(!response.ok)return{status:'FAILED',channel:'email',provider:'mailtrap',reason:'provider_rejected'};return{status:'SENT',channel:'email',provider:'mailtrap',provider_message_id:await acceptedId(response)}}

/** Resend n'est considéré SENT qu'après une réponse HTTP d'acceptation du fournisseur. */
async function sendResend(message:DeliveryMessage,environment:NodeJS.ProcessEnv,fetcher:typeof fetch):Promise<DeliveryResult>{const key=environment.RESEND_API_KEY,from=environment.NOTIFICATION_EMAIL_FROM;if(!key||!from)return{status:'PREPARED',channel:'email',provider:'resend',reason:'provider_not_configured'};const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[message.to],subject:message.subject||'PEDAGO CONTROL',text:message.text})});if(!response.ok)return{status:'FAILED',channel:'email',provider:'resend',reason:'provider_rejected'};return{status:'SENT',channel:'email',provider:'resend',provider_message_id:await acceptedId(response)}}

/** Infobip reçoit uniquement du texte et un numéro normalisé ; la clé n'est jamais retournée. */
async function sendInfobip(message:DeliveryMessage,environment:NodeJS.ProcessEnv,fetcher:typeof fetch):Promise<DeliveryResult>{const key=environment.INFOBIP_API_KEY,base=environment.INFOBIP_BASE_URL,from=environment.INFOBIP_SMS_FROM;if(!key||!base||!from)return{status:'PREPARED',channel:'sms',provider:'infobip',reason:'provider_not_configured'};const response=await fetcher(`${base.replace(/\/$/,'')}/sms/2/text/advanced`,{method:'POST',headers:{Authorization:`App ${key}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({messages:[{from,destinations:[{to:normalizePhone(message.to)}],text:message.text}]})});if(!response.ok)return{status:'FAILED',channel:'sms',provider:'infobip',reason:'provider_rejected'};const body=await response.json().catch(()=>null)as{messages?:Array<{messageId?:string;status?:{groupName?:string}}>}|null;const accepted=body?.messages?.[0];if(!accepted?.messageId||accepted.status?.groupName==='REJECTED')return{status:'FAILED',channel:'sms',provider:'infobip',reason:'provider_rejected'};return{status:'SENT',channel:'sms',provider:'infobip',provider_message_id:accepted.messageId}}

/** Point d'entrée interchangeable et testable. DELIVERED reste réservé aux futurs webhooks fournisseurs. */
export async function deliverNotification(raw:DeliveryMessage,options:{environment?:NodeJS.ProcessEnv;fetcher?:typeof fetch}={}):Promise<DeliveryResult>{const environment=options.environment||process.env,mode=channelNotificationMode(raw.channel,environment),message=testMessage(raw,mode);if(!isRecipientAllowed(message,environment))return{status:'PREPARED',channel:message.channel,provider:message.channel==='email'?(mode==='sandbox'?'mailtrap':'resend'):'infobip',reason:'recipient_not_allowed'};if(message.channel==='email')return mode==='sandbox'?sendMailtrap(message,environment,options.fetcher||fetch):sendResend(message,environment,options.fetcher||fetch);if(mode==='sandbox')return{status:'SIMULATED',channel:'sms',provider:'simulated'};return sendInfobip(message,environment,options.fetcher||fetch)}
