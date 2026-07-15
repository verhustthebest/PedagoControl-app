import { ParentalApiError } from './parental.service'

export type OtpChannel = 'email' | 'whatsapp' | 'sms'

type SendOtpInput = {
  channel: OtpChannel
  destination: string
  code: string
  schoolName: string
}

function isDevelopmentSimulationEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.OTP_USE_SIMULATED_PROVIDER !== 'false'
}

async function sendEmail(input: SendOtpInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.OTP_EMAIL_FROM
  if (!apiKey || !from) {
    throw new ParentalApiError('Email OTP provider is not configured', 503)
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.destination],
      subject: `Code d inscription - ${input.schoolName}`,
      text: `Votre code de verification est ${input.code}. Ne le partagez avec personne.`,
    }),
  })
  if (!response.ok) throw new ParentalApiError('Email OTP provider rejected the message', 502)
}

async function sendTwilio(input: SendOtpInput) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from =
    input.channel === 'whatsapp' ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM
  if (!accountSid || !authToken || !from) {
    throw new ParentalApiError(
      `${input.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} OTP provider is not configured`,
      503,
    )
  }

  const to = input.channel === 'whatsapp' ? `whatsapp:${input.destination}` : input.destination
  const sender = input.channel === 'whatsapp' && !from.startsWith('whatsapp:') ? `whatsapp:${from}` : from
  const body = new URLSearchParams({
    To: to,
    From: sender,
    Body: `Votre code Pedago Control est ${input.code}. Ne le partagez avec personne.`,
  })
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  )
  if (!response.ok) {
    throw new ParentalApiError(
      `${input.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} OTP provider rejected the message`,
      502,
    )
  }
}

export async function sendRegistrationOtp(input: SendOtpInput) {
  if (isDevelopmentSimulationEnabled()) {
    console.log(
      `[OTP DEV] channel=${input.channel} destination=${input.destination} code=${input.code}`,
    )
    return
  }

  if (input.channel === 'email') return sendEmail(input)
  return sendTwilio(input)
}
