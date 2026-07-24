/**
 * Référentiel embarqué d'après les publications MINEDU-NC.
 * Sources : https://edu-nc.gouv.cd/systeme-educatif
 * et https://edu-nc.gouv.cd/programmes-nationaux
 */
export const RDC_LEVELS=[
 'Maternelle',
 '1re Primaire','2e Primaire','3e Primaire','4e Primaire','5e Primaire','6e Primaire',
 '7e CTEB','8e CTEB',
 '1re Humanités','2e Humanités','3e Humanités','4e Humanités',
 '1re Professionnel — cycle court (3 ans)','2e Professionnel — cycle court (3 ans)','3e Professionnel — cycle court (3 ans)',
 '1re Professionnel — cycle long (4 ans)','2e Professionnel — cycle long (4 ans)','3e Professionnel — cycle long (4 ans)','4e Professionnel — cycle long (4 ans)',
]as const

// Liste volontairement conservatrice : uniquement les options nommées par les documents officiels consultés.
export const RDC_HUMANITIES_OPTIONS=[
 'Pédagogie générale','Normale','Éducation physique',
 'Latin-philosophie','Latin-grec','Mathématique-physique','Chimie-biologie',
 'Commerciale et gestion','Secrétariat-administration','Électricité','Électronique',
 'Pétrochimie','Coupe-couture','Informatique',
]as const

export const optionsForLevel=(level:string):string[]=>
 level.includes('Humanités')||level.includes('Professionnel')?[...RDC_HUMANITIES_OPTIONS]:[]

export const referenceDescription=(levels:readonly string[],official=true)=>JSON.stringify({source:official?'MINEDU-NC':'ECOLE',levels})
export function referencedLevels(description:string|null){try{const value=JSON.parse(description||'')as{levels?:unknown};return Array.isArray(value.levels)?value.levels.filter((item):item is string=>typeof item==='string'):[]}catch{return[]}}
