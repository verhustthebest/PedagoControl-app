import test from'node:test'
import assert from'node:assert/strict'
import{authApi,clearMemorySession,getMemorySession,restoreSession}from'../src/services/api.ts'
import{canAccessPath,portalForRoles,protectedRouteDecision}from'../src/auth/routePolicy.ts'

const publicId='3a26a9a5-55cf-43d1-97db-1ebf945dadc9'
const admin={id:'42',first_name:'Admin',last_name:'École',email:'admin@school.test',school_id:publicId,roles:['ADMIN_GESTIONNAIRE'],modules:{pedagogical_control:true,parental_tracking:true},school:{public_id:publicId,name:'École Test'}}
const json=(body:unknown)=>new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}})

test('connexion attend me puis autorise directement toutes les routes admin',async()=>{
 clearMemorySession()
 const calls:string[]=[]
 globalThis.fetch=async(input)=>{
  const url=String(input);calls.push(url)
  if(url.endsWith('/auth/login'))return json({accessToken:'access',csrfToken:'csrf',user:{...admin,roles:['SUPER_ADMIN']},roles:['SUPER_ADMIN'],school_id:null})
  return json({user:admin,roles:['ADMIN_GESTIONNAIRE'],school_id:publicId,school:admin.school,modules:admin.modules})
 }
 const verified=await authApi.login(admin.email,'password')
 assert.deepEqual(calls.map(url=>url.slice(url.lastIndexOf('/auth'))),['/auth/login','/auth/me'])
 assert.deepEqual(verified.roles,['ADMIN_GESTIONNAIRE'])
 assert.deepEqual(getMemorySession().user?.roles,['ADMIN_GESTIONNAIRE'])
 assert.equal(portalForRoles(verified.roles),'/admin')
 for(const path of['/admin','/admin/suivi-parental','/admin/eleves','/admin/parents'])assert.equal(canAccessPath(path,verified.roles),true)
 assert.equal(canAccessPath('/management',verified.roles),false)
})

test('actualisation de /admin restaure exactement ADMIN_GESTIONNAIRE avant affichage',async()=>{
 clearMemorySession()
 const roles = ["ADMIN_GESTIONNAIRE"]
 const calls:string[]=[]
 globalThis.fetch=async(input)=>{
  const url=String(input);calls.push(url)
  if(url.endsWith('/auth/csrf'))return json({csrfToken:'csrf'})
  if(url.endsWith('/auth/refresh'))return json({accessToken:'access-restored',csrfToken:'csrf-rotated'})
  return json({user:{...admin,roles},roles,school_id:publicId,school:admin.school,modules:admin.modules})
 }
 const restored=await restoreSession('/api')
 assert.deepEqual(calls.map(url=>url.slice(url.lastIndexOf('/auth'))),['/auth/csrf','/auth/refresh','/auth/me'])
 assert.deepEqual(restored?.user?.roles,roles)
 assert.equal(protectedRouteDecision(false,true,roles,['ADMIN_GESTIONNAIRE']),'allowed')
 assert.equal(canAccessPath('/admin',roles),true)
 assert.equal(portalForRoles(roles),'/admin')
})

test('AdminLayout utilise l’école de /auth/me sans appeler la liste Management',async()=>{
 const {readFile}=await import('node:fs/promises')
 const layout=await readFile(new URL('../src/layouts/AdminLayout.tsx',import.meta.url),'utf8')
 const service=await readFile(new URL('../src/services/adminParental.ts',import.meta.url),'utf8')
 assert.match(layout,/user\?\.school\?\.name/)
 assert.doesNotMatch(layout,/apiRequest|\/schools\?/)
 assert.doesNotMatch(service,/apiRequest<\{ schools: SchoolSummary\[\] \}>\('\/schools/)
 assert.match(service,/user\.school\.public_id/)
})
