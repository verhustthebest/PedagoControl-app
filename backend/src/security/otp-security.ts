import bcrypt from 'bcrypt'

export const hashOtp = (code: string) => bcrypt.hash(code, 10)
export const safelyCompareOtp = (code: string, hash: string) => bcrypt.compare(code, hash)

export function otpCanBeUsed(record: { status: string; expires_at: Date }, now = Date.now()) {
  return record.status === 'pending' && record.expires_at.getTime() > now
}

export function invalidatePendingOtp(status: string) {
  return status === 'pending' ? 'superseded' : status
}
