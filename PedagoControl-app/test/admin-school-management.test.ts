import test from'node:test'
import assert from'node:assert/strict'
import fs from'node:fs'
const read=(file:string)=>fs.readFileSync(file,'utf8')

test('menu utilise exclusivement Gestion scolaire',()=>{
 const navigation=read('src/components/adminGestionnaire/AdminNavigation.tsx')
 assert.match(navigation,/Gestion scolaire/)
 assert.doesNotMatch(navigation,/Gestion académique/i)
})

test('classe filtre options selon cycle et conserve Autre',()=>{
 const page=read('src/pages/admin/academic/AdminAcademicPages.tsx'),api=read('src/services/adminAcademic.ts')
 assert.match(page,/options_by_level\[form\.level\]/)
 assert.match(page,/Section \/ Filière \/ Option/)
 assert.match(page,/Nouvelle section autorisée/)
 assert.match(api,/options_by_level/)
})

test('matière expose les libellés et la multisélection demandés',()=>{
 const page=read('src/pages/admin/academic/AdminAcademicPages.tsx')
 assert.match(page,/Nom de la matière \*/)
 assert.match(page,/Code de la matière/)
 assert.match(page,/Classes concernées \*/)
 assert.match(page,/Créez d’abord une classe avant d’ajouter une matière/)
 assert.match(page,/type="checkbox"/)
})

test('Préfet et Enseignant utilisent le libellé Nom',()=>{
 const page=read('src/pages/admin/academic/AdminAcademicPages.tsx')
 assert.match(page,/<label>Nom<input required value=\{form\.last_name\}/)
 assert.doesNotMatch(page,/<label>Noms<input required value=\{form\.last_name\}/)
})
