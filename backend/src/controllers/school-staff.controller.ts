import type {Response} from 'express'
import type {AuthenticatedRequest} from '../middleware/auth.middleware'
import {createSchoolStaff,SchoolStaffError} from '../services/school-staff.service'

export async function createStaff(request:AuthenticatedRequest,response:Response){
  try{
    const staff=await createSchoolStaff(BigInt(request.params.schoolId as string),request.body)
    return response.status(201).json({staff})
  }catch(error){
    if(error instanceof SchoolStaffError)return response.status(error.status).json({message:error.message})
    return response.status(400).json({message:'Impossible de créer ce compte.'})
  }
}
