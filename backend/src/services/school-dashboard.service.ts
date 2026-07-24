import prisma from '../prisma/client'

/**
 * Charge uniquement les indicateurs de l'école authentifiée.
 * Le DTO retourné ne contient aucun identifiant numérique ni donnée sensible.
 */
export async function getSchoolDashboard(schoolId: bigint) {
  const [
    school,
    academicYear,
    subscription,
    users,
    teachers,
    students,
    activities,
  ] = await Promise.all([
    prisma.schools.findUnique({
      where: { id: schoolId },
      select: {
        public_id: true,
        name: true,
        code: true,
        status: true,
        school_parental_settings: { select: { is_enabled: true } },
      },
    }),
    prisma.academic_years.findFirst({
      where: { school_id: schoolId, is_active: true },
      orderBy: { start_date: 'desc' },
      select: { public_id: true, name: true, start_date: true, end_date: true },
    }),
    prisma.school_subscriptions.findFirst({
      where: { school_id: schoolId },
      orderBy: { created_at: 'desc' },
      select: {
        status: true,
        billing_period: true,
        teacher_limit: true,
        start_date: true,
        end_date: true,
        subscriptions: { select: { code: true, name: true } },
      },
    }),
    prisma.users.count({ where: { school_id: schoolId, is_active: true } }),
    prisma.users.count({
      where: {
        school_id: schoolId,
        is_active: true,
        user_roles: { some: { roles: { name: 'ENSEIGNANT', is_active: true } } },
      },
    }),
    prisma.students.count({ where: { school_id: schoolId, status: 'active' } }),
    prisma.activity_logs.findMany({
      where: { school_id: schoolId },
      orderBy: { created_at: 'desc' },
      take: 8,
      select: {
        activity_type: true,
        module_name: true,
        title: true,
        created_at: true,
        users: { select: { public_id: true, first_name: true, last_name: true } },
      },
    }),
  ])

  if (!school) return null

  return {
    school: {
      public_id: school.public_id,
      name: school.name,
      code: school.code,
      status: school.status,
    },
    academic_year: academicYear,
    counts: { users, teachers, students },
    subscription: subscription
      ? {
          plan: subscription.subscriptions,
          status: subscription.status,
          billing_period: subscription.billing_period,
          teacher_limit: subscription.teacher_limit,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
        }
      : null,
    modules: {
      pedagogical_control: true,
      parental_tracking: school.school_parental_settings?.is_enabled ?? false,
    },
    activities: activities.map((activity) => ({
      type: activity.activity_type,
      module: activity.module_name,
      title: activity.title,
      occurred_at: activity.created_at,
      actor: {
        public_id: activity.users.public_id,
        name: `${activity.users.first_name} ${activity.users.last_name}`.trim(),
      },
    })),
  }
}
