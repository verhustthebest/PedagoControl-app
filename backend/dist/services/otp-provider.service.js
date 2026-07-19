"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRegistrationOtp = sendRegistrationOtp;
const abuse_protection_1 = require("../security/abuse-protection");
const notification_delivery_service_1 = require("./notification-delivery.service");
/** Envoie l'OTP via l'architecture commune sans jamais journaliser le code complet. */
async function sendRegistrationOtp(input) { const result = await (0, notification_delivery_service_1.deliverNotification)({ channel: input.channel === 'email' ? 'email' : 'sms', to: input.destination, subject: `Code d'inscription - ${input.schoolName}`, text: `Votre code de vérification est ${input.code}. Ne le partagez avec personne.` }); console.info(JSON.stringify({ event: 'otp_delivery', channel: input.channel, destination: (0, abuse_protection_1.maskContact)(input.destination), status: result.status, provider: result.provider })); return result; }
