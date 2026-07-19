export type PublicSchoolRecord = {
  public_id: string
  code: string
  name: string
  promoter_name: string
  phone: string | null
  status: string
  created_at: Date
}

/** DTO public strict : aucune clé technique interne ne traverse la frontière HTTP. */
export function schoolDto(school: PublicSchoolRecord) {
  return {
    public_id: school.public_id,
    code: school.code,
    name: school.name,
    promoter_name: school.promoter_name,
    phone: school.phone,
    status: school.status,
    created_at: school.created_at,
  }
}
