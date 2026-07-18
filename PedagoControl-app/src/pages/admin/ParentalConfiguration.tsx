import { useEffect, useState } from 'react'
import { AdminPageState, value } from './AdminPageState'
import { useAdminPortal } from './useAdminPortal'
import { saveParentalConfiguration, schoolApiIdentifier, type ParentalSettings } from '../../services/adminParental'

function moduleStatus(settings: ParentalSettings | null | undefined) {
  if (!settings) return 'Indisponible'
  if (settings.is_enabled && settings.enabled_at && new Date(settings.enabled_at) > new Date()) return 'Programmé'
  return settings.is_enabled ? 'Actif' : 'Inactif'
}

export function ParentalConfigurationPage() {
  const state = useAdminPortal()
  const [draft, setDraft] = useState<ParentalSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => setDraft(state.data?.settings ? { ...state.data.settings } : null), [state.data?.settings])
  const status = moduleStatus(draft)
  const save = async () => {
    const schoolId = state.user ? schoolApiIdentifier(state.user, state.data?.school ?? null) : null
    if (!schoolId || !draft) return
    setSaving(true); setNotice('')
    try { await saveParentalConfiguration(schoolId, draft); setNotice('Configuration enregistrée avec succès.'); state.reload() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Enregistrement impossible.') }
    finally { setSaving(false) }
  }
  return <AdminPageState status={state.status} message={state.message} retry={state.reload}>
    <header className="admin-page-head"><div className="admin-page-icon">←</div><div><h1>Activation du Suivi parental</h1><p>Configurez l’accès des parents aux informations autorisées de leurs enfants.</p></div></header>
    {notice && <div className="admin-info" role="status">{notice}</div>}
    <div className="admin-config"><section className="admin-card admin-config-main">
      <h2>Statut actuel du suivi parental</h2><div className="admin-field-row"><label>Suivi parental</label><p>Le module est actuellement configuré pour cette école.</p><span className={`admin-status ${status === 'Inactif' ? 'off' : status === 'Programmé' ? 'scheduled' : ''}`}>{status}</span></div>
      <h2>Configuration de l’activation</h2>
      <div className="admin-field-row"><label>Activer le suivi parental</label><p>Permettre aux parents approuvés de suivre leurs enfants.</p><button aria-label="Activer le suivi parental" className={`admin-switch ${draft?.is_enabled ? 'on' : ''}`} onClick={() => draft && setDraft({ ...draft, is_enabled: !draft.is_enabled })} /></div>
      <div className="admin-field-row"><label>Date d’effet</label><p>Avant le 1er septembre, l’activation d’une inscription peut être programmée.</p><b>{value(draft?.enabled_at ? new Date(draft.enabled_at).toLocaleDateString('fr-FR') : null)}</b></div>
      <div className="admin-field-row"><label>Période facturable</label><p>La facturation du suivi couvre la période scolaire autorisée.</p><b>1er septembre – 15 juin</b></div>
      <div className="admin-field-row"><label>Prix unitaire actuel</label><p>Défini exclusivement par Management et non modifiable ici.</p><output className="admin-readonly">{state.data?.subscription?.unit_price_per_student ? `${state.data.subscription.unit_price_per_student} ${state.data.subscription.currency || 'USD'} / élève` : 'Donnée indisponible'}</output></div>
      <div className="admin-field-row"><label>Élèves suivis</label><p>Inscriptions dont le suivi parental est activé.</p><b>{value(state.data?.trackedStudents)}</b></div>
      <div className="admin-field-row"><label>Méthode de vérification</label><p>Vérification sécurisée du contact du parent.</p><select aria-label="Méthode de vérification" disabled><option>OTP par e-mail ou SMS</option></select></div>
      <div className="admin-field-row"><label>Validation des rattachements</label><p>L’école contrôle les demandes parent-enfant avant tout accès.</p><button aria-label="Validation des rattachements" className={`admin-switch ${draft?.attachment_requires_validation ? 'on' : ''}`} onClick={() => draft && setDraft({ ...draft, attachment_requires_validation: !draft.attachment_requires_validation })} /></div>
      <div className="admin-info"><strong>Informations accessibles</strong><br/>Les parents accèdent uniquement aux informations pédagogiques autorisées : journal quotidien, absences, communications et visas. Les données administratives sensibles et financières restent protégées.</div>
      <div className="admin-savebar"><button className="admin-button" disabled={!draft || saving} onClick={() => void save()}>{saving ? 'Enregistrement…' : 'Enregistrer la configuration'}</button></div>
    </section><aside className="admin-config-aside"><section className="admin-card"><h2>Étapes suivantes</h2><ol><li>Activer le suivi parental.</li><li>Inscrire ou valider les parents.</li><li>Examiner les demandes de rattachement.</li><li>Autoriser l’accès aux enfants concernés.</li></ol></section><section className="admin-card"><h2>Règles de facturation</h2><p className="admin-info">Aucun paiement direct n’est demandé au Parent. La facture est adressée à l’école selon le nombre d’élèves suivis.</p></section><section className="admin-card"><h2>Bon à savoir</h2><p>Le rôle Admin ne peut pas modifier le prix global défini par Management.</p></section></aside></div>
  </AdminPageState>
}
