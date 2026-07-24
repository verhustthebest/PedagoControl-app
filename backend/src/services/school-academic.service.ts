import prisma from '../prisma/client'
import{createHash}from'crypto'
import{optionsForLevel,referenceDescription,referencedLevels}from'./rdc-school-reference'

export class SchoolAcademicError extends Error{constructor(message:string,readonly status:number){super(message)}}
const activeYear=(schoolId:bigint)=>prisma.academic_years.findFirst({where:{school_id:schoolId,is_active:true},orderBy:{start_date:'desc'},select:{id:true,public_id:true,name:true}})
const normalize=(value:string)=>value.trim().replace(/\s+/g,' ')
const comparisonKey=(value:string)=>normalize(value).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('fr')
const opaque=(schoolId:bigint,kind:string,id:bigint)=>{const h=createHash('sha256').update(`${kind}:${schoolId}:${id}`).digest('hex');return`${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`}

/** Crée une classe et son rattachement à l'année active sous une seule transaction. */
async function resolveOption(level:string,section?:string,custom?:string){
 const requested=custom?normalize(custom):section?normalize(section):''
 if(!requested)return null
 const candidates=await prisma.education_options.findMany({where:{is_active:true}})
 const existing=candidates.find(option=>comparisonKey(option.name)===comparisonKey(requested))
 if(existing){
  if(custom){const levels=new Set([...referencedLevels(existing.description),level]);if(levels.size!==referencedLevels(existing.description).length)return prisma.education_options.update({where:{id:existing.id},data:{description:referenceDescription([...levels],false)}})}
  return existing
 }
 if(!custom)throw new SchoolAcademicError('Section scolaire inconnue.',400)
 return prisma.education_options.create({data:{name:requested,description:referenceDescription([level],false)}})
}

export async function createClass(schoolId:bigint,input:{name:string;level:string;section?:string;section_other?:string;parallel?:string|null}){
 const year=await activeYear(schoolId);if(!year)throw new SchoolAcademicError('Aucune année scolaire active.',409)
 const level=await prisma.education_levels.findFirst({where:{name:{equals:normalize(input.level),mode:'insensitive'},is_active:true}})
 if(!level)throw new SchoolAcademicError('Niveau scolaire inconnu.',400)
 const option=await resolveOption(level.name,input.section,input.section_other)
 return prisma.$transaction(async tx=>{
  const schoolClass=await tx.school_classes.create({data:{school_id:schoolId,education_level_id:level.id,education_option_id:option?.id,name:normalize(input.name),parallel:input.parallel||null}})
  const annual=await tx.academic_year_classes.create({data:{academic_year_id:year.id,school_class_id:schoolClass.id},select:{public_id:true,is_active:true}})
  return{public_id:annual.public_id,is_active:annual.is_active,academic_year:{public_id:year.public_id,name:year.name},class:{public_id:schoolClass.public_id,name:schoolClass.name,parallel:schoolClass.parallel,level:level.name,section:option?.name??null,is_active:schoolClass.is_active}}
 })
}

export async function updateClass(schoolId:bigint,annualPublicId:string,input:{name:string;level:string;section?:string;section_other?:string;parallel?:string|null}){
 const annual=await prisma.academic_year_classes.findFirst({where:{public_id:annualPublicId,academic_years:{school_id:schoolId}},select:{school_class_id:true}})
 if(!annual)throw new SchoolAcademicError('Ressource introuvable.',404)
 const level=await prisma.education_levels.findFirst({where:{name:{equals:normalize(input.level),mode:'insensitive'},is_active:true}})
 if(!level)throw new SchoolAcademicError('Niveau inconnu.',400)
 const option=await resolveOption(level.name,input.section,input.section_other)
 const item=await prisma.school_classes.update({where:{id:annual.school_class_id},data:{name:normalize(input.name),parallel:input.parallel||null,education_level_id:level.id,education_option_id:option?.id??null},select:{public_id:true,name:true,parallel:true,is_active:true}})
 return{...item,level:level.name,section:option?.name??null}
}
export async function deactivateClass(schoolId:bigint,annualPublicId:string){const annual=await prisma.academic_year_classes.findFirst({where:{public_id:annualPublicId,academic_years:{school_id:schoolId}},select:{id:true,school_class_id:true}});if(!annual)throw new SchoolAcademicError('Ressource introuvable.',404);await prisma.$transaction([prisma.academic_year_classes.update({where:{id:annual.id},data:{is_active:false}}),prisma.school_classes.update({where:{id:annual.school_class_id},data:{is_active:false}})])}

