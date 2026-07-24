import bcrypt from 'bcrypt'
import {createHash,randomBytes}from'crypto'
import prisma from '../prisma/client'
import {assertPhoneAvailable,normalizeDrcPhone}from'../security/phone-identity'
import {issueActionToken}from'./action-token.service'
import {deliverNotification}from'./notification-delivery.service'
import type {DeliveryResult}from'./notification-delivery.service'
import {consumeActionToken}from'./action-token.service'

export class SchoolStaffError extends Error {
  constructor(message:string, readonly status:number) { super(message) }
}
const opaque=(schoolId:bigint,kind:string,id:bigint)=>{const hash=createHash('sha256').update(`${kind}:${schoolId}:${id}`).digest('hex');return`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`}

const QUOTA_MESSAGE = 'Impossible de créer un autre compte Enseignant : le quota autorisé par votre abonnement est atteint. Veuillez contacter l’Administrateur PEDAGO CONTROL.'

type StaffInput = {
  first_name:string;last_name:string;birth_date:string;email:string;phone:string;
  role:'PREFET_DES_ETUDES'|'ENSEIGNANT'|'DIRECTEUR'|'PROMOTEUR'|'INFORMATICIEN'
}

/** Crée un personnel majeur dans l'école courante et applique le quota d'abonnement sous transaction. */
export async function createSchoolStaff(schoolId:bigint,input:StaffInput,actorId:string,requestId?:string) {
  if(input.phone)input.phone=normalizeDrcPhone(input.phone)
  const passwordHash=await bcrypt.hash(randomBytes(32).toString('base64url'),12)
  const staff=await prisma.$transaction(async transaction=>{
    if(input.phone)await assertPhoneAvailable({phone:input.phone,first_name:input.first_name,last_name:input.last_name,schoolId},transaction)
    const role=await transaction.roles.findUnique({where:{name:input.role}})
    if(!role?.is_active)throw new SchoolStaffError('Ce rôle n’est pas disponible.',400)
    if(input.role==='INFORMATICIEN'){
      const settings=await transaction.school_parental_settings.findUnique({where:{school_id:schoolId}})
      if(!settings?.is_enabled)throw new SchoolStaffError('Le module Suivi parental n’est pas activé pour cette école.',403)
    }
    if(input.role==='ENSEIGNANT'){
      const subscription=await transaction.school_subscriptions.findFirst({
        where:{school_id:schoolId,status:'active',start_date:{lte:new Date()},end_date:{gte:new Date()}},
        orderBy:{created_at:'desc'},select:{teacher_limit:true},
      })
      if(!subscription)throw new SchoolStaffError('Aucun abonnement actif ne permet cette création.',409)
      const teachers=await transaction.user_roles.count({where:{role_id:role.id,users:{school_id:schoolId,is_active:true}}})
      if(teachers>=subscription.teacher_limit)throw new SchoolStaffError(QUOTA_MESSAGE,409)
    }
    const emailOwner=await transaction.users.findFirst({where:{email:{equals:input.email,mode:'insensitive'}},select:{id:true}})
    if(emailOwner)throw new SchoolStaffError('Cet e-mail est déjà associé à un compte utilisateur.',409)
    const user=await transaction.users.create({data:{
      school_id:schoolId,first_name:input.first_name,last_name:input.last_name,
      birth_date:new Date(`${input.birth_date}T00:00:00.000Z`),email:input.email,phone:input.phone,
      password_hash:passwordHash,is_active:false,
    },select:{id:true,public_id:true,first_name:true,last_name:true,email:true,is_active:true,created_at:true}})
    await transaction.user_roles.create({data:{user_id:user.id,role_id:role.id}})
    const {id:_,...publicUser}=user
    return {...publicUser,role:role.name}
  })
  const internal=await prisma.users.findUniqueOrThrow({where:{public_id:staff.public_id},select:{id:true}})
  const invitation=await issueActionToken('invitation',{userId:internal.id.toString()})
  const link=`${(process.env.FRONTEND_URLS||'').split(',')[0].replace(/\/$/,'')}/invitation?token=${encodeURIComponent(invitation.token)}`
  const email=await deliverNotification({channel:'email',to:input.email,subject:'Invitation PEDAGO CONTROL',text:`Votre compte a été créé. Activez-le via ce lien sécurisé : ${link}`})
  const sms=input.phone?await deliverNotification({channel:'sms',to:input.phone,text:`PEDAGO CONTROL : une invitation sécurisée a été envoyée pour activer votre compte.`}):null
  const occurredAt=new Date()
  const deliverySummary=(delivery:DeliveryResult|null)=>delivery?`${delivery.channel}:${delivery.provider}:${delivery.status}`:'sms:non_demande'
  await prisma.$transaction([
    prisma.notifications.create({data:{
      recipient_user_id:BigInt(actorId),sender_user_id:BigInt(actorId),
      title:input.role==='ENSEIGNANT'?'Enseignant créé':'Préfet créé',
      message:`${staff.first_name} ${staff.last_name} — invitation ${deliverySummary(email)}, ${deliverySummary(sms)}.`,
      notification_type:'school_staff_created',reference_table:'users',reference_id:internal.id,
    }}),
    prisma.activity_logs.create({data:{
      school_id:schoolId,user_id:BigInt(actorId),activity_type:'school_staff_created',module_name:'school_staff',
      reference_table:'users',reference_id:internal.id,title:'Compte scolaire créé',
      description:JSON.stringify({role:staff.role,email:{provider:email.provider,status:email.status},sms:sms?{provider:sms.provider,status:sms.status}:null,request_id:requestId??null}),
    }}),
  ])
  return{...staff,invitation:{email,sms,created_at:occurredAt.toISOString(),request_id:requestId??null}}
}

