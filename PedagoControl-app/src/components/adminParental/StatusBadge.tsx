export function StatusBadge({ status }: { status?: string | null }) {
  const value = status || 'Indisponible'
  const tone = /actif|approuv|valid/i.test(value) ? 'ok' : /programm|attente|brouillon/i.test(value) ? 'pending' : /refus|désactiv|inactif/i.test(value) ? 'danger' : 'neutral'
  return <span className={`resource-status ${tone}`}>{value}</span>
}
