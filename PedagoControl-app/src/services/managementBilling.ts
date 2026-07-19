import { apiRequest } from './api'

export type BillingSchool = { id?: string; public_id?: string; code?: string; name: string; status?: string }
export type InvoiceStatus = 'draft'|'issued'|'partially_paid'|'paid'|'overdue'|'cancelled'
export type ParentalInvoice = {
  public_id:string; invoice_number:string; invoice_type:string; billing_period_start:string|null; billing_period_end:string|null
  student_count_snapshot:number|null; issue_date:string; due_date:string; total_amount:string; currency:string; status:InvoiceStatus; emailed_at:string|null
  billing_email?:string; subtotal?:string; discount_amount?:string
  items?:Array<{type:string;description:string;quantity:string;unit_price:string;amount:string}>
  payments?:Array<{amount:string;currency:string;payment_method:string;transaction_reference:string|null;receipt_number:string;status:string;paid_at:string;notes:string|null}>
  school?:BillingSchool
}

const schoolIdentifier=(school:BillingSchool)=>school.public_id||school.id
const query=(values:Record<string,string|number|undefined>)=>{const params=new URLSearchParams();Object.entries(values).forEach(([key,value])=>{if(value!==undefined&&value!=='')params.set(key,String(value))});return params.toString()}

/** Charge uniquement des données réelles. Le public_id est prioritaire dès que l'API écoles le fournit. */
export async function listBillingSchools(){const response=await apiRequest<{schools:BillingSchool[];pagination:{total_pages:number}}>('/schools?page=1&limit=100');return response.schools}
export async function listSchoolInvoices(school:BillingSchool,status?:InvoiceStatus){const identifier=schoolIdentifier(school);if(!identifier)return[];const response=await apiRequest<{invoices:ParentalInvoice[]}>(`/parental/schools/${encodeURIComponent(identifier)}/invoices?${query({page:1,limit:100,status})}`);return response.invoices.map(invoice=>({...invoice,school}))}
export async function loadManagementInvoices(){const schools=await listBillingSchools();const groups=await Promise.all(schools.map(school=>listSchoolInvoices(school).catch(()=>[])));return{schools,invoices:groups.flat()}}
export async function generateManagementInvoice(school:BillingSchool,billingMonth:string){const identifier=schoolIdentifier(school);if(!identifier)throw new Error("Identifiant public de l'école indisponible");return apiRequest<{invoice:ParentalInvoice}>(`/parental/schools/${encodeURIComponent(identifier)}/invoices/generate`,{method:'POST',body:JSON.stringify({billing_month:billingMonth})})}
export async function findManagementInvoice(publicId:string){const overview=await loadManagementInvoices();const summary=overview.invoices.find(invoice=>invoice.public_id===publicId);if(!summary?.school)throw new Error('Facture introuvable');const identifier=schoolIdentifier(summary.school);if(!identifier)throw new Error("Identifiant public de l'école indisponible");const response=await apiRequest<{invoice:ParentalInvoice}>(`/parental/schools/${encodeURIComponent(identifier)}/invoices/${encodeURIComponent(publicId)}`);return{...response.invoice,school:summary.school}}
export async function recordManagementPayment(invoice:ParentalInvoice,body:{amount:number;payment_method:'cash'|'bank_transfer'|'mobile_money';transaction_reference?:string;notes?:string}){const identifier=invoice.school&&schoolIdentifier(invoice.school);if(!identifier)throw new Error("Identifiant public de l'école indisponible");return apiRequest(`/parental/schools/${encodeURIComponent(identifier)}/invoices/${encodeURIComponent(invoice.public_id)}/payments`,{method:'POST',body:JSON.stringify(body)})}
