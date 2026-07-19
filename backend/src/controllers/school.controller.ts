import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { schoolDto } from '../dto/school.dto'
import { isSuperAdmin } from '../security/access-policy'
import { findSchoolByInternalScope, listSchools } from '../services/school.service'

function query(value:unknown){return typeof value==='string'?value:undefined}

export async function getSchools(request:AuthenticatedRequest,response:Response){if(!request.user)return response.status(401).json({message:'Authentication required'});const page=Number(query(request.query.page)||1),limit=Number(query(request.query.limit)||20);try{const result=await listSchools({page,limit,search:query(request.query.search),status:query(request.query.status),schoolId:isSuperAdmin(request.user)?undefined:BigInt(request.user.school_id as string)});return response.json({schools:result.schools.map(schoolDto),pagination:{page,limit,total:result.total,total_pages:Math.ceil(result.total/limit)}})}catch{return response.status(500).json({message:'Unable to fetch schools'})}}

export async function getSchool(request:AuthenticatedRequest,response:Response){try{const school=await findSchoolByInternalScope(BigInt(request.params.schoolId as string));if(!school)return response.status(404).json({message:'Resource not found'});return response.json({school:schoolDto(school)})}catch{return response.status(500).json({message:'Unable to fetch school'})}}
