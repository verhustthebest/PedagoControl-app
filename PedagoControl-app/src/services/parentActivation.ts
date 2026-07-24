import{apiRequest}from'./api'

export const parentActivationApi={
 requestOtp:(body:{school_code:string;contact:string;channel:'email'|'sms'})=>apiRequest<{accepted:boolean;verification_id?:string;expires_in_seconds?:number}>('/parental/auth/request-otp',{method:'POST',auth:false,retryAuth:false,body:JSON.stringify(body)}),
 verifyOtp:(verification_id:string,otp:string)=>apiRequest<{registration_token:string;expires_in_seconds:number}>('/parental/auth/verify-otp',{method:'POST',auth:false,retryAuth:false,body:JSON.stringify({verification_id,otp})}),
 register:(registration_token:string,password:string)=>apiRequest('/parental/auth/register',{method:'POST',auth:false,retryAuth:false,body:JSON.stringify({registration_token,password})}),
}
