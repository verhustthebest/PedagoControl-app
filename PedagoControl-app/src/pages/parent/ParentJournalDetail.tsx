import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ParentHead, ParentState } from '../../components/parent/ParentState'
import { apiErrorMessage } from '../../services/api'
import { assertPastOrToday, parentApi } from '../../services/parentApi'
import type { ParentJournal } from '../../types/parent'

const controlLabel=(status:string)=>status==='validated'?'Validé par le Préfet':status==='correction_requested'?'En correction':'En attente de contrôle'

export function ParentJournalDetail(){
  const{publicId,date}=useParams()
  const[journal,setJournal]=useState<ParentJournal|null>(null)
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState('')
  const[comment,setComment]=useState('')
  const[saving,setSaving]=useState(false)
  // Tous les journaux envoyés sont visibles ; aucun brouillon n'est renvoyé par l'API.
  const lessons=useMemo(()=>journal?.lessons||[],[journal])
  const load=()=>{
    if(!publicId||!date)return
    setLoading(true);setError('')
    try{assertPastOrToday(date)}catch(error){setError(apiErrorMessage(error));setLoading(false);return}
    void parentApi.journal(publicId,date).then(setJournal).catch(error=>setError(apiErrorMessage(error))).finally(()=>setLoading(false))
  }
  useEffect(load,[publicId,date])
  const acknowledge=async()=>{
    if(!publicId||!date||saving||!lessons.length||journal?.acknowledgement)return
    if(!window.confirm('Confirmer le visa de ce journal ? Cette action est enregistrée.'))return
    setSaving(true);setError('')
    try{
      const result=await parentApi.acknowledge(publicId,date,comment)
      setJournal(current=>current?{...current,acknowledgement:result.acknowledgement}:current)
    }catch(error){setError(apiErrorMessage(error))}finally{setSaving(false)}
  }
  return <><ParentHead icon="✓" title="Journal quotidien" subtitle={date?`Journal envoyé du ${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR')}`:'Date indisponible'}/><ParentState loading={loading} error={error} empty={!journal} retry={load}>{journal&&<><section className="parent-card"><strong>Statut du contrôle</strong><p><span className="parent-status">{controlLabel(journal.control_status)}</span></p></section><section className="parent-card parent-lessons">{lessons.length?lessons.map((lesson,index)=><article className="parent-lesson" key={`${lesson.subject}-${index}`}><div><strong>{lesson.start_time||'Horaire indisponible'}</strong></div><div><h3>{lesson.subject}</h3><span>{lesson.teacher.first_name} {lesson.teacher.last_name}</span></div><div><strong>Contenu réalisé</strong><p>{lesson.summary||'Aucun contenu communiqué.'}</p>{lesson.homework&&<><strong>Travail à domicile</strong><p>{lesson.homework}</p></>}</div><div><span className="parent-status">{controlLabel(lesson.validation_status)}</span>{lesson.observations&&<p>{lesson.observations}</p>}</div></article>):<div className="parent-empty">Aucun journal envoyé pour cette date.</div>}</section><section className="parent-card parent-visa"><h2>Visa parental journalier</h2>{journal.acknowledgement?<div className="parent-success">Journal visé le {new Date(journal.acknowledgement.acknowledged_at).toLocaleString('fr-FR')} — {journal.acknowledgement.lesson_count_snapshot} cours conservés dans le snapshot.</div>:<><p>Votre visa confirme la consultation des {lessons.length} cours envoyés, sans attendre le contrôle du Préfet.</p><textarea className="parent-comment" maxLength={500} value={comment} onChange={event=>setComment(event.target.value)} placeholder="Commentaire facultatif (texte uniquement)"/><div className="parent-actions"><button className="parent-button" disabled={!lessons.length||saving} onClick={acknowledge}>{saving?'Enregistrement…':'Confirmer le visa'}</button></div></>}</section></>}</ParentState></>
}
