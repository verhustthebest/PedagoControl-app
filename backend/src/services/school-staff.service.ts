import bcrypt from 'bcrypt'
import prisma from '../prisma/client'
import {assertPhoneAvailable,normalizeDrcPhone}from'../security/phone-identity'

export class SchoolStaffError extends Error {
  constructor(message:string, readonly status:number) { super(message) }
}

const QUOTA_MESSAGE = 'Impossible de créer un autre compte Enseignant : le quota autorisé par votre abonnement est atteint. Veuillez contacter l’Administrateur PEDAGO CONTROL.'

type StaffInput = {
  first_name:string;last_name:string;birth_date:string;email:string;phone?:string;password:string;
  role:'PREFET'|'ENSEIGNANT'|'DIRECTEUR'|'PROMOTEUR'|'INFORMATICIEN'
}

/** Crée un personnel majeur dans l'école courante et applique le quota d'abonnement sous transaction. */
export async function createSchoolStaff(schoolId:bigint,input:StaffInput) {
  if(input.phone)input.phone=normalizeDrcPhone(input.phone)
  const passwordHash=await bcrypt.hash(input.password,12)
  return prisma.$transaction(async transaction=>{
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
    const user=await transaction.users.create({data:{
      school_id:schoolId,first_name:input.first_name,last_name:input.last_name,
      birth_date:new Date(`${input.birth_date}T00:00:00.000Z`),email:input.email,phone:input.phone,
      password_hash:passwordHash,
    },select:{id:true,public_id:true,first_name:true,last_name:true,email:true,is_active:true,created_at:true}})
    await transaction.user_roles.create({data:{user_id:user.id,role_id:role.id}})
    const {id:_,...publicUser}=user
    return {...publicUser,role:role.name}
  })
}
