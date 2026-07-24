import bcrypt from'bcrypt'
import prisma from'../prisma/client'
import{revokeAllUserSessions}from'./auth-session.service'

export class ProfileSecurityError extends Error{constructor(message:string,readonly status:number){super(message)}}

/** Change le mot de passe au plus trois fois par mois puis révoque toutes les sessions. */
export async function changeUserPassword(userId:string,currentPassword:string,newPassword:string){
 const since=new Date();since.setUTCMonth(since.getUTCMonth()-1)
 const user=await prisma.users.findUnique({where:{id:BigInt(userId)},select:{password_hash:true,school_id:true}})
 if(!user||!await bcrypt.compare(currentPassword,user.password_hash))throw new ProfileSecurityError('Le mot de passe actuel est incorrect.',400)
 const changes=await prisma.activity_logs.count({where:{user_id:BigInt(userId),activity_type:'password_changed',created_at:{gte:since}}})
 if(changes>=3)throw new ProfileSecurityError('La limite mensuelle de changements est atteinte.',429)
 if(await bcrypt.compare(newPassword,user.password_hash))throw new ProfileSecurityError('Le nouveau mot de passe doit être différent.',400)
 const hash=await bcrypt.hash(newPassword,12)
 await prisma.$transaction(async tx=>{
  await tx.users.update({where:{id:BigInt(userId)},data:{password_hash:hash}})
  if(user.school_id)await tx.activity_logs.create({data:{school_id:user.school_id,user_id:BigInt(userId),activity_type:'password_changed',module_name:'security',title:'Mot de passe modifié'}})
 })
 await revokeAllUserSessions(userId)
}

/** Transmet l'image à un stockage externe ; aucune donnée n'est écrite sur le disque Heroku. */
export async function replaceProfilePhoto(userId:string,input:{data_url:string;mime_type:string;file_size:number},fetcher:typeof fetch=fetch){
 const endpoint=process.env.PROFILE_STORAGE_ENDPOINT,token=process.env.PROFILE_STORAGE_TOKEN
 if(!endpoint||!token)throw new ProfileSecurityError('Le stockage externe des profils n’est pas configuré.',503)
 const response=await fetcher(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({data:input.data_url,mime_type:input.mime_type,folder:'pedago-control/profiles'})})
 const payload=await response.json().catch(()=>null)as{secure_url?:string}|null
 if(!response.ok||!payload?.secure_url||!/^https:\/\//.test(payload.secure_url))throw new ProfileSecurityError('Le stockage externe a refusé la photo.',502)
 const user=await prisma.users.update({where:{id:BigInt(userId)},data:{profile_photo:payload.secure_url},select:{public_id:true,profile_photo:true}})
 return user
}
