import type{Response}from'express';import type{AuthenticatedRequest}from'../middleware/auth.middleware';import{createClass,deactivateClass,listCatalog,listSubjects,removeSubject,saveSubject,SchoolAcademicError,updateClass}from'../services/school-academic.service'
const sid=(r:AuthenticatedRequest)=>BigInt(r.params.schoolId as string);const fail=(res:Response,e:unknown)=>e instanceof SchoolAcademicError?res.status(e.status).json({message:e.message}):res.status(400).json({message:'Requête impossible.'})
export const catalog=async(_r:AuthenticatedRequest,res:Response)=>res.json(await listCatalog())
export const addClass=async(r:AuthenticatedRequest,res:Response)=>{try{return res.status(201).json({class:await createClass(sid(r),r.body)})}catch(e){return fail(res,e)}}
export const editClass=async(r:AuthenticatedRequest,res:Response)=>{try{return res.json({class:await updateClass(sid(r),r.params.classId as string,r.body)})}catch(e){return fail(res,e)}}
export const deleteClass=async(r:AuthenticatedRequest,res:Response)=>{try{await deactivateClass(sid(r),r.params.classId as string);return res.status(204).end()}catch(e){return fail(res,e)}}
export const subjects=async(r:AuthenticatedRequest,res:Response)=>res.json({subjects:await listSubjects(sid(r))})
export const addSubject=async(r:AuthenticatedRequest,res:Response)=>{try{return res.status(201).json({subject:await saveSubject(sid(r),r.body)})}catch(e){return fail(res,e)}}
export const editSubject=async(r:AuthenticatedRequest,res:Response)=>{try{return res.json({subject:await saveSubject(sid(r),r.body,r.params.subjectId as string)})}catch(e){return fail(res,e)}}
export const deleteSubject=async(r:AuthenticatedRequest,res:Response)=>{try{await removeSubject(sid(r),r.params.subjectId as string);return res.status(204).end()}catch(e){return fail(res,e)}}
