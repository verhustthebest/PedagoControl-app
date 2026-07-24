import type{Response}from'express'
import type{AuthenticatedRequest}from'../middleware/auth.middleware'
import{checkPhoneIdentity}from'../security/phone-identity'
export async function checkPhone(request:AuthenticatedRequest,response:Response){const result=await checkPhoneIdentity({...request.body,schoolId:request.user?.school_id?BigInt(request.user.school_id):null});return response.json(result)}
