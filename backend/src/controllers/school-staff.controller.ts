import type {Response} from 'express'
import type {AuthenticatedRequest} from '../middleware/auth.middleware'
import {acceptStaffInvitation,assignTeacher,createSchoolStaff,listSchoolStaff,SchoolStaffError,updateSchoolStaff} from '../services/school-staff.service'
import {PhoneIdentityError}from'../security/phone-identity'

export async function createStaff(request:AuthenticatedRequest,response:Response){
  try{
    const requestId=String(response.getHeader('X-Request-ID')||'')
    const staff=await createSchoolStaff(BigInt(request.params.schoolId as string),request.body,request.user!.id,requestId)
    return response.status(201).json({staff,request_id:requestId})
  }catch(error){
    if(error instanceof SchoolStaffError)return response.status(error.status).json({message:error.message})
    if(error instanceof PhoneIdentityError)return response.status(error.status).json({message:error.message})
    return response.status(400).json({message:'Impossible de créer ce compte.'})
  }
}
export async function acceptInvitation(request:AuthenticatedRequest,response:Response){
  try{return response.json(await acceptStaffInvitation(request.body.token,request.body.password))}
  catch(error){return response.status(error instanceof SchoolStaffError?error.status:400).json({message:'Invitation invalide ou expirée.'})}
}
export async function listStaff(request:AuthenticatedRequest,response:Response){const page=Number(request.query.page||1),limit=Number(request.query.limit||20);return response.json(await listSchoolStaff(BigInt(request.params.schoolId as string),{role:request.query.role as string|undefined,search:request.query.search as string|undefined,page,limit}))}
export async function updateStaff(request:AuthenticatedRequest,response:Response){try{return response.json({staff:await updateSchoolStaff(BigInt(request.params.schoolId as string),request.params.staffId as string,request.body)})}catch(error){if(error instanceof SchoolStaffError)return response.status(error.status).json({message:error.message});if(error instanceof PhoneIdentityError)return response.status(error.status).json({message:error.message});return response.status(400).json({message:'Impossible de modifier ce compte.'})}}
export async function deactivateStaff(request:AuthenticatedRequest,response:Response){try{return response.json({staff:await updateSchoolStaff(BigInt(request.params.schoolId as string),request.params.staffId as string,{is_active:false})})}catch(error){return response.status(error instanceof SchoolStaffError?error.status:400).json({message:error instanceof SchoolStaffError?error.message:'Impossible de désactiver ce compte.'})}}
export async function setAssignments(request:AuthenticatedRequest,response:Response){try{return response.json(await assignTeacher(BigInt(request.params.schoolId as string),request.params.staffId as string,request.body.class_subject_ids,request.user!.id))}catch(error){return response.status(error instanceof SchoolStaffError?error.status:400).json({message:error instanceof SchoolStaffError?error.message:'Affectation impossible.'})}}
