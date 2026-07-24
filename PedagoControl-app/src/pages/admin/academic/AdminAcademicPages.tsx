import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth'
import { PageHeader } from '../../../components/adminParental/PageHeader'
import { ResourceState } from '../../../components/adminParental/ResourceState'
import { StatusBadge } from '../../../components/adminParental/StatusBadge'
import { adminAcademicApi, type SchoolClass, type Staff, type StaffCreation, type Subject } from '../../../services/adminAcademic'
import { apiErrorMessage } from '../../../services/api'

const adult = (date: string) => {
  const birth = new Date(date)
  const limit = new Date()
  limit.setFullYear(limit.getFullYear() - 18)
  return birth <= limit
}

export function AdminClassesPage() {
  const { user } = useAuth()
  const school = user?.school_id
  const [items, setItems] = useState<SchoolClass[]>([])
  const [catalog, setCatalog] = useState({ levels: [] as string[], sections: [] as string[], options_by_level: {} as Record<string,string[]> })
  const [form, setForm] = useState({ name: '', level: '', section: '', section_other: '', parallel: '' })
  const [editing, setEditing] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => {
    if (!school) return
    setLoading(true)
    Promise.all([adminAcademicApi.classes(school), adminAcademicApi.catalog(school)])
      .then(([result, values]) => { setItems(result.classes); setCatalog(values); setError('') })
      .catch(reason => setError(apiErrorMessage(reason))).finally(() => setLoading(false))
  }
  useEffect(load, [school])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!school) return
    try {
      await adminAcademicApi.saveClass(school, form, editing || undefined)
      setForm({ name: '', level: '', section: '', section_other: '', parallel: '' }); setEditing(''); load()
    } catch (reason) { setError(apiErrorMessage(reason)) }
  }
  return <><PageHeader icon="◇" title="Classes & Sections" subtitle="Gérez les classes rattachées à l’année scolaire active." />
    <section className="admin-card academic-form"><h2>{editing ? 'Modifier la classe' : 'Créer une classe'}</h2><form onSubmit={submit}>
      <label>Classe<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label>Cycle / Niveau *<select required value={form.level} onChange={e => setForm({ ...form, level: e.target.value, section: '', section_other: '' })}><option value="">Sélectionner</option>{catalog.levels.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Section / Filière / Option<select value={form.section} onChange={e => setForm({ ...form, section: e.target.value, section_other: '' })}><option value="">Sans section</option>{(catalog.options_by_level[form.level] || []).map(value => <option key={value}>{value}</option>)}<option value="Autre">Autre</option></select></label>
      {form.section === 'Autre' && <label>Nouvelle section autorisée *<input required value={form.section_other} onChange={e => setForm({ ...form, section_other: e.target.value })} /></label>}
      <label>Parallèle<input value={form.parallel} onChange={e => setForm({ ...form, parallel: e.target.value })} /></label>
      <button className="admin-button">{editing ? 'Enregistrer' : 'Créer la classe'}</button>
    </form></section>
    <ResourceState loading={loading} error={error} empty={!items.length} retry={load}><div className="admin-card resource-table-wrap"><table className="resource-table"><thead><tr><th>Année</th><th>Niveau</th><th>Classe</th><th>Section</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.public_id}><td>{item.academic_year.name}</td><td>{item.class.level}</td><td>{item.class.name} {item.class.parallel}</td><td>{item.class.section || '—'}</td><td><StatusBadge status={item.is_active ? 'Actif' : 'Inactif'} /></td><td><button onClick={() => { setEditing(item.public_id); setForm({ name: item.class.name, level: item.class.level, section: item.class.section || '', section_other: '', parallel: item.class.parallel || '' }) }}>Modifier</button> <button onClick={() => school && confirm('Désactiver cette classe ?') && adminAcademicApi.deleteClass(school, item.public_id).then(load).catch(reason => setError(apiErrorMessage(reason)))}>Désactiver</button></td></tr>)}</tbody></table></div></ResourceState></>
}

export function AdminSubjectsPage() {
  const { user } = useAuth(); const school = user?.school_id
  const [items, setItems] = useState<Subject[]>([]), [classes, setClasses] = useState<SchoolClass[]>([])
  const [form, setForm] = useState({ name: '', code: '', description: '', class_ids: [] as string[] })
  const [editing, setEditing] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const load = () => {
    if (!school) return
    setLoading(true)
    Promise.all([adminAcademicApi.subjects(school), adminAcademicApi.classes(school)]).then(([subjects, annual]) => {
      setItems(subjects.subjects); setClasses(annual.classes); setError('')
    }).catch(reason => setError(apiErrorMessage(reason))).finally(() => setLoading(false))
  }
  useEffect(load, [school])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!school) return
    try { await adminAcademicApi.saveSubject(school, form, editing || undefined); setForm({ name: '', code: '', description: '', class_ids: [] }); setEditing(''); load() }
    catch (reason) { setError(apiErrorMessage(reason)) }
  }
  return <><PageHeader icon="▤" title="Matières" subtitle="Rattachez chaque matière aux classes de l’année active." />
    <section className="admin-card academic-form"><form onSubmit={submit}><label>Nom de la matière *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Code de la matière<input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></label><fieldset><legend>Classes concernées *</legend>{!classes.length&&<p>Créez d’abord une classe avant d’ajouter une matière.</p>}{classes.map(item => <label key={item.public_id}><input type="checkbox" checked={form.class_ids.includes(item.public_id)} onChange={e => setForm({ ...form, class_ids: e.target.checked ? [...form.class_ids, item.public_id] : form.class_ids.filter(id => id !== item.public_id) })} />{item.class.name} {item.class.parallel}</label>)}</fieldset><button className="admin-button" disabled={!form.class_ids.length}>{editing ? 'Enregistrer' : 'Créer la matière'}</button></form></section>
    <ResourceState loading={loading} error={error} empty={!items.length} retry={load}><div className="admin-card resource-table-wrap"><table className="resource-table"><thead><tr><th>Matière</th><th>Code</th><th>Classes</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.public_id}><td>{item.name}</td><td>{item.code || '—'}</td><td>{item.classes.map(value => value.name).join(', ')}</td><td><button onClick={() => { setEditing(item.public_id); setForm({ name: item.name, code: item.code || '', description: item.description || '', class_ids: item.classes.map(value => value.annual_class_public_id) }) }}>Modifier</button> <button onClick={() => school && confirm('Retirer cette matière ?') && adminAcademicApi.deleteSubject(school, item.public_id).then(load).catch(reason => setError(apiErrorMessage(reason)))}>Retirer</button></td></tr>)}</tbody></table></div></ResourceState></>
}

