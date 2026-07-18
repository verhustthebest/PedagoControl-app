import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import prisma from '../prisma/client'
import { assertSeedAllowed, seedPassword } from './seed-security'

dotenv.config()

assertSeedAllowed('demo')
const password = seedPassword('DEMO_SEED_PASSWORD')
const schoolCode = 'DEMO-SCHOOL'
const academicYearName = '2024-2025'
const className = '5eme'
const classParallel = 'A'
const subjectName = 'Mathematiques'
const roleSeeds = [
  { name: 'SUPER_ADMIN', label: 'Super Administrateur', description: 'Administration globale de la plateforme demo' },
  { name: 'ADMIN_GESTIONNAIRE', label: 'Admin Gestionnaire', description: 'Gestion et supervision de l ecole demo' },
  { name: 'PREFET', label: 'Prefet des Etudes', description: 'Validation pedagogique des rapports demo' },
  { name: 'ENSEIGNANT', label: 'Enseignant', description: 'Soumission des rapports quotidiens demo' },
  { name: 'INFORMATICIEN', label: 'Informaticien', description: 'Gestion technique limitee de l ecole demo' },
  { name: 'PARENT', label: 'Parent', description: 'Acces limite a ses enfants et donnees personnelles' },
]

function dateOnly(value: string) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function timeOnly(value: string) {
  return new Date(`1970-01-01T${value}`)
}

async function upsertRole(seed: { name: string; label: string; description: string }) {
  return prisma.roles.upsert({
    where: { name: seed.name },
    update: {
      label: seed.label,
      description: seed.description,
      is_active: true,
    },
    create: {
      name: seed.name,
      label: seed.label,
      description: seed.description,
      is_active: true,
    },
  })
}

async function upsertDemoUser(params: {
  email: string
  firstName: string
  lastName: string
  roleId: bigint
  schoolId?: bigint | null
  passwordHash: string
}) {
  const user = await prisma.users.upsert({
    where: { email: params.email },
    update: {
      school_id: params.schoolId ?? null,
      first_name: params.firstName,
      last_name: params.lastName,
      password_hash: params.passwordHash,
      is_active: true,
    },
    create: {
      school_id: params.schoolId ?? null,
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
      password_hash: params.passwordHash,
      is_active: true,
    },
  })

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: user.id,
        role_id: params.roleId,
      },
    },
    update: {},
    create: {
      user_id: user.id,
      role_id: params.roleId,
    },
  })

  return user
}

async function ensureChapter(params: {
  annualProgramId: bigint
  title: string
  description: string
  orderIndex: number
  plannedPeriods: number
}) {
  return prisma.program_chapters.upsert({
    where: {
      annual_program_id_order_index: {
        annual_program_id: params.annualProgramId,
        order_index: params.orderIndex,
      },
    },
    update: {
      title: params.title,
      description: params.description,
      planned_periods: params.plannedPeriods,
      status: 'planned',
    },
    create: {
      annual_program_id: params.annualProgramId,
      title: params.title,
      description: params.description,
      order_index: params.orderIndex,
      planned_periods: params.plannedPeriods,
      status: 'planned',
    },
  })
}

async function ensureSubChapter(params: {
  chapterId: bigint
  title: string
  description: string
  orderIndex: number
  plannedPeriods: number
}) {
  return prisma.program_sub_chapters.upsert({
    where: {
      program_chapter_id_order_index: {
        program_chapter_id: params.chapterId,
        order_index: params.orderIndex,
      },
    },
    update: {
      title: params.title,
      description: params.description,
      planned_periods: params.plannedPeriods,
      status: 'planned',
    },
    create: {
      program_chapter_id: params.chapterId,
      title: params.title,
      description: params.description,
      order_index: params.orderIndex,
      planned_periods: params.plannedPeriods,
      status: 'planned',
    },
  })
}

async function findOrCreateDistribution(params: {
  annualProgramId: bigint
  periodId: bigint
  chapterId: bigint
  subChapterId: bigint
  plannedDate: Date
  plannedWeek: number
  plannedDay: string
}) {
  const existing = await prisma.program_distribution.findFirst({
    where: {
      annual_program_id: params.annualProgramId,
      program_chapter_id: params.chapterId,
      program_sub_chapter_id: params.subChapterId,
      planned_date: params.plannedDate,
    },
  })

  if (existing) {
    return prisma.program_distribution.update({
      where: { id: existing.id },
      data: {
        program_period_id: params.periodId,
        planned_week: params.plannedWeek,
        planned_day: params.plannedDay,
        planned_start_time: timeOnly('08:00:00'),
        planned_end_time: timeOnly('08:45:00'),
        planned_periods: 1,
        status: 'planned',
      },
    })
  }

  return prisma.program_distribution.create({
    data: {
      annual_program_id: params.annualProgramId,
      program_period_id: params.periodId,
      program_chapter_id: params.chapterId,
      program_sub_chapter_id: params.subChapterId,
      planned_date: params.plannedDate,
      planned_week: params.plannedWeek,
      planned_day: params.plannedDay,
      planned_start_time: timeOnly('08:00:00'),
      planned_end_time: timeOnly('08:45:00'),
      planned_periods: 1,
      status: 'planned',
    },
  })
}

