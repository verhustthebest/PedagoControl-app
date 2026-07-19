export type NotificationDeliveryStatus='PREPARED'|'SIMULATED'|'SENT'|'DELIVERED'|'FAILED'
const labels:Record<NotificationDeliveryStatus,string>={PREPARED:'Préparée — non envoyée',SIMULATED:'Simulée — non envoyée',SENT:'Acceptée par le fournisseur',DELIVERED:'Livrée',FAILED:'Échec de l’envoi'}
const tones:Record<NotificationDeliveryStatus,string>={PREPARED:'prepared',SIMULATED:'simulated',SENT:'sent',DELIVERED:'delivered',FAILED:'failed'}
/** Distingue explicitement préparation, simulation, acceptation et livraison réelle. */
export function NotificationDeliveryBadge({status}:{status?:NotificationDeliveryStatus|null}){if(!status)return null;return <span className={`notification-delivery ${tones[status]}`}>{labels[status]}</span>}
export const notificationDeliveryLabel=(status:NotificationDeliveryStatus)=>labels[status]
