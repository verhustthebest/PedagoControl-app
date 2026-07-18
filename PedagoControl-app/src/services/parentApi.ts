import{apiErrorMessage,apiRequest}from'./api';import type{JournalHistoryItem,ParentChild,ParentJournal,ParentNotification,ParentPage}from'../types/parent';
const iso=(date:Date)=>date.toISOString().slice(0,10)
export const todayIso=()=>iso(new Date())
/** Empêche toute date future avant même l'appel ; le Backend reste la source d'autorité finale. */
export function assertPastOrToday(value:string){if(value>todayIso())throw new Error('Un journal futur ne peut pas être consulté.')}
/** Tous les appels enfant utilisent le public_id validé par le middleware Parent du Backend. */
export const parentApi={
 children:async()=>{const payload=await apiRequest<{children:ParentChild[]}>('/parental/me/children');return payload.children},
 journal:async(publicId:string,date:string)=>{assertPastOrToday(date);return apiRequest<ParentJournal>(`/parental/me/children/${encodeURIComponent(publicId)}/journals?date=${encodeURIComponent(date)}`)},
 acknowledge:async(publicId:string,date:string,comment?:string)=>{assertPastOrToday(date);return apiRequest<{acknowledgement:ParentJournal['acknowledgement']}>(`/parental/me/children/${encodeURIComponent(publicId)}/acknowledgements`,{method:'POST',body:JSON.stringify({journal_date:date,...(comment?.trim()?{comment:comment.trim()}:{})})},)},
 async notifications(page=1,unread=false):Promise<ParentPage<ParentNotification>>{const payload=await apiRequest<{notifications:ParentNotification[];pagination:{page:number;total:number;total_pages:number}}>(`/parental/me/notifications?page=${page}&limit=20${unread?'&unread=true':''}`);return{items:payload.notifications,page:payload.pagination.page,total:payload.pagination.total,pages:payload.pagination.total_pages}},
}
/** L'API est journalière : l'historique interroge progressivement des dates passées, sans inventer d'agrégat. */
export async function loadJournalHistory(publicId:string,days=14):Promise<{items:JournalHistoryItem[];errors:string[]}>{const dates=Array.from({length:days},(_,index)=>{const date=new Date();date.setDate(date.getDate()-index);return iso(date)});const settled=await Promise.allSettled(dates.map(date=>parentApi.journal(publicId,date)));const items:JournalHistoryItem[]=[];const errors:string[]=[];settled.forEach((entry,index)=>{if(entry.status==='fulfilled'&&(entry.value.lessons.length||entry.value.acknowledgement))items.push({date:dates[index],journal:entry.value});else if(entry.status==='rejected'&&!/No validated|not effective/i.test(apiErrorMessage(entry.reason)))errors.push(apiErrorMessage(entry.reason))});return{items,errors}}
export const latestEnrollment=(child:ParentChild)=>child.student.student_enrollments?.[0]