async function findOrCreateReport(params: {
  distributionId: bigint
  assignmentId: bigint
  teacherId: bigint
  prefectId: bigint
  schoolId: bigint
  status: 'submitted' | 'validated' | 'rejected' | 'correction_requested'
  actualDate: Date
  summary: string
  observation?: string
}) {
  const existing = await prisma.lesson_sessions.findFirst({
    where: {
      program_distribution_id: params.distributionId,
      teacher_assignment_id: params.assignmentId,
      teacher_user_id: params.teacherId,
      actual_date: params.actualDate,
    },
  })

  const report = existing
    ? await prisma.lesson_sessions.update({
        where: { id: existing.id },
        data: {
          lesson_status: params.status,
          lesson_summary: params.summary,
          objectives_achieved: 'Les objectifs prevus ont ete traites avec exercices guides.',
          exercises_given: 'Exercices du manuel et application au tableau.',
          homework_given: 'Revision du sous-chapitre et exercices de consolidation.',
          observations: params.observation,
          actual_start_time: timeOnly('08:00:00'),
          actual_end_time: timeOnly('08:45:00'),
          actual_periods: 1,
          updated_at: new Date(),
        },
      })
    : await prisma.lesson_sessions.create({
        data: {
          program_distribution_id: params.distributionId,
          teacher_assignment_id: params.assignmentId,
          teacher_user_id: params.teacherId,
          actual_date: params.actualDate,
          actual_start_time: timeOnly('08:00:00'),
          actual_end_time: timeOnly('08:45:00'),
          actual_periods: 1,
          lesson_status: params.status,
          lesson_summary: params.summary,
          objectives_achieved: 'Les objectifs prevus ont ete traites avec exercices guides.',
          exercises_given: 'Exercices du manuel et application au tableau.',
          homework_given: 'Revision du sous-chapitre et exercices de consolidation.',
          observations: params.observation,
        },
      })

  if (params.status !== 'submitted') {
    const validation = await prisma.lesson_validations.findFirst({
      where: {
        lesson_session_id: report.id,
        prefect_user_id: params.prefectId,
        decision: params.status,
      },
    })

    if (validation) {
      await prisma.lesson_validations.update({
        where: { id: validation.id },
        data: {
          validation_comment: params.observation,
          validated_at: new Date(),
        },
      })
    } else {
      await prisma.lesson_validations.create({
        data: {
          lesson_session_id: report.id,
          prefect_user_id: params.prefectId,
          decision: params.status,
          validation_comment: params.observation,
        },
      })
    }

    if (params.observation) {
      const comment = await prisma.lesson_comments.findFirst({
        where: {
          lesson_session_id: report.id,
          user_id: params.prefectId,
          comment_type: 'observation',
        },
      })

      if (comment) {
        await prisma.lesson_comments.update({
          where: { id: comment.id },
          data: { comment_text: params.observation },
        })
      } else {
        await prisma.lesson_comments.create({
          data: {
            lesson_session_id: report.id,
            user_id: params.prefectId,
            comment_type: 'observation',
            comment_text: params.observation,
          },
        })
      }
    }
  }

  await ensureNotification({
    recipientId: params.prefectId,
    senderId: params.teacherId,
    title: params.status === 'submitted' ? 'Rapport quotidien soumis' : 'Rapport quotidien traite',
    message: `Rapport demo ${report.id.toString()} - statut ${params.status}.`,
    type: `demo_lesson_report_${params.status}`,
    referenceId: report.id,
  })

  await ensureActivityLog({
    schoolId: params.schoolId,
    userId: params.status === 'submitted' ? params.teacherId : params.prefectId,
    type: `demo_lesson_report_${params.status}`,
    title: `Demo rapport ${params.status}`,
    description: `Donnee demo pour rapport quotidien ${report.id.toString()}.`,
    referenceId: report.id,
  })

  return report
}

