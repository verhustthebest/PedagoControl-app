import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { runParentContributionAutomation } from '../services/parent-contribution-automation.service'
import { auditContributions, dueDto, generateContributionDues, getContributionDue, getContributionSetting, listContributionDues, ownContributions, recordContributionPayment, saveContributionSetting, settingDto } from '../services/parent-contribution.service'
import { ParentalApiError } from '../services/parental.service'

const queryString = (value: unknown) => typeof value === 'string' ? value : undefined
const schoolId = (request: AuthenticatedRequest) => request.params.schoolId as string
const fail = (response: Response, error: unknown) => error instanceof ParentalApiError
  ? response.status(error.statusCode).json({ message: error.message })
  : response.status(500).json({ message: 'Unable to process contribution' })

export async function showSetting(request:AuthenticatedRequest,response:Response){try{return response.json({setting:settingDto(await getContributionSetting(schoolId(request)))})}catch(error){return fail(response,error)}}
export async function saveSetting(request:AuthenticatedRequest,response:Response){try{return response.json({setting:settingDto(await saveContributionSetting(schoolId(request),request.user!.id,request.body))})}catch(error){return fail(response,error)}}
export async function generateDues(request:AuthenticatedRequest,response:Response){try{return response.status(201).json(await generateContributionDues(schoolId(request),request.body.period))}catch(error){return fail(response,error)}}
export async function indexDues(request:AuthenticatedRequest,response:Response){try{return response.json(await listContributionDues(schoolId(request),{page:queryString(request.query.page),limit:queryString(request.query.limit),period:queryString(request.query.period),status:queryString(request.query.status),student:queryString(request.query.student)}))}catch(error){return fail(response,error)}}
export async function showDue(request:AuthenticatedRequest,response:Response){try{return response.json({due:dueDto(await getContributionDue(schoolId(request),request.params.dueId as string))})}catch(error){return fail(response,error)}}
export async function createPayment(request:AuthenticatedRequest,response:Response){try{const payment=await recordContributionPayment(schoolId(request),request.params.dueId as string,request.user!.id,request.body);return response.status(201).json({payment:{public_id:payment.public_id,amount:payment.amount.toString(),currency:payment.currency,payment_method:payment.payment_method,reference:payment.reference,notes:payment.notes,paid_at:payment.paid_at}})}catch(error){return fail(response,error)}}
export async function paymentHistory(request:AuthenticatedRequest,response:Response){try{const due=dueDto(await getContributionDue(schoolId(request),request.params.dueId as string));return response.json({payments:due.payments})}catch(error){return fail(response,error)}}
export async function ownView(request:AuthenticatedRequest,response:Response){try{return response.json(await ownContributions(request.user!.id))}catch(error){return fail(response,error)}}
export async function auditView(request:AuthenticatedRequest,response:Response){try{return response.json(await auditContributions({page:queryString(request.query.page),limit:queryString(request.query.limit)}))}catch(error){return fail(response,error)}}
/** Déclenchement manuel global, réservé au SUPER_ADMIN par la route. */
export async function runAutomation(_request:AuthenticatedRequest,response:Response){try{return response.json(await runParentContributionAutomation())}catch(error){return fail(response,error)}}
