import{apiRequest}from'./api'
export type SchoolClass={public_id:string;is_active:boolean;academic_year:{public_id:string;name:string};class:{public_id:string;name:string;parallel?:string|null;level:string;section?:string|null;is_active:boolean}}
export type Subject={public_id:string;name:string;code?:string|null;description?:string|null;class_subject_ids:string[];classes:Array<{annual_class_public_id:string;public_id:string;name:string;parallel?:string|null}>}
export type Staff={public_id:string;first_name:string;last_name:string;email:string;phone?:string|null;birth_date:string;is_active:boolean;roles:string[];assignments?:Array<{public_id:string;academic_year_subjects:{public_id:string;subjects:{public_id:string;name:string};academic_year_classes:{public_id:string;school_classes:{public_id:string;name:string;parallel?:string|null}}}}>}
export type StaffDelivery={status:'PREPARED'|'SIMULATED'|'SENT'|'DELIVERED'|'FAILED';channel:'email'|'sms';provider:'mailtrap'|'resend'|'simulated'|'infobip';reason?:string}
export type StaffCreation=Staff&{invitation:{email:StaffDelivery;sms:StaffDelivery|null;created_at:string;request_id:string|null}}
const q=(values:Record<string,unknown>)=>{const p=new URLSearchParams();Object.entries(values).forEach(([k,v])=>{if(v!==undefined&&v!=='')p.set(k,String(v))});return p.toString()}
export const adminAcademicApi={
 classes:(school:string,page=1)=>apiRequest<{classes:SchoolClass[];pagination:{page:number;total:number;total_pages:number}}>(`/schools/${encodeURIComponent(school)}/classes?${q({page,limit:20})}`),
 catalog:(school:string)=>apiRequest<{levels:string[];sections:string[];options_by_level:Record<string,string[]>}>(`/schools/${encodeURIComponent(school)}/academic-catalog`),
 saveClass:(school:string,body:Record<string,unknown>,id?:string)=>apiRequest<{class:SchoolClass}>(`/schools/${encodeURIComponent(school)}/classes${id?`/${encodeURIComponent(id)}`:''}`,{method:id?'PUT':'POST',body:JSON.stringify(body)}),
 deleteClass:(school:string,id:string)=>apiRequest<void>(`/schools/${encodeURIComponent(school)}/classes/${encodeURIComponent(id)}`,{method:'DELETE'}),
 subjects:(school:string)=>apiRequest<{subjects:Subject[]}>(`/schools/${encodeURIComponent(school)}/subjects`),
 saveSubject:(school:string,body:Record<string,unknown>,id?:string)=>apiRequest<{subject:Subject}>(`/schools/${encodeURIComponent(school)}/subjects${id?`/${encodeURIComponent(id)}`:''}`,{method:id?'PUT':'POST',body:JSON.stringify(body)}),
 deleteSubject:(school:string,id:string)=>apiRequest<void>(`/schools/${encodeURIComponent(school)}/subjects/${encodeURIComponent(id)}`,{method:'DELETE'}),
 staff:(school:string,role:string,search='')=>apiRequest<{staff:Staff[];pagination:{total:number}}>(`/schools/${encodeURIComponent(school)}/staff?${q({role,search,page:1,limit:100})}`),
 createStaff:(school:string,body:Record<string,unknown>)=>apiRequest<{staff:StaffCreation;request_id:string}>(`/schools/${encodeURIComponent(school)}/staff`,{method:'POST',body:JSON.stringify(body)}),
 updateStaff:(school:string,id:string,body:Record<string,unknown>)=>apiRequest<{staff:Staff}>(`/schools/${encodeURIComponent(school)}/staff/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(body)}),
 deleteStaff:(school:string,id:string)=>apiRequest(`/schools/${encodeURIComponent(school)}/staff/${encodeURIComponent(id)}`,{method:'DELETE'}),
 assign:(school:string,id:string,classSubjectIds:string[])=>apiRequest(`/schools/${encodeURIComponent(school)}/staff/${encodeURIComponent(id)}/assignments`,{method:'PUT',body:JSON.stringify({class_subject_ids:classSubjectIds})}),
}