export function AdminStaffPage({ role }: { role: 'PREFET_DES_ETUDES' | 'ENSEIGNANT' }) {
  const { user } = useAuth(); const school = user?.school_id
  const [items, setItems] = useState<Staff[]>([]), [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState({ first_name: '', last_name: '', birth_date: '', email: '', phone: '', role })
  const [error, setError] = useState(''), [success, setSuccess] = useState('')
  const [delivery, setDelivery] = useState<StaffCreation['invitation'] | null>(null)
  const [loading, setLoading] = useState(true), [selected, setSelected] = useState<Staff | null>(null)
  const [assignments, setAssignments] = useState<string[]>([])
  const load = () => {
    if (!school) return
    setLoading(true)
    Promise.all([adminAcademicApi.staff(school, role), role === 'ENSEIGNANT' ? adminAcademicApi.subjects(school) : Promise.resolve({ subjects: [] })])
      .then(([staff, materials]) => { setItems(staff.staff); setSubjects(materials.subjects); setError('') })
      .catch(reason => setError(apiErrorMessage(reason))).finally(() => setLoading(false))
  }
  useEffect(load, [school, role])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!school) return
    if (!adult(form.birth_date)) { setError('La personne doit être âgée d’au moins 18 ans.'); return }
    try {
      setError(''); setDelivery(null)
      const result = await adminAcademicApi.createStaff(school, form)
      setDelivery(result.staff.invitation)
      setSuccess('Compte créé. Invitation sécurisée et notification interne enregistrées. Résultat réel :')
      setForm({ first_name: '', last_name: '', birth_date: '', email: '', phone: '', role }); load()
    } catch (reason) { setError(apiErrorMessage(reason)) }
  }
  return <><PageHeader icon="♙" title={role === 'ENSEIGNANT' ? 'Gestion des enseignants' : 'Préfet des Études'} subtitle="Comptes réels de l’école et invitations sécurisées, sans mot de passe transmis." />
    <section className="admin-card academic-form"><form onSubmit={submit}><label>Prénom<input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></label><label>Nom<input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></label><label>Date de naissance<input required type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></label><label>E-mail<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Téléphone<input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><button className="admin-button">Créer et inviter</button></form>
      {success && <div className="admin-success">{success}</div>}
      {delivery && <div className="staff-delivery" aria-live="polite"><p><strong>E-mail</strong> — {delivery.email.provider} : <StatusBadge status={delivery.email.status} /></p><p><strong>SMS</strong> — {delivery.sms?.provider || 'non demandé'} : <StatusBadge status={delivery.sms?.status || 'PREPARED'} /></p><small>{new Date(delivery.created_at).toLocaleString('fr-CD')} · request_id : {delivery.request_id || 'non fourni'}</small></div>}
    </section>
    <ResourceState loading={loading} error={error} empty={!items.length} retry={load}><div className="admin-card resource-table-wrap"><table className="resource-table"><thead><tr><th>Nom</th><th>Contact</th><th>Statut</th><th>Affectations</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.public_id}><td>{item.first_name} {item.last_name}</td><td>{item.phone || item.email}</td><td><StatusBadge status={item.is_active ? 'Actif' : 'Inactif'} /></td><td>{item.assignments?.length || 0}</td><td>{role === 'ENSEIGNANT' && <button onClick={() => { setSelected(item); setAssignments(item.assignments?.map(link => link.academic_year_subjects.public_id) || []) }}>Affecter</button>} <button onClick={() => school && confirm('Désactiver ce compte ?') && adminAcademicApi.deleteStaff(school, item.public_id).then(load).catch(reason => setError(apiErrorMessage(reason)))}>Désactiver</button></td></tr>)}</tbody></table></div></ResourceState>
    {selected && <section className="admin-card academic-assign"><h2>Affectations de {selected.first_name} {selected.last_name}</h2>{subjects.flatMap(subject => subject.class_subject_ids.map((id, index) => <label key={id}><input type="checkbox" checked={assignments.includes(id)} onChange={e => setAssignments(e.target.checked ? [...assignments, id] : assignments.filter(value => value !== id))} />{subject.name} — {subject.classes[index]?.name}</label>))}<button className="admin-button" onClick={() => school && adminAcademicApi.assign(school, selected.public_id, assignments).then(() => { setSelected(null); load() }).catch(reason => setError(apiErrorMessage(reason)))}>Enregistrer les affectations</button></section>}
  </>
}
