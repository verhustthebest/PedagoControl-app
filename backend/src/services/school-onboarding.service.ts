import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import prisma from '../prisma/client'

type OnboardingInput = {
  draft_id: string
  school: { name:string;school_type:string;phone:string;email:string;address:string;province_id:string;city_id:string;commune_id:string;neighborhood_id?:string;geographic_reference?:string|null }
  responsible: { first_name:string;last_name:string;email:string;phone?:string }
  academic: { year_name:string;start_date:string;end_date:string;teacher_limit:number }
  subscription: { subscription_code:string;billing_period:'monthly'|'annual' }
  account: { first_name:string;last_name:string;email:string;phone?:string;password:string }
}

export async function saveSchoolDraft(userId: string, input: { draft_id?: string; current_step:number; data: Prisma.InputJsonValue }) {
  const payload = { ...input.data as object, current_step: input.current_step } as Prisma.InputJsonValue
  if (input.draft_id) {
    const existing = await prisma.school_creation_drafts.findFirst({ where: { public_id: input.draft_id, created_by_user_id: BigInt(userId), status: 'draft' } })
    if (!existing) return null
    return prisma.school_creation_drafts.update({ where: { id: existing.id }, data: { payload, updated_at: new Date() }, select: { public_id:true,status:true,updated_at:true } })
  }
  return prisma.school_creation_drafts.create({ data: { created_by_user_id: BigInt(userId), payload }, select: { public_id:true,status:true,updated_at:true } })
}

export const listSubscriptionCatalog = () => prisma.subscriptions.findMany({
  where: { is_active: true }, select: { code:true,name:true,description:true,min_teachers:true,max_teachers:true,monthly_price:true,annual_price:true }, orderBy: { monthly_price:'asc' },
})

/** Création transactionnelle et idempotente : le brouillon est réclamé avant toute écriture métier. */
export async function finalizeSchool(userId: string, input: OnboardingInput) {
  const draft = await prisma.school_creation_drafts.findFirst({ where: { public_id: input.draft_id, created_by_user_id: BigInt(userId) } })
  if (!draft) return { kind: 'not_found' as const }
  if (draft.status === 'completed' && draft.created_school_public_id) return { kind: 'created' as const, public_id: draft.created_school_public_id, repeated: true }
  const claimed = await prisma.school_creation_drafts.updateMany({ where: { id: draft.id, status: 'draft' }, data: { status: 'creating', updated_at: new Date() } })
  if (claimed.count !== 1) return { kind: 'conflict' as const }

  try {
    const passwordHash = await bcrypt.hash(input.account.password, 12)
    const result = await prisma.$transaction(async (transaction) => {
      const province = await transaction.geo_provinces.findUnique({ where: { public_id: input.school.province_id } })
      const city = await transaction.geo_cities.findFirst({ where: { public_id: input.school.city_id, province_id: province?.id } })
      const commune = await transaction.geo_communes.findFirst({ where: { public_id: input.school.commune_id, city_id: city?.id } })
      const neighborhood = input.school.neighborhood_id ? await transaction.geo_neighborhoods.findFirst({ where: { public_id: input.school.neighborhood_id, commune_id: commune?.id } }) : null
      if (!province || !city || !commune || (input.school.neighborhood_id && !neighborhood)) throw new Error('INVALID_GEOGRAPHY')
      const catalog = await transaction.subscriptions.findFirst({ where: { code: input.subscription.subscription_code, is_active: true } })
      if (!catalog) throw new Error('INVALID_SUBSCRIPTION')
      const role = await transaction.roles.findUnique({ where: { name: 'ADMIN_GESTIONNAIRE' } })
      if (!role?.is_active) throw new Error('INVALID_ROLE')
      const start = new Date(`${input.academic.start_date}T00:00:00.000Z`), end = new Date(`${input.academic.end_date}T00:00:00.000Z`)
      if (end <= start) throw new Error('INVALID_DATES')
      const school = await transaction.schools.create({ data: {
        code: `PED-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`, name: input.school.name,
        promoter_name: `${input.responsible.first_name} ${input.responsible.last_name}`, promoter_email: input.responsible.email,
        phone: input.school.phone, address: input.school.address, school_type: input.school.school_type, province_id: province.id,
        city_id: city.id, commune_id: commune.id, neighborhood_id: neighborhood?.id, geographic_reference: input.school.geographic_reference || null,
      } })
      await transaction.academic_years.create({ data: { school_id: school.id, name: input.academic.year_name, start_date: start, end_date: end } })
      const baseAmount = input.subscription.billing_period === 'annual' && catalog.annual_price ? catalog.annual_price : catalog.monthly_price
      await transaction.school_subscriptions.create({ data: { school_id: school.id, subscription_id: catalog.id, teacher_limit: input.academic.teacher_limit, billing_period: input.subscription.billing_period, amount_to_pay: baseAmount, start_date: start, end_date: end } })
      const user = await transaction.users.create({ data: { school_id: school.id, first_name: input.account.first_name, last_name: input.account.last_name, email: input.account.email, phone: input.account.phone, password_hash: passwordHash } })
      await transaction.user_roles.create({ data: { user_id: user.id, role_id: role.id } })
      await transaction.school_creation_drafts.update({ where: { id: draft.id }, data: { status: 'completed', created_school_public_id: school.public_id, updated_at: new Date() } })
      return school.public_id
    })
    return { kind: 'created' as const, public_id: result, repeated: false }
  } catch (error) {
    await prisma.school_creation_drafts.updateMany({ where: { id: draft.id, status: 'creating' }, data: { status: 'draft', updated_at: new Date() } })
    throw error
  }
}
