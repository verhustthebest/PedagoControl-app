import { apiRequest } from './api'

export type PublicSchool = {
  public_id:string;code:string;name:string;promoter_name:string;phone:string|null;status:string;created_at:string
}
export type SchoolListResponse = {
  schools:PublicSchool[]
  pagination:{page:number;limit:number;total:number;total_pages:number}
}

/** Conserve la recherche et la pagination dans l'API, sans filtrage fictif côté navigateur. */
export const schoolsApi = {
  list(input:{page:number;limit:number;search?:string;status?:string}) {
    const query = new URLSearchParams({page:String(input.page),limit:String(input.limit)})
    if(input.search)query.set('search',input.search)
    if(input.status)query.set('status',input.status)
    return apiRequest<SchoolListResponse>(`/schools?${query.toString()}`)
  },
}
