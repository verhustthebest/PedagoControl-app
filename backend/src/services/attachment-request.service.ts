import { randomUUID } from 'crypto'
import prisma from '../prisma/client'
import { ParentalApiError } from './parental.service'

const STATUS = { draft: 'BROUILLON', pending: 'EN_ATTENTE', approved: 'APPROUVE', rejected: 'REFUSE', disabled: 'DESACTIVE' } as const
const MIME = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const maxDocumentBytes = () => Number(process.env.ATTACHMENT_MAX_BYTES || 5_242_880)
const cleanName = (value: string) => value.normalize('NFKC').replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 180)
const externalStatus = (value: string) => STATUS[value as keyof typeof STATUS] || value.toUpperCase()

function requestView(request: any) {
  return {
    public_id: request.public_id, request_code: request.request_code, relationship_type: request.relationship_type,
    status: externalStatus(request.status), request_message: request.request_message, review_comment: request.review_comment,
    submitted_at: request.submitted_at, reviewed_at: request.reviewed_at, expires_at: request.expires_at,
    guardian: { public_id: request.guardians.public_id, first_name: request.guardians.first_name, last_name: request.guardians.last_name, phone: request.guardians.phone, email: request.guardians.email },
    student: { public_id: request.students.public_id, matricule: request.students.matricule, first_name: request.students.first_name, last_name: request.students.last_name },
    documents: request.attachment_request_documents?.filter((item: any) => !item.removed_at).map((item: any) => ({ public_id: item.public_id, document_type: item.document_type, file_name: item.original_file_name, mime_type: item.file_type, file_size: item.file_size.toString(), created_at: item.created_at })) ?? [],
  }
}

const include = { guardians: true, students: true, attachment_request_documents: true } as const

/** Crée une demande en attente : le portail Parent reste fermé jusqu'à la décision Admin. */
export async function createAttachmentRequest(schoolId:string,actorId:string,input:{student_id:string;guardian_id:string;relationship_type:string;request_message?:string|null}){
  const school=BigInt(schoolId)
  const[student,guardian]=await Promise.all([
    prisma.students.findFirst({where:{public_id:input.student_id,school_id:school,status:'active'},select:{id:true}}),
    prisma.guardians.findFirst({where:{public_id:input.guardian_id,school_id:school,status:'active'},select:{id:true}}),
  ])
  if(!student||!guardian)throw new ParentalApiError('Resource not found',404)
  const existing=await prisma.attachment_requests.findFirst({where:{school_id:school,student_id:student.id,guardian_id:guardian.id,status:{in:['pending','approved']}},select:{id:true}})
  if(existing)throw new ParentalApiError('Une demande active existe déjà pour ce rattachement.',409)
  const request=await prisma.$transaction(async transaction=>{
    const created=await transaction.attachment_requests.create({data:{
      school_id:school,student_id:student.id,guardian_id:guardian.id,requested_by_user_id:BigInt(actorId),
      request_code:`ATT-${randomUUID()}`,relationship_type:input.relationship_type,status:'pending',
      request_message:input.request_message||null,
    },include})
    await transaction.activity_logs.create({data:{school_id:school,user_id:BigInt(actorId),activity_type:'attachment_request_created',module_name:'parental_tracking',reference_table:'attachment_requests',reference_id:created.id,title:'Demande de rattachement créée',description:'La demande attend une décision de l’Admin école.'}})
    return created
  })
  return requestView(request)
}

/** Liste uniquement les demandes appartenant à l'école authentifiée. */
export async function listAttachmentRequests(schoolId: string, input: { status?: string; search?: string; from?: string; to?: string; page?: string; limit?: string }) {
  const page = Number(input.page || 1), limit = Math.min(Number(input.limit || 20), 100)
  const statusMap: Record<string,string> = { BROUILLON:'draft', EN_ATTENTE:'pending', APPROUVE:'approved', REFUSE:'rejected', DESACTIVE:'disabled' }
  const where: any = { school_id: BigInt(schoolId), ...(input.status ? { status: statusMap[input.status] } : {}), ...(input.from || input.to ? { submitted_at: { ...(input.from ? { gte: new Date(input.from) } : {}), ...(input.to ? { lte: new Date(`${input.to}T23:59:59.999Z`) } : {}) } } : {}) }
  if (input.search) where.OR = [{ guardians: { first_name: { contains: input.search, mode:'insensitive' } } }, { guardians: { last_name: { contains: input.search, mode:'insensitive' } } }, { students: { first_name: { contains: input.search, mode:'insensitive' } } }, { students: { last_name: { contains: input.search, mode:'insensitive' } } }]
  const [items,total] = await prisma.$transaction([prisma.attachment_requests.findMany({ where, include, orderBy:{submitted_at:'desc'}, skip:(page-1)*limit, take:limit }), prisma.attachment_requests.count({where})])
  return { requests: items.map(requestView), pagination:{page,limit,total,total_pages:Math.ceil(total/limit)} }
}

/** Charge une demande par identifiant public et école, évitant tout IDOR inter-écoles. */
export async function getAttachmentRequest(schoolId: string, publicId: string) {
  const request = await prisma.attachment_requests.findFirst({ where:{public_id:publicId,school_id:BigInt(schoolId)}, include })
  if (!request) throw new ParentalApiError('Resource not found',404)
  return requestView(request)
}

