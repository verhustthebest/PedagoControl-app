import type { Prisma } from '@prisma/client'
import prisma from '../prisma/client'

export type SchoolListInput = { page:number;limit:number;search?:string;status?:string;schoolId?:bigint }

/** Projection commune à la liste et au détail, volontairement sans identifiant numérique. */
export const publicSchoolSelect = {
  public_id:true,code:true,name:true,promoter_name:true,phone:true,status:true,created_at:true,
} satisfies Prisma.schoolsSelect

/** Recherche paginée avec filtres allow-listés et portée scolaire optionnelle. */
export async function listSchools(input:SchoolListInput){const where:Prisma.schoolsWhereInput={...(input.schoolId?{id:input.schoolId}:{}),...(input.status?{status:input.status}:{}),...(input.search?{OR:[{name:{contains:input.search,mode:'insensitive'}},{code:{contains:input.search,mode:'insensitive'}},{promoter_name:{contains:input.search,mode:'insensitive'}}]}:{})};const[schools,total]=await prisma.$transaction([prisma.schools.findMany({where,select:publicSchoolSelect,orderBy:{created_at:'desc'},skip:(input.page-1)*input.limit,take:input.limit}),prisma.schools.count({where})]);return{schools,total}}

/** Charge le détail après résolution sécurisée du public_id par requireSchoolScope. */
export function findSchoolByInternalScope(schoolId:bigint){return prisma.schools.findUnique({where:{id:schoolId},select:publicSchoolSelect})}
