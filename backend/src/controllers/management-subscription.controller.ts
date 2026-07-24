import type {Response} from 'express'
import type {AuthenticatedRequest} from '../middleware/auth.middleware'
import {listManagementSubscriptions} from '../services/management-subscription.service'

export async function managementSubscriptions(request:AuthenticatedRequest,response:Response){
  const result=await listManagementSubscriptions({
    page:Number(request.query.page||1),limit:Number(request.query.limit||20),
    search:request.query.search as string|undefined,status:request.query.status as string|undefined,
    plan:request.query.plan as string|undefined,billing_period:request.query.billing_period as string|undefined,
  })
  return response.json(result)
}
