import prisma from'../prisma/client'
import{RDC_HUMANITIES_OPTIONS,RDC_LEVELS,optionsForLevel,referenceDescription}from'../services/rdc-school-reference'

/** Charge le référentiel en base sans service Internet au runtime. */
export async function seedRdcSchoolReference(){
 await prisma.education_levels.updateMany({where:{name:{in:['1re Professionnel','2e Professionnel','3e Professionnel','4e Professionnel']}},data:{is_active:false}})
 for(const[name,index]of RDC_LEVELS.map((name,index)=>[name,index+1]as const))await prisma.education_levels.upsert({where:{name},update:{order_index:index,is_active:true},create:{name,order_index:index}})
 for(const name of RDC_HUMANITIES_OPTIONS){const levels=RDC_LEVELS.filter(level=>optionsForLevel(level).includes(name));await prisma.education_options.upsert({where:{name},update:{description:referenceDescription(levels),is_active:true},create:{name,description:referenceDescription(levels)}})}
 return{levels:RDC_LEVELS.length,options:RDC_HUMANITIES_OPTIONS.length}
}
if(require.main===module)seedRdcSchoolReference().then(result=>{console.log(`Référentiel RDC chargé : ${result.levels} niveaux, ${result.options} options.`)}).finally(()=>prisma.$disconnect())
