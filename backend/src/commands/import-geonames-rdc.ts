import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
import prisma from '../prisma/client'
import { geographyNameKey } from '../services/geography.service'

dotenv.config()

const provincesByCode: Record<string, string> = {
  '13': 'Bas-Uele', '02': 'Équateur', '14': 'Haut-Katanga', '15': 'Haut-Lomami', '16': 'Haut-Uele',
  '17': 'Ituri', '18': 'Kasaï', '23': 'Kasaï-Central', '04': 'Kasaï-Oriental', '06': 'Kinshasa',
  '08': 'Kongo-Central', '19': 'Kwango', '20': 'Kwilu', '21': 'Lomami', '22': 'Lualaba',
  '24': 'Mai-Ndombe', '10': 'Maniema', '25': 'Mongala', '11': 'Nord-Kivu', '26': 'Nord-Ubangi',
  '27': 'Sankuru', '12': 'Sud-Kivu', '28': 'Sud-Ubangi', '29': 'Tanganyika', '30': 'Tshopo', '31': 'Tshuapa',
}
const kinshasaCommunes = ['Bandalungwa','Barumbu','Bumbu','Gombe','Kalamu','Kasa-Vubu','Kimbanseke','Kinshasa','Kintambo','Kisenso','Lemba','Limete','Lingwala','Makala','Maluku','Masina','Matete','Mont-Ngafula','Ndjili','Ngaba','Ngaliema','Ngiri-Ngiri','Nsele','Selembao']

type GeoRow = { name: string; feature: string; admin1: string; admin2: string; admin3: string; admin4: string }

/**
 * Importe l'export GeoNames RDC dans PostgreSQL. Cette commande est ponctuelle :
 * l'application ne contacte jamais GeoNames pendant l'utilisation du formulaire.
 */
async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_GEONAMES_IMPORT !== 'true') throw new Error('Import GeoNames non autorisé en production.')
  const source = process.env.GEONAMES_CD_FILE
  if (!source) throw new Error('GEONAMES_CD_FILE doit pointer vers le fichier CD.txt officiel extrait.')
  const rows: GeoRow[] = (await readFile(source, 'utf8')).split(/\r?\n/).filter(Boolean).map((line) => {
    const columns = line.split('\t')
    return { name: columns[1], feature: columns[7], admin1: columns[10], admin2: columns[11], admin3: columns[12], admin4: columns[13] }
  })

  const provinceIds = new Map<string, bigint>()
  for (const [code, name] of Object.entries(provincesByCode)) {
    const province = await prisma.geo_provinces.upsert({
      where: { name_key: geographyNameKey(name) }, update: { name }, create: { name, name_key: geographyNameKey(name) }, select: { id: true },
    })
    provinceIds.set(code, province.id)
  }

  const cityIds = new Map<string, bigint>()
  for (const row of rows.filter(({ feature }) => feature === 'ADM2')) {
    const provinceId = provinceIds.get(row.admin1); if (!provinceId || !row.admin2) continue
    const city = await prisma.geo_cities.upsert({
      where: { province_id_name_key: { province_id: provinceId, name_key: geographyNameKey(row.name) } }, update: {},
      create: { province_id: provinceId, name: row.name, name_key: geographyNameKey(row.name) }, select: { id: true },
    })
    cityIds.set(`${row.admin1}.${row.admin2}`, city.id)
  }

  const communeIds = new Map<string, bigint>()
  for (const row of rows.filter(({ feature }) => feature === 'ADM3')) {
    const cityId = cityIds.get(`${row.admin1}.${row.admin2}`); if (!cityId || !row.admin3) continue
    const commune = await prisma.geo_communes.upsert({
      where: { city_id_name_key: { city_id: cityId, name_key: geographyNameKey(row.name) } }, update: {},
      create: { city_id: cityId, name: row.name, name_key: geographyNameKey(row.name) }, select: { id: true },
    })
    communeIds.set(`${row.admin1}.${row.admin2}.${row.admin3}`, commune.id)
  }

  // GeoNames mélange plusieurs découpages historiques de Kinshasa : cette liste officielle stabilise le parcours attendu.
  const kinshasaProvinceId = provinceIds.get('06')!
  const kinshasaCity = await prisma.geo_cities.upsert({
    where:{province_id_name_key:{province_id:kinshasaProvinceId,name_key:geographyNameKey('Kinshasa')}},update:{name:'Kinshasa'},
    create:{province_id:kinshasaProvinceId,name:'Kinshasa',name_key:geographyNameKey('Kinshasa')},select:{id:true},
  })
  for (const name of kinshasaCommunes) await prisma.geo_communes.upsert({
    where:{city_id_name_key:{city_id:kinshasaCity.id,name_key:geographyNameKey(name)}},update:{name},
    create:{city_id:kinshasaCity.id,name,name_key:geographyNameKey(name)},select:{id:true},
  })

  let neighborhoods = 0
  for (const row of rows.filter(({ feature }) => feature === 'ADM4')) {
    const communeId = communeIds.get(`${row.admin1}.${row.admin2}.${row.admin3}`); if (!communeId) continue
    await prisma.geo_neighborhoods.upsert({
      where: { commune_id_name_key: { commune_id: communeId, name_key: geographyNameKey(row.name) } }, update: {},
      create: { commune_id: communeId, name: row.name, name_key: geographyNameKey(row.name) }, select: { id: true },
    }); neighborhoods += 1
  }
  console.info(JSON.stringify({ source: 'GeoNames CD dump', provinces: provinceIds.size, cities: cityIds.size, communes: communeIds.size, neighborhoods }))
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Import GeoNames refusé.'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
