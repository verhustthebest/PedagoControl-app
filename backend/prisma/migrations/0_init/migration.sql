-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "academic_year_classes" (
    "id" BIGSERIAL NOT NULL,
    "academic_year_id" BIGINT NOT NULL,
    "school_class_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_year_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_year_subjects" (
    "id" BIGSERIAL NOT NULL,
    "academic_year_class_id" BIGINT NOT NULL,
    "subject_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_year_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "activity_type" VARCHAR(50) NOT NULL,
    "module_name" VARCHAR(100) NOT NULL,
    "reference_table" VARCHAR(100),
    "reference_id" BIGINT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_programs" (
    "id" BIGSERIAL NOT NULL,
    "academic_year_subject_id" BIGINT NOT NULL,
    "created_by_user_id" BIGINT,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "total_chapters" INTEGER NOT NULL,
    "total_periods" INTEGER NOT NULL,
    "periods_per_week" INTEGER,
    "period_duration_minutes" INTEGER,
    "include_saturdays" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_levels" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50),
    "order_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_options" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_comments" (
    "id" BIGSERIAL NOT NULL,
    "lesson_session_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "comment_type" VARCHAR(30) NOT NULL DEFAULT 'observation',
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_sessions" (
    "id" BIGSERIAL NOT NULL,
    "program_distribution_id" BIGINT NOT NULL,
    "teacher_assignment_id" BIGINT NOT NULL,
    "teacher_user_id" BIGINT NOT NULL,
    "actual_date" DATE NOT NULL,
    "actual_start_time" TIME(6),
    "actual_end_time" TIME(6),
    "actual_periods" INTEGER NOT NULL DEFAULT 1,
    "lesson_status" VARCHAR(30) NOT NULL DEFAULT 'submitted',
    "lesson_summary" TEXT NOT NULL,
    "objectives_achieved" TEXT,
    "exercises_given" TEXT,
    "homework_given" TEXT,
    "observations" TEXT,
    "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_validations" (
    "id" BIGSERIAL NOT NULL,
    "lesson_session_id" BIGINT NOT NULL,
    "prefect_user_id" BIGINT NOT NULL,
    "decision" VARCHAR(30) NOT NULL,
    "validation_comment" TEXT,
    "validated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "recipient_user_id" BIGINT NOT NULL,
    "sender_user_id" BIGINT,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "reference_table" VARCHAR(100),
    "reference_id" BIGINT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_chapters" (
    "id" BIGSERIAL NOT NULL,
    "annual_program_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "planned_periods" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_distribution" (
    "id" BIGSERIAL NOT NULL,
    "annual_program_id" BIGINT NOT NULL,
    "program_period_id" BIGINT,
    "program_chapter_id" BIGINT NOT NULL,
    "program_sub_chapter_id" BIGINT,
    "planned_date" DATE NOT NULL,
    "planned_week" INTEGER,
    "planned_day" VARCHAR(20),
    "planned_start_time" TIME(6),
    "planned_end_time" TIME(6),
    "planned_periods" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(30) NOT NULL DEFAULT 'planned',
    "submitted_at" TIMESTAMP(6),
    "validated_at" TIMESTAMP(6),
    "rejected_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_periods" (
    "id" BIGSERIAL NOT NULL,
    "annual_program_id" BIGINT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "period_type" VARCHAR(30) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "planned_weeks" INTEGER,
    "planned_periods" INTEGER NOT NULL DEFAULT 0,
    "objective" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_sub_chapters" (
    "id" BIGSERIAL NOT NULL,
    "program_chapter_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "planned_periods" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_sub_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_attachments" (
    "id" BIGSERIAL NOT NULL,
    "lesson_session_id" BIGINT NOT NULL,
    "uploaded_by_user_id" BIGINT NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "stored_file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_calendar" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "academic_year_id" BIGINT NOT NULL,
    "event_date" DATE NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "is_working_day" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_classes" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "education_level_id" BIGINT NOT NULL,
    "education_option_id" BIGINT,
    "name" VARCHAR(100) NOT NULL,
    "parallel" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "subscription_id" BIGINT NOT NULL,
    "teacher_limit" INTEGER NOT NULL,
    "billing_period" VARCHAR(30) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "amount_to_pay" DECIMAL(10,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "promoter_name" VARCHAR(150) NOT NULL,
    "promoter_email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "min_teachers" INTEGER NOT NULL,
    "max_teachers" INTEGER,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "annual_price" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" BIGSERIAL NOT NULL,
    "academic_year_subject_id" BIGINT NOT NULL,
    "teacher_user_id" BIGINT NOT NULL,
    "assigned_by_user_id" BIGINT,
    "assignment_type" VARCHAR(30) NOT NULL DEFAULT 'titulaire',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "password_hash" TEXT NOT NULL,
    "profile_photo" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_academic_year_classes_year_id" ON "academic_year_classes"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ayc" ON "academic_year_classes"("academic_year_id", "school_class_id");

-- CreateIndex
CREATE INDEX "idx_academic_year_subjects_class_id" ON "academic_year_subjects"("academic_year_class_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_year_class_subject" ON "academic_year_subjects"("academic_year_class_id", "subject_id");

-- CreateIndex
CREATE INDEX "idx_academic_years_school_id" ON "academic_years"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_academic_year" ON "academic_years"("school_id", "name");

-- CreateIndex
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_activity_logs_school" ON "activity_logs"("school_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_user" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_annual_programs_subject" ON "annual_programs"("academic_year_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "education_levels_name_key" ON "education_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "education_levels_code_key" ON "education_levels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "education_options_name_key" ON "education_options"("name");

-- CreateIndex
CREATE UNIQUE INDEX "education_options_code_key" ON "education_options"("code");

-- CreateIndex
CREATE INDEX "idx_lesson_sessions_date" ON "lesson_sessions"("actual_date");

-- CreateIndex
CREATE INDEX "idx_lesson_sessions_distribution" ON "lesson_sessions"("program_distribution_id");

-- CreateIndex
CREATE INDEX "idx_lesson_sessions_status" ON "lesson_sessions"("lesson_status");

-- CreateIndex
CREATE INDEX "idx_lesson_sessions_teacher" ON "lesson_sessions"("teacher_user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_read" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_recipient" ON "notifications"("recipient_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_program_chapter_order" ON "program_chapters"("annual_program_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_program_distribution_date" ON "program_distribution"("planned_date");

-- CreateIndex
CREATE INDEX "idx_program_distribution_program" ON "program_distribution"("annual_program_id");

-- CreateIndex
CREATE INDEX "idx_program_distribution_status" ON "program_distribution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_program_period_order" ON "program_periods"("annual_program_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "uq_chapter_sub_order" ON "program_sub_chapters"("program_chapter_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "uq_role_permission" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_calendar_event" ON "school_calendar"("school_id", "academic_year_id", "event_date", "event_type");

-- CreateIndex
CREATE INDEX "idx_school_classes_school_id" ON "school_classes"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_class" ON "school_classes"("school_id", "education_level_id", "education_option_id", "parallel");

-- CreateIndex
CREATE INDEX "idx_school_subscriptions_school_id" ON "school_subscriptions"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_code_key" ON "subscriptions"("code");

-- CreateIndex
CREATE INDEX "idx_teacher_assignments_subject" ON "teacher_assignments"("academic_year_subject_id");

-- CreateIndex
CREATE INDEX "idx_teacher_assignments_teacher" ON "teacher_assignments"("teacher_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_role" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_school_id" ON "users"("school_id");

-- AddForeignKey
ALTER TABLE "academic_year_classes" ADD CONSTRAINT "fk_ayc_class" FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "academic_year_classes" ADD CONSTRAINT "fk_ayc_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "academic_year_subjects" ADD CONSTRAINT "fk_ays_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "academic_year_subjects" ADD CONSTRAINT "fk_ays_year_class" FOREIGN KEY ("academic_year_class_id") REFERENCES "academic_year_classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "fk_academic_year_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "fk_activity_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "fk_activity_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "annual_programs" ADD CONSTRAINT "fk_ap_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "annual_programs" ADD CONSTRAINT "fk_ap_year_subject" FOREIGN KEY ("academic_year_subject_id") REFERENCES "academic_year_subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_comments" ADD CONSTRAINT "fk_comment_lesson" FOREIGN KEY ("lesson_session_id") REFERENCES "lesson_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_comments" ADD CONSTRAINT "fk_comment_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "fk_lesson_assignment" FOREIGN KEY ("teacher_assignment_id") REFERENCES "teacher_assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "fk_lesson_distribution" FOREIGN KEY ("program_distribution_id") REFERENCES "program_distribution"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "fk_lesson_teacher" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_validations" ADD CONSTRAINT "fk_validation_lesson" FOREIGN KEY ("lesson_session_id") REFERENCES "lesson_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_validations" ADD CONSTRAINT "fk_validation_prefect" FOREIGN KEY ("prefect_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notification_recipient" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notification_sender" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_chapters" ADD CONSTRAINT "fk_chapter_program" FOREIGN KEY ("annual_program_id") REFERENCES "annual_programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_distribution" ADD CONSTRAINT "fk_pd_chapter" FOREIGN KEY ("program_chapter_id") REFERENCES "program_chapters"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_distribution" ADD CONSTRAINT "fk_pd_period" FOREIGN KEY ("program_period_id") REFERENCES "program_periods"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_distribution" ADD CONSTRAINT "fk_pd_program" FOREIGN KEY ("annual_program_id") REFERENCES "annual_programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_distribution" ADD CONSTRAINT "fk_pd_sub_chapter" FOREIGN KEY ("program_sub_chapter_id") REFERENCES "program_sub_chapters"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_periods" ADD CONSTRAINT "fk_period_program" FOREIGN KEY ("annual_program_id") REFERENCES "annual_programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_sub_chapters" ADD CONSTRAINT "fk_sub_chapter_chapter" FOREIGN KEY ("program_chapter_id") REFERENCES "program_chapters"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "report_attachments" ADD CONSTRAINT "fk_attachment_lesson" FOREIGN KEY ("lesson_session_id") REFERENCES "lesson_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "report_attachments" ADD CONSTRAINT "fk_attachment_user" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_calendar" ADD CONSTRAINT "fk_calendar_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_calendar" ADD CONSTRAINT "fk_calendar_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_classes" ADD CONSTRAINT "fk_school_classes_level" FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_classes" ADD CONSTRAINT "fk_school_classes_option" FOREIGN KEY ("education_option_id") REFERENCES "education_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_classes" ADD CONSTRAINT "fk_school_classes_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "fk_school_subscription_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "fk_school_subscription_subscription" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "fk_ta_assigned_by" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "fk_ta_teacher" FOREIGN KEY ("teacher_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "fk_ta_year_subject" FOREIGN KEY ("academic_year_subject_id") REFERENCES "academic_year_subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

