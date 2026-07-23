import prisma from '../prisma/client'

export type GeographyItem = { public_id: string; name: string }

/** Produit une clé stable afin d'empêcher les doublons de casse et d'espacement. */
export function geographyNameKey(name: string) {
  return name.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
}

const select = { public_id: true, name: true } as const

export const listProvinces = () => prisma.geo_provinces.findMany({ select, orderBy: { name: 'asc' } })
export const listCities = (provincePublicId: string) => prisma.geo_cities.findMany({
  where: { province: { public_id: provincePublicId } }, select, orderBy: { name: 'asc' },
})
export const listCommunes = (cityPublicId: string) => prisma.geo_communes.findMany({
  where: { city: { public_id: cityPublicId } }, select, orderBy: { name: 'asc' },
})
export const listNeighborhoods = (communePublicId: string) => prisma.geo_neighborhoods.findMany({
  where: { commune: { public_id: communePublicId } }, select, orderBy: { name: 'asc' },
})

/** Création idempotente sous le parent public : la contrainte composée arbitre les accès concurrents. */
export async function createCity(provincePublicId: string, name: string) {
  const province = await prisma.geo_provinces.findUnique({ where: { public_id: provincePublicId }, select: { id: true } })
  if (!province) return null
  const nameKey = geographyNameKey(name)
  return prisma.geo_cities.upsert({
    where: { province_id_name_key: { province_id: province.id, name_key: nameKey } },
    update: {}, create: { province_id: province.id, name: name.trim().replace(/\s+/g, ' '), name_key: nameKey }, select,
  })
}

export async function createCommune(cityPublicId: string, name: string) {
  const city = await prisma.geo_cities.findUnique({ where: { public_id: cityPublicId }, select: { id: true } })
  if (!city) return null
  const nameKey = geographyNameKey(name)
  return prisma.geo_communes.upsert({
    where: { city_id_name_key: { city_id: city.id, name_key: nameKey } },
    update: {}, create: { city_id: city.id, name: name.trim().replace(/\s+/g, ' '), name_key: nameKey }, select,
  })
}

export async function createNeighborhood(communePublicId: string, name: string) {
  const commune = await prisma.geo_communes.findUnique({ where: { public_id: communePublicId }, select: { id: true } })
  if (!commune) return null
  const nameKey = geographyNameKey(name)
  return prisma.geo_neighborhoods.upsert({
    where: { commune_id_name_key: { commune_id: commune.id, name_key: nameKey } },
    update: {}, create: { commune_id: commune.id, name: name.trim().replace(/\s+/g, ' '), name_key: nameKey }, select,
  })
}