export async function listCatalog(){const[levels,sections]=await Promise.all([prisma.education_levels.findMany({where:{is_active:true},select:{name:true},orderBy:{order_index:'asc'}}),prisma.education_options.findMany({where:{is_active:true},select:{name:true,description:true},orderBy:{name:'asc'}})]);const names=levels.map(x=>x.name);return{levels:names,sections:sections.map(x=>x.name),options_by_level:Object.fromEntries(names.map(level=>[level,sections.filter(option=>{const scoped=referencedLevels(option.description);return scoped.length?scoped.includes(level):optionsForLevel(level).includes(option.name)}).map(option=>option.name)]))}}

export async function listSubjects(schoolId:bigint){const year=await activeYear(schoolId);if(!year)return[];const rows=await prisma.academic_year_subjects.findMany({where:{academic_year_classes:{academic_year_id:year.id}},select:{id:true,is_active:true,subject_id:true,subjects:{select:{name:true,code:true,description:true}},academic_year_classes:{select:{public_id:true,school_classes:{select:{public_id:true,name:true,parallel:true}}}}},orderBy:{subjects:{name:'asc'}}});const map=new Map<string,any>();for(const row of rows){const key=row.subject_id.toString(),item=map.get(key)||{public_id:opaque(schoolId,'subject',row.subject_id),...row.subjects,class_subject_ids:[],classes:[]};item.class_subject_ids.push(opaque(schoolId,'class-subject',row.id));item.classes.push({annual_class_public_id:row.academic_year_classes.public_id,public_id:row.academic_year_classes.school_classes.public_id,name:row.academic_year_classes.school_classes.name,parallel:row.academic_year_classes.school_classes.parallel});map.set(key,item)}return[...map.values()]}
export async function saveSubject(schoolId:bigint,input:{name:string;code?:string|null;description?:string|null;class_ids:string[]},subjectPublicId?:string){
 const classes=await prisma.academic_year_classes.findMany({where:{public_id:{in:input.class_ids},academic_years:{school_id:schoolId,is_active:true}},select:{id:true}})
 if(classes.length!==new Set(input.class_ids).size)throw new SchoolAcademicError('Classe invalide.',400)
 const existing=subjectPublicId?await prisma.academic_year_subjects.findMany({where:{academic_year_classes:{academic_years:{school_id:schoolId}}},select:{subject_id:true}}):[];const existingSubjectId=existing.find(x=>opaque(schoolId,'subject',x.subject_id)===subjectPublicId)?.subject_id
 return prisma.$transaction(async tx=>{let subject=existingSubjectId?await tx.subjects.findUnique({where:{id:existingSubjectId}}):await tx.subjects.findFirst({where:{name:{equals:normalize(input.name),mode:'insensitive'}}});if(subjectPublicId&&!subject)throw new SchoolAcademicError('Ressource introuvable.',404);subject=subject?await tx.subjects.update({where:{id:subject.id},data:{name:normalize(input.name),code:input.code||null,description:input.description||null,is_active:true}}):await tx.subjects.create({data:{name:normalize(input.name),code:input.code||null,description:input.description||null}});await tx.academic_year_subjects.deleteMany({where:{subject_id:subject.id,academic_year_classes:{academic_years:{school_id:schoolId,is_active:true}}}});await tx.academic_year_subjects.createMany({data:classes.map(c=>({academic_year_class_id:c.id,subject_id:subject!.id})),skipDuplicates:true});return{public_id:opaque(schoolId,'subject',subject.id),name:subject.name}})
}
export async function removeSubject(schoolId:bigint,publicId:string){const links=await prisma.academic_year_subjects.findMany({where:{academic_year_classes:{academic_years:{school_id:schoolId}}},select:{subject_id:true}}),subjectId=links.find(x=>opaque(schoolId,'subject',x.subject_id)===publicId)?.subject_id;if(!subjectId)throw new SchoolAcademicError('Ressource introuvable.',404);await prisma.academic_year_subjects.deleteMany({where:{subject_id:subjectId,academic_year_classes:{academic_years:{school_id:schoolId,is_active:true}}}})}