/** Active une invitation opaque à usage unique sans jamais exposer le mot de passe. */
export async function acceptStaffInvitation(token:string,password:string){
  const action=await consumeActionToken(token,'invitation')
  if(!action.user_id)throw new SchoolStaffError('Invitation invalide ou expirée.',400)
  const passwordHash=await bcrypt.hash(password,12)
  const user=await prisma.users.update({
    where:{id:action.user_id},data:{password_hash:passwordHash,is_active:true},
    select:{public_id:true,user_roles:{select:{roles:{select:{name:true}}}}},
  })
  const school=await prisma.users.findUnique({where:{id:action.user_id},select:{school_id:true}})
  if(school?.school_id)await prisma.activity_logs.create({data:{
    school_id:school.school_id,user_id:action.user_id,activity_type:'school_staff_invitation_accepted',
    module_name:'school_staff',reference_table:'users',reference_id:action.user_id,
    title:'Invitation de personnel acceptée',description:'Le compte a défini son mot de passe et activé son accès.',
  }})
  return{public_id:user.public_id,roles:user.user_roles.map(link=>link.roles.name)}
}

/** Annuaire scolaire public, filtré par rôle et sans hash ni identifiant interne. */
export async function listSchoolStaff(schoolId:bigint,input:{role?:string;search?:string;page:number;limit:number}){
 const where={school_id:schoolId,...(input.role?{user_roles:{some:{roles:{name:input.role}}}}:{}),...(input.search?{OR:[{first_name:{contains:input.search,mode:'insensitive' as const}},{last_name:{contains:input.search,mode:'insensitive' as const}},{email:{contains:input.search,mode:'insensitive' as const}}]}:{})}
 const[items,total]=await prisma.$transaction([
  prisma.users.findMany({where,select:{public_id:true,first_name:true,last_name:true,email:true,phone:true,birth_date:true,is_active:true,created_at:true,user_roles:{select:{roles:{select:{name:true}}}},teacher_assignments_teacher_assignments_teacher_user_idTousers:{where:{status:'active'},select:{id:true,academic_year_subjects:{select:{id:true,subjects:{select:{id:true,name:true}},academic_year_classes:{select:{public_id:true,school_classes:{select:{public_id:true,name:true,parallel:true}}}}}}}}},orderBy:{created_at:'desc'},skip:(input.page-1)*input.limit,take:input.limit}),
  prisma.users.count({where}),
 ])
 return{staff:items.map(item=>({...item,roles:item.user_roles.map(link=>link.roles.name),user_roles:undefined,assignments:item.teacher_assignments_teacher_assignments_teacher_user_idTousers.map(assignment=>({public_id:opaque(schoolId,'teacher-assignment',assignment.id),academic_year_subjects:{...assignment.academic_year_subjects,public_id:opaque(schoolId,'class-subject',assignment.academic_year_subjects.id),id:undefined,subjects:{public_id:opaque(schoolId,'subject',assignment.academic_year_subjects.subjects.id),name:assignment.academic_year_subjects.subjects.name}}})),teacher_assignments_teacher_assignments_teacher_user_idTousers:undefined})),pagination:{page:input.page,limit:input.limit,total,total_pages:Math.ceil(total/input.limit)}}
}

export async function updateSchoolStaff(schoolId:bigint,publicId:string,data:Record<string,unknown>){
 const current=await prisma.users.findFirst({where:{school_id:schoolId,public_id:publicId},select:{id:true,first_name:true,last_name:true}})
 if(!current)throw new SchoolStaffError('Ressource introuvable.',404)
 if(data.phone)await assertPhoneAvailable({phone:String(data.phone),first_name:String(data.first_name||current.first_name),last_name:String(data.last_name||current.last_name),schoolId})
 return prisma.users.update({where:{id:current.id},data:{...data,...(data.birth_date?{birth_date:new Date(`${data.birth_date}T00:00:00.000Z`)}:{}),...(data.phone?{phone:normalizeDrcPhone(String(data.phone))}:{})},select:{public_id:true,first_name:true,last_name:true,email:true,phone:true,birth_date:true,is_active:true}})
}

export async function assignTeacher(schoolId:bigint,teacherPublicId:string,classSubjectIds:string[],assignedBy:string){
 const teacher=await prisma.users.findFirst({where:{school_id:schoolId,public_id:teacherPublicId,user_roles:{some:{roles:{name:'ENSEIGNANT'}}}},select:{id:true}})
 if(!teacher)throw new SchoolStaffError('Ressource introuvable.',404)
 const subjects=await prisma.academic_year_subjects.findMany({where:{public_id:{in:classSubjectIds},academic_year_classes:{academic_years:{school_id:schoolId}}},select:{id:true}})
 if(subjects.length!==new Set(classSubjectIds).size)throw new SchoolStaffError('Affectation invalide.',400)
 await prisma.$transaction(async tx=>{for(const subject of subjects){const existing=await tx.teacher_assignments.findFirst({where:{academic_year_subject_id:subject.id,teacher_user_id:teacher.id},select:{id:true}});if(existing)await tx.teacher_assignments.update({where:{id:existing.id},data:{status:'active',end_date:null,assigned_by_user_id:BigInt(assignedBy)}});else await tx.teacher_assignments.create({data:{academic_year_subject_id:subject.id,teacher_user_id:teacher.id,assigned_by_user_id:BigInt(assignedBy),start_date:new Date(),status:'active'}})}})
 return{assigned:subjects.length}
}