async function ensureNotification(params: {
  recipientId: bigint
  senderId: bigint
  title: string
  message: string
  type: string
  referenceId: bigint
}) {
  const existing = await prisma.notifications.findFirst({
    where: {
      recipient_user_id: params.recipientId,
      notification_type: params.type,
      reference_table: 'lesson_sessions',
      reference_id: params.referenceId,
    },
  })

  if (existing) {
    return prisma.notifications.update({
      where: { id: existing.id },
      data: {
        sender_user_id: params.senderId,
        title: params.title,
        message: params.message,
        is_read: false,
      },
    })
  }

  return prisma.notifications.create({
    data: {
      recipient_user_id: params.recipientId,
      sender_user_id: params.senderId,
      title: params.title,
      message: params.message,
      notification_type: params.type,
      reference_table: 'lesson_sessions',
      reference_id: params.referenceId,
    },
  })
}

async function ensureActivityLog(params: {
  schoolId: bigint
  userId: bigint
  type: string
  title: string
  description: string
  referenceId: bigint
}) {
  const existing = await prisma.activity_logs.findFirst({
    where: {
      school_id: params.schoolId,
      user_id: params.userId,
      activity_type: params.type,
      reference_table: 'lesson_sessions',
      reference_id: params.referenceId,
    },
  })

  if (existing) {
    return prisma.activity_logs.update({
      where: { id: existing.id },
      data: {
        title: params.title,
        description: params.description,
      },
    })
  }

  return prisma.activity_logs.create({
    data: {
      school_id: params.schoolId,
      user_id: params.userId,
      activity_type: params.type,
      module_name: 'lesson_reports',
      reference_table: 'lesson_sessions',
      reference_id: params.referenceId,
      title: params.title,
      description: params.description,
    },
  })
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10)
  const roles = await Promise.all(roleSeeds.map(upsertRole))
  const roleByName = new Map(roles.map((role) => [role.name, role]))

  const school = await prisma.schools.upsert({
    where: { code: schoolCode },
    update: {
      name: 'Ecole Demo Controle Pedagogique',
      promoter_name: 'Promoteur Principal',
      promoter_email: 'promoteur@demo.com',
      phone: '+243810000000',
      address: 'Kinshasa, RDC',
      status: 'active',
    },
    create: {
      code: schoolCode,
      name: 'Ecole Demo Controle Pedagogique',
      promoter_name: 'Promoteur Principal',
      promoter_email: 'promoteur@demo.com',
      phone: '+243810000000',
      address: 'Kinshasa, RDC',
      status: 'active',
    },
  })

  const promoter = await upsertDemoUser({
    email: 'promoteur@demo.com',
    firstName: 'Promoteur',
    lastName: 'Principal',
    roleId: roleByName.get('ADMIN_GESTIONNAIRE')!.id,
    schoolId: school.id,
    passwordHash,
  })
  const prefect = await upsertDemoUser({
    email: 'prefet@demo.com',
    firstName: 'M.',
    lastName: 'Kalala',
    roleId: roleByName.get('PREFET')!.id,
    schoolId: school.id,
    passwordHash,
  })
  const teacher = await upsertDemoUser({
    email: 'enseignant@demo.com',
    firstName: 'Jean',
    lastName: 'Kabasele',
    roleId: roleByName.get('ENSEIGNANT')!.id,
    schoolId: school.id,
    passwordHash,
  })
  await upsertDemoUser({
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'Management',
    roleId: roleByName.get('SUPER_ADMIN')!.id,
    schoolId: null,
    passwordHash,
  })

  const educationLevel = await prisma.education_levels.upsert({
    where: { name: 'Secondaire Demo' },
    update: { code: 'SEC-DEMO', order_index: 1, is_active: true },
    create: { name: 'Secondaire Demo', code: 'SEC-DEMO', order_index: 1, is_active: true },
  })
  const educationOption = await prisma.education_options.upsert({
    where: { name: 'Generale Demo' },
    update: { code: 'GEN-DEMO', description: 'Option generale demo', is_active: true },
    create: { name: 'Generale Demo', code: 'GEN-DEMO', description: 'Option generale demo', is_active: true },
  })
  const subject = await prisma.subjects.upsert({
    where: { name: subjectName },
    update: { code: 'MATH-DEMO', description: 'Mathematiques demo', is_active: true },
    create: { name: subjectName, code: 'MATH-DEMO', description: 'Mathematiques demo', is_active: true },
  })

  const academicYear = await prisma.academic_years.upsert({
    where: {
      school_id_name: {
        school_id: school.id,
        name: academicYearName,
      },
    },
    update: {
      start_date: dateOnly('2024-09-02'),
      end_date: dateOnly('2025-07-04'),
      is_active: true,
    },
    create: {
      school_id: school.id,
      name: academicYearName,
      start_date: dateOnly('2024-09-02'),
      end_date: dateOnly('2025-07-04'),
      is_active: true,
    },
  })

  const schoolClass = await prisma.school_classes.upsert({
    where: {
      school_id_education_level_id_education_option_id_parallel: {
        school_id: school.id,
        education_level_id: educationLevel.id,
        education_option_id: educationOption.id,
        parallel: classParallel,
      },
    },
    update: {
      name: className,
      is_active: true,
    },
    create: {
      school_id: school.id,
      education_level_id: educationLevel.id,
      education_option_id: educationOption.id,
      name: className,
      parallel: classParallel,
      is_active: true,
    },
  })

  const academicYearClass = await prisma.academic_year_classes.upsert({
    where: {
      academic_year_id_school_class_id: {
        academic_year_id: academicYear.id,
        school_class_id: schoolClass.id,
      },
    },
    update: { is_active: true },
    create: {
      academic_year_id: academicYear.id,
      school_class_id: schoolClass.id,
      is_active: true,
    },
  })

  const academicYearSubject = await prisma.academic_year_subjects.upsert({
    where: {
      academic_year_class_id_subject_id: {
        academic_year_class_id: academicYearClass.id,
        subject_id: subject.id,
      },
    },
    update: { is_active: true },
    create: {
      academic_year_class_id: academicYearClass.id,
      subject_id: subject.id,
      is_active: true,
    },
  })

  const annualProgram = await prisma.annual_programs.upsert({
    where: {
      id: (await prisma.annual_programs.findFirst({
        where: { academic_year_subject_id: academicYearSubject.id, title: 'Programme annuel Mathematiques Demo' },
        select: { id: true },
      }))?.id ?? BigInt(0),
    },
    update: {
      created_by_user_id: promoter.id,
      description: 'Programme demo pour tester les rapports quotidiens.',
      total_chapters: 2,
      total_periods: 8,
      periods_per_week: 4,
      period_duration_minutes: 45,
      include_saturdays: false,
      status: 'draft',
    },
    create: {
      academic_year_subject_id: academicYearSubject.id,
      created_by_user_id: promoter.id,
      title: 'Programme annuel Mathematiques Demo',
      description: 'Programme demo pour tester les rapports quotidiens.',
      total_chapters: 2,
      total_periods: 8,
      periods_per_week: 4,
      period_duration_minutes: 45,
      include_saturdays: false,
      status: 'draft',
    },
  })

  const chapterFractions = await ensureChapter({
    annualProgramId: annualProgram.id,
    title: 'Fractions',
    description: 'Notions de base, simplification et operations.',
    orderIndex: 1,
    plannedPeriods: 4,
  })
  const chapterEquations = await ensureChapter({
    annualProgramId: annualProgram.id,
    title: 'Equations du premier degre',
    description: 'Resolution et problemes simples.',
    orderIndex: 2,
    plannedPeriods: 4,
  })

  const subChapters = [
    await ensureSubChapter({ chapterId: chapterFractions.id, title: 'Definition des fractions', description: 'Lire et representer une fraction.', orderIndex: 1, plannedPeriods: 1 }),
    await ensureSubChapter({ chapterId: chapterFractions.id, title: 'Simplification', description: 'Simplifier une fraction.', orderIndex: 2, plannedPeriods: 1 }),
    await ensureSubChapter({ chapterId: chapterEquations.id, title: 'Introduction aux equations', description: 'Identifier une equation.', orderIndex: 1, plannedPeriods: 1 }),
    await ensureSubChapter({ chapterId: chapterEquations.id, title: 'Resolution', description: 'Resoudre une equation simple.', orderIndex: 2, plannedPeriods: 1 }),
  ]

  const period = await prisma.program_periods.upsert({
    where: {
      annual_program_id_order_index: {
        annual_program_id: annualProgram.id,
        order_index: 1,
      },
    },
    update: {
      name: 'Premier trimestre demo',
      period_type: 'trimestre',
      start_date: dateOnly('2024-09-02'),
      end_date: dateOnly('2024-12-20'),
      planned_weeks: 15,
      planned_periods: 8,
      objective: 'Installer les bases du programme annuel.',
    },
    create: {
      annual_program_id: annualProgram.id,
      name: 'Premier trimestre demo',
      period_type: 'trimestre',
      start_date: dateOnly('2024-09-02'),
      end_date: dateOnly('2024-12-20'),
      planned_weeks: 15,
      planned_periods: 8,
      objective: 'Installer les bases du programme annuel.',
      order_index: 1,
    },
  })

  const distributions = await Promise.all([
    findOrCreateDistribution({ annualProgramId: annualProgram.id, periodId: period.id, chapterId: chapterFractions.id, subChapterId: subChapters[0].id, plannedDate: dateOnly('2024-09-09'), plannedWeek: 2, plannedDay: 'Lundi' }),
    findOrCreateDistribution({ annualProgramId: annualProgram.id, periodId: period.id, chapterId: chapterFractions.id, subChapterId: subChapters[1].id, plannedDate: dateOnly('2024-09-10'), plannedWeek: 2, plannedDay: 'Mardi' }),
    findOrCreateDistribution({ annualProgramId: annualProgram.id, periodId: period.id, chapterId: chapterEquations.id, subChapterId: subChapters[2].id, plannedDate: dateOnly('2024-09-11'), plannedWeek: 2, plannedDay: 'Mercredi' }),
    findOrCreateDistribution({ annualProgramId: annualProgram.id, periodId: period.id, chapterId: chapterEquations.id, subChapterId: subChapters[3].id, plannedDate: dateOnly('2024-09-12'), plannedWeek: 2, plannedDay: 'Jeudi' }),
  ])

  const assignment = await prisma.teacher_assignments.upsert({
    where: {
      id: (await prisma.teacher_assignments.findFirst({
        where: {
          academic_year_subject_id: academicYearSubject.id,
          teacher_user_id: teacher.id,
        },
        select: { id: true },
      }))?.id ?? BigInt(0),
    },
    update: {
      assigned_by_user_id: prefect.id,
      assignment_type: 'titulaire',
      start_date: dateOnly('2024-09-02'),
      end_date: dateOnly('2025-07-04'),
      status: 'active',
      reason: 'Affectation demo idempotente',
    },
    create: {
      academic_year_subject_id: academicYearSubject.id,
      teacher_user_id: teacher.id,
      assigned_by_user_id: prefect.id,
      assignment_type: 'titulaire',
      start_date: dateOnly('2024-09-02'),
      end_date: dateOnly('2025-07-04'),
      status: 'active',
      reason: 'Affectation demo idempotente',
    },
  })

  await Promise.all([
    findOrCreateReport({ distributionId: distributions[0].id, assignmentId: assignment.id, teacherId: teacher.id, prefectId: prefect.id, schoolId: school.id, status: 'submitted', actualDate: dateOnly('2024-09-09'), summary: 'Definition des fractions avec exemples concrets au tableau.' }),
    findOrCreateReport({ distributionId: distributions[1].id, assignmentId: assignment.id, teacherId: teacher.id, prefectId: prefect.id, schoolId: school.id, status: 'validated', actualDate: dateOnly('2024-09-10'), summary: 'Simplification des fractions et exercices diriges.', observation: 'Rapport conforme au programme et aux objectifs.' }),
    findOrCreateReport({ distributionId: distributions[2].id, assignmentId: assignment.id, teacherId: teacher.id, prefectId: prefect.id, schoolId: school.id, status: 'rejected', actualDate: dateOnly('2024-09-11'), summary: 'Introduction aux equations mais progression incomplete.', observation: 'Le contenu declare ne correspond pas a la repartition prevue.' }),
    findOrCreateReport({ distributionId: distributions[3].id, assignmentId: assignment.id, teacherId: teacher.id, prefectId: prefect.id, schoolId: school.id, status: 'correction_requested', actualDate: dateOnly('2024-09-12'), summary: 'Resolution des equations simples avec exercices.', observation: 'Ajouter les exercices donnes et les objectifs atteints.' }),
  ])

  await ensureNotification({
    recipientId: promoter.id,
    senderId: prefect.id,
    title: 'Supervision demo',
    message: 'Les rapports quotidiens demo sont disponibles pour supervision silencieuse.',
    type: 'demo_supervision_ready',
    referenceId: annualProgram.id,
  })

  await ensureActivityLog({
    schoolId: school.id,
    userId: promoter.id,
    type: 'demo_seed_completed',
    title: 'Seed demo rapports quotidiens',
    description: 'Donnees demo idempotentes creees pour les rapports quotidiens.',
    referenceId: annualProgram.id,
  })

  console.log('Seed demo completed without printing credentials')
}

main()
  .catch((error) => {
    console.error('Seed demo failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
