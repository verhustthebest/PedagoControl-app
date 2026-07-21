import { useEffect, useState, type FormEvent } from 'react'
import { NotificationDeliveryBadge } from '../../components/common/NotificationDeliveryBadge'
import { apiErrorMessage } from '../../services/api'
import {
  notificationTestsApi,
  type TestConfig,
  type TestResult,
  type TestWorkflow,
} from '../../services/notificationTests'
import './management-notification-tests.css'

const workflows: [TestWorkflow, string][] = [
  ['PARENT_OTP', 'OTP Parent'],
  ['PARENT_INVITATION', 'Invitation Parent'],
  ['ATTACHMENT_DECISION', 'Décision de rattachement'],
  ['PARENT_CONTRIBUTION_REMINDER', 'Rappel de contribution Parent'],
  ['SCHOOL_INVOICE', 'Notification de facture école'],
]

/** Centre sans secret : aucun OTP ou token n'est généré ni affiché dans le navigateur. */
export function ManagementNotificationTests() {
  const [config, setConfig] = useState<TestConfig | null>(null)
  const [workflow, setWorkflow] = useState<TestWorkflow>('PARENT_OTP')
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [destination, setDestination] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    notificationTestsApi.config()
      .then(setConfig)
      .catch((caught) => setError(apiErrorMessage(caught)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedDestination = destination.trim()
    if (!normalizedDestination) {
      setError('Renseignez un destinataire autorisé avant d’exécuter le test.')
      return
    }

    setSending(true)
    setError('')
    setResult(null)
    try {
      const response = await notificationTestsApi.send({
        workflow,
        channel,
        destination: normalizedDestination,
      })
      setResult(response)
    } catch (caught) {
      // Toute erreur est rendue visible, avec le request_id ajouté par apiErrorMessage lorsqu'il existe.
      setError(apiErrorMessage(caught))
    } finally {
      setSending(false)
    }
  }

  return <section className="mnt-page">
    <header>
      <h2>Centre de tests e-mail et SMS</h2>
      <p>Diagnostic sécurisé des workflows réels de notification.</p>
    </header>
    {loading
      ? <div className="mnt-card">Chargement sécurisé…</div>
      : error && !config
        ? <div className="mnt-card mnt-error">{error}<button type="button" onClick={load}>Recharger</button></div>
        : config && <>
          <div className="mnt-overview">
            <article><span>Mode actif</span><b>{config.mode === 'test_live' ? 'Test réel contrôlé' : 'Sandbox'}</b></article>
            {Object.entries(config.providers).map(([provider, enabled]) => <article key={provider}>
              <span>{provider[0].toUpperCase() + provider.slice(1)}</span>
              <b className={enabled ? 'ok' : 'off'}>{enabled ? 'Configuré' : 'Non configuré'}</b>
            </article>)}
          </div>
          {/* noValidate évite qu'une validation native bloque silencieusement le submit. */}
          <form className="mnt-card mnt-form" onSubmit={submit} noValidate>
            <label>Workflow
              <select value={workflow} onChange={(event) => setWorkflow(event.target.value as TestWorkflow)}>
                {workflows.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>Canal
              <select value={channel} onChange={(event) => setChannel(event.target.value as 'email' | 'sms')}>
                <option value="email">E-mail</option><option value="sms">SMS</option>
              </select>
            </label>
            <label>Destinataire autorisé
              <input
                type={channel === 'email' ? 'email' : 'tel'}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder={channel === 'email' ? 'adresse de la liste blanche' : 'numéro de la liste blanche'}
              />
            </label>
            <p>En mode test réel, seul un destinataire présent dans la liste blanche Backend peut recevoir le message.</p>
            {error && <div className="mnt-error" role="alert">{error}</div>}
            <button type="submit" disabled={sending}>{sending ? 'Envoi en cours…' : 'Exécuter le test'}</button>
          </form>
          {result && <article className="mnt-card mnt-result">
            <h3>Résultat réel</h3>
            <dl>
              <div><dt>Canal</dt><dd>{result.channel === 'email' ? 'E-mail' : 'SMS'}</dd></div>
              <div><dt>Fournisseur</dt><dd>{result.provider}</dd></div>
              <div><dt>Statut</dt><dd><NotificationDeliveryBadge status={result.status} /></dd></div>
              <div><dt>Heure</dt><dd>{new Date(result.created_at).toLocaleString('fr-FR')}</dd></div>
              <div><dt>Référence</dt><dd>{result.public_id}</dd></div>
              <div><dt>request_id</dt><dd>{result.request_id}</dd></div>
            </dl>
          </article>}
        </>}
  </section>
}
