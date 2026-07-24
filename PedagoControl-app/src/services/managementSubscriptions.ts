import{apiRequest}from'./api'
export type ManagementSubscription={
 school:{public_id:string;code:string;name:string;promoter_name:string}
 plan:{code:string;name:string};billing_period:string;teacher_limit:number;amount_to_pay:string;
 start_date:string;end_date:string;status:string
}
export type SubscriptionResponse={
 items:ManagementSubscription[]
 pagination:{page:number;limit:number;total:number;total_pages:number}
 summary:{total:number;active:number;expiring_soon:number;overdue:number;teacher_quota:number}
}
export const managementSubscriptionsApi={
 list(input:{page:number;limit:number;search?:string;status?:string;plan?:string;billing_period?:string}){
  const query=new URLSearchParams({page:String(input.page),limit:String(input.limit)})
  for(const[key,value]of Object.entries(input))if(value&&key!=='page'&&key!=='limit')query.set(key,String(value))
  return apiRequest<SubscriptionResponse>(`/management/subscriptions?${query}`)
 },
}
