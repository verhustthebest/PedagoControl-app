import{apiRequest}from'./api'
export const adminProfileApi={
 changePassword:(body:{current_password:string;new_password:string;confirmation:string})=>apiRequest<void>('/auth/password',{method:'PUT',body:JSON.stringify(body)}),
 replacePhoto:(body:{data_url:string;mime_type:string;file_size:number})=>apiRequest<{user:{public_id:string;profile_photo:string}}>('/auth/profile-photo',{method:'PUT',body:JSON.stringify(body)}),
}