/** Décide atomiquement une demande et crée/réactive le lien uniquement lors d'une approbation. */
export async function decideAttachmentRequest(schoolId: string, publicId: string, actorId: string, decision: 'APPROUVE'|'REFUSE', reason?: string) {
  if (decision==='REFUSE' && !reason?.trim()) throw new ParentalApiError('A refusal reason is required',400)
  return prisma.$transaction(async tx => {
    const request = await tx.attachment_requests.findFirst({where:{public_id:publicId,school_id:BigInt(schoolId)},include:{guardians:true}})
    if (!request) throw new ParentalApiError('Resource not found',404)
    if (request.status!=='pending') throw new ParentalApiError('Request already processed',409)
    const now=new Date(), status=decision==='APPROUVE'?'approved':'rejected'
    const updated=await tx.attachment_requests.update({where:{id:request.id},data:{status,review_comment:reason?.trim()||null,reviewed_by_user_id:BigInt(actorId),reviewed_at:now,updated_at:now},include})
    if(decision==='APPROUVE') await tx.student_guardians.upsert({where:{student_id_guardian_id:{student_id:request.student_id,guardian_id:request.guardian_id}},update:{status:'active',relationship_type:request.relationship_type,validated_by_user_id:BigInt(actorId),validated_at:now,updated_at:now},create:{student_id:request.student_id,guardian_id:request.guardian_id,relationship_type:request.relationship_type,status:'active',validated_by_user_id:BigInt(actorId),validated_at:now}})
    if(request.guardians.user_id) await tx.notifications.create({data:{recipient_user_id:request.guardians.user_id,sender_user_id:BigInt(actorId),title:'Demande de rattachement traitée',message:decision==='APPROUVE'?'Votre demande a été approuvée.':'Votre demande a été refusée.',notification_type:'attachment_request_decision',reference_table:'attachment_requests',reference_id:request.id}})
    await tx.activity_logs.create({data:{school_id:BigInt(schoolId),user_id:BigInt(actorId),activity_type:`attachment_request_${status}`,module_name:'parental_tracking',reference_table:'attachment_requests',reference_id:request.id,title:'Décision de rattachement',description:`Demande ${status}.`}})
    return requestView(updated)
  })
}

export async function disableAttachment(schoolId:string, publicId:string, actorId:string, reason:string){if(!reason.trim())throw new ParentalApiError('A reason is required',400);return prisma.$transaction(async tx=>{const request=await tx.attachment_requests.findFirst({where:{public_id:publicId,school_id:BigInt(schoolId)}});if(!request||request.status!=='approved')throw new ParentalApiError('Resource not found',404);await tx.student_guardians.updateMany({where:{student_id:request.student_id,guardian_id:request.guardian_id},data:{status:'inactive',updated_at:new Date()}});const updated=await tx.attachment_requests.update({where:{id:request.id},data:{status:'disabled',review_comment:reason,updated_at:new Date()},include});return requestView(updated)})}

export async function addAttachmentDocument(schoolId:string,requestPublicId:string,userId:string,input:{document_type:string;file_name:string;mime_type:string;file_size:number;file_url?:string;storage_key?:string}){if(!MIME.has(input.mime_type))throw new ParentalApiError('Unsupported document type',400);if(input.file_size<=0||input.file_size>maxDocumentBytes())throw new ParentalApiError('Invalid document size',400);if(!input.file_url&&!input.storage_key)throw new ParentalApiError('External storage reference required',400);if(input.file_url&&!/^https:\/\//i.test(input.file_url))throw new ParentalApiError('A secure external URL is required',400);const request=await prisma.attachment_requests.findFirst({where:{public_id:requestPublicId,school_id:BigInt(schoolId)}});if(!request)throw new ParentalApiError('Resource not found',404);if(!['draft','pending'].includes(request.status))throw new ParentalApiError('Request already processed',409);const document=await prisma.attachment_request_documents.create({data:{attachment_request_id:request.id,uploaded_by_user_id:BigInt(userId),document_type:input.document_type,original_file_name:cleanName(input.file_name),stored_file_name:`${randomUUID()}${input.mime_type==='application/pdf'?'.pdf':input.mime_type==='image/png'?'.png':'.jpg'}`,file_type:input.mime_type,file_size:BigInt(input.file_size),file_url:input.file_url||'',storage_key:input.storage_key}});return {public_id:document.public_id,document_type:document.document_type,file_name:document.original_file_name,mime_type:document.file_type,file_size:document.file_size.toString()}}

export async function removeAttachmentDocument(schoolId:string,requestPublicId:string,documentPublicId:string){const request=await prisma.attachment_requests.findFirst({where:{public_id:requestPublicId,school_id:BigInt(schoolId)}});if(!request||!['draft','pending'].includes(request.status))throw new ParentalApiError('Resource not found',404);const result=await prisma.attachment_request_documents.updateMany({where:{public_id:documentPublicId,attachment_request_id:request.id,removed_at:null},data:{removed_at:new Date()}});if(result.count!==1)throw new ParentalApiError('Resource not found',404)}
