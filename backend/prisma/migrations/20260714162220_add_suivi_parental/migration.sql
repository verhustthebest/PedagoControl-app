-- CreateTable
CREATE TABLE "school_parental_settings" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabled_at" TIMESTAMP(6),
    "disabled_at" TIMESTAMP(6),
    "attachment_requires_validation" BOOLEAN NOT NULL DEFAULT true,
    "attachment_request_expiry_days" INTEGER NOT NULL DEFAULT 7,
    "otp_expiry_minutes" INTEGER NOT NULL DEFAULT 10,
    "otp_max_attempts" INTEGER NOT NULL DEFAULT 5,
    "daily_acknowledgement_required" BOOLEAN NOT NULL DEFAULT true,
    "daily_acknowledgement_deadline" TIME(6),
    "created_by_user_id" BIGINT,
    "updated_by_user_id" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_parental_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "matricule" VARCHAR(100) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "gender" VARCHAR(20),
    "birth_date" DATE,
    "birth_place" VARCHAR(150),
    "profile_photo" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_by_user_id" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "academic_year_class_id" BIGINT NOT NULL,
    "enrolled_by_user_id" BIGINT,
    "enrollment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "parental_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "parental_tracking_started_at" TIMESTAMP(6),
    "parental_tracking_ended_at" TIMESTAMP(6),
    "school_parental_subscription_id" BIGINT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "national_id_number" VARCHAR(100),
    "occupation" VARCHAR(150),
    "address" TEXT,
    "preferred_contact_method" VARCHAR(30),
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "guardian_id" BIGINT NOT NULL,
    "relationship_type" VARCHAR(50) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "can_receive_alerts" BOOLEAN NOT NULL DEFAULT true,
    "can_view_journal" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "validated_by_user_id" BIGINT,
    "validated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_requests" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "guardian_id" BIGINT NOT NULL,
    "requested_by_user_id" BIGINT NOT NULL,
    "reviewed_by_user_id" BIGINT,
    "request_code" VARCHAR(100) NOT NULL,
    "relationship_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "request_message" TEXT,
    "review_comment" TEXT,
    "expires_at" TIMESTAMP(6),
    "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_request_documents" (
    "id" BIGSERIAL NOT NULL,
    "attachment_request_id" BIGINT NOT NULL,
    "uploaded_by_user_id" BIGINT NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "stored_file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_request_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_verifications" (
    "id" BIGSERIAL NOT NULL,
    "guardian_id" BIGINT NOT NULL,
    "contact_type" VARCHAR(30) NOT NULL,
    "contact_value" VARCHAR(150) NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "verified_at" TIMESTAMP(6),
    "consumed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_daily_acknowledgements" (
    "id" BIGSERIAL NOT NULL,
    "guardian_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "lesson_session_id" BIGINT NOT NULL,
    "lesson_validation_id" BIGINT,
    "acknowledgement_date" DATE NOT NULL,
    "acknowledged_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_daily_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_parental_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "school_subscription_id" BIGINT NOT NULL,
    "unit_price_per_student" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "billing_period" VARCHAR(30) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "invoice_day" INTEGER,
    "next_invoice_date" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_parental_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_invoices" (
    "id" BIGSERIAL NOT NULL,
    "school_id" BIGINT NOT NULL,
    "school_subscription_id" BIGINT NOT NULL,
    "invoice_number" VARCHAR(100) NOT NULL,
    "invoice_type" VARCHAR(30) NOT NULL,
    "billing_period_start" DATE,
    "billing_period_end" DATE,
    "student_count_snapshot" INTEGER,
    "billing_email" VARCHAR(150) NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "emailed_at" TIMESTAMP(6),
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_invoice_items" (
    "id" BIGSERIAL NOT NULL,
    "school_invoice_id" BIGINT NOT NULL,
    "item_type" VARCHAR(30) NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "school_parental_subscription_id" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_invoice_payments" (
    "id" BIGSERIAL NOT NULL,
    "school_invoice_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "payment_method" VARCHAR(30) NOT NULL,
    "transaction_reference" VARCHAR(150),
    "receipt_number" VARCHAR(100) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'completed',
    "paid_at" TIMESTAMP(6) NOT NULL,
    "recorded_by_user_id" BIGINT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_parental_settings_school_id_key" ON "school_parental_settings"("school_id");

-- CreateIndex
CREATE INDEX "idx_parental_settings_school" ON "school_parental_settings"("school_id");

-- CreateIndex
CREATE INDEX "idx_students_school" ON "students"("school_id");

-- CreateIndex
CREATE INDEX "idx_students_status" ON "students"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_students_school_matricule" ON "students"("school_id", "matricule");

-- CreateIndex
CREATE INDEX "idx_student_enrollments_year_class" ON "student_enrollments"("academic_year_class_id");

-- CreateIndex
CREATE INDEX "idx_student_enrollments_student" ON "student_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "idx_student_enrollments_parental_subscription" ON "student_enrollments"("school_parental_subscription_id");

-- CreateIndex
CREATE INDEX "idx_student_enrollments_parental_tracking" ON "student_enrollments"("parental_tracking_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "uq_student_enrollment_year_class" ON "student_enrollments"("student_id", "academic_year_class_id");

-- CreateIndex
CREATE INDEX "idx_guardians_school" ON "guardians"("school_id");

-- CreateIndex
CREATE INDEX "idx_guardians_user" ON "guardians"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_guardians_school_user" ON "guardians"("school_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_student_guardians_guardian" ON "student_guardians"("guardian_id");

-- CreateIndex
CREATE INDEX "idx_student_guardians_student" ON "student_guardians"("student_id");

-- CreateIndex
CREATE INDEX "idx_student_guardians_status" ON "student_guardians"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_student_guardian" ON "student_guardians"("student_id", "guardian_id");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_requests_request_code_key" ON "attachment_requests"("request_code");

-- CreateIndex
CREATE INDEX "idx_attachment_requests_guardian" ON "attachment_requests"("guardian_id");

-- CreateIndex
CREATE INDEX "idx_attachment_requests_school_status" ON "attachment_requests"("school_id", "status");

-- CreateIndex
CREATE INDEX "idx_attachment_requests_student" ON "attachment_requests"("student_id");

-- CreateIndex
CREATE INDEX "idx_attachment_documents_request" ON "attachment_request_documents"("attachment_request_id");

-- CreateIndex
CREATE INDEX "idx_contact_verifications_contact" ON "contact_verifications"("contact_value", "contact_type");

-- CreateIndex
CREATE INDEX "idx_contact_verifications_expires_at" ON "contact_verifications"("expires_at");

-- CreateIndex
CREATE INDEX "idx_contact_verifications_guardian_status" ON "contact_verifications"("guardian_id", "status");

-- CreateIndex
CREATE INDEX "idx_parent_ack_lesson" ON "parent_daily_acknowledgements"("lesson_session_id");

-- CreateIndex
CREATE INDEX "idx_parent_ack_student_date" ON "parent_daily_acknowledgements"("student_id", "acknowledgement_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_parent_daily_acknowledgement" ON "parent_daily_acknowledgements"("guardian_id", "student_id", "acknowledgement_date");

-- CreateIndex
CREATE INDEX "idx_school_parental_subscription_status" ON "school_parental_subscriptions"("school_id", "status");

-- CreateIndex
CREATE INDEX "idx_school_parental_subscription_main" ON "school_parental_subscriptions"("school_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_parental_main_subscription" ON "school_parental_subscriptions"("school_id", "school_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_invoices_invoice_number_key" ON "school_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_school_invoices_school_status" ON "school_invoices"("school_id", "status");

-- CreateIndex
CREATE INDEX "idx_school_invoices_type" ON "school_invoices"("invoice_type");

-- CreateIndex
CREATE INDEX "idx_school_invoices_subscription" ON "school_invoices"("school_subscription_id");

-- CreateIndex
CREATE INDEX "idx_school_invoices_due_date" ON "school_invoices"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_invoice_billing_period" ON "school_invoices"("school_id", "invoice_type", "billing_period_start", "billing_period_end");

-- CreateIndex
CREATE INDEX "idx_school_invoice_items_invoice" ON "school_invoice_items"("school_invoice_id");

-- CreateIndex
CREATE INDEX "idx_school_invoice_items_parental_subscription" ON "school_invoice_items"("school_parental_subscription_id");

-- CreateIndex
CREATE INDEX "idx_school_invoice_items_type" ON "school_invoice_items"("item_type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_invoice_item_type" ON "school_invoice_items"("school_invoice_id", "item_type");

-- CreateIndex
CREATE UNIQUE INDEX "school_invoice_payments_receipt_number_key" ON "school_invoice_payments"("receipt_number");

-- CreateIndex
CREATE INDEX "idx_school_invoice_payments_invoice" ON "school_invoice_payments"("school_invoice_id");

-- CreateIndex
CREATE INDEX "idx_school_invoice_payments_recorded_by" ON "school_invoice_payments"("recorded_by_user_id");

-- CreateIndex
CREATE INDEX "idx_school_invoice_payments_status" ON "school_invoice_payments"("status");

-- AddForeignKey
ALTER TABLE "school_parental_settings" ADD CONSTRAINT "fk_parental_settings_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_parental_settings" ADD CONSTRAINT "fk_parental_settings_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_parental_settings" ADD CONSTRAINT "fk_parental_settings_updated_by" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "fk_students_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "fk_students_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "fk_student_enrollments_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "fk_student_enrollments_year_class" FOREIGN KEY ("academic_year_class_id") REFERENCES "academic_year_classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "fk_student_enrollments_enrolled_by" FOREIGN KEY ("enrolled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "fk_student_enrollments_parental_subscription" FOREIGN KEY ("school_parental_subscription_id") REFERENCES "school_parental_subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "fk_guardians_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "fk_guardians_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "fk_student_guardians_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "fk_student_guardians_guardian" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "fk_student_guardians_validated_by" FOREIGN KEY ("validated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_requests" ADD CONSTRAINT "fk_attachment_requests_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_requests" ADD CONSTRAINT "fk_attachment_requests_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_requests" ADD CONSTRAINT "fk_attachment_requests_guardian" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_requests" ADD CONSTRAINT "fk_attachment_requests_requested_by" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_requests" ADD CONSTRAINT "fk_attachment_requests_reviewed_by" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_request_documents" ADD CONSTRAINT "fk_attachment_documents_request" FOREIGN KEY ("attachment_request_id") REFERENCES "attachment_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_request_documents" ADD CONSTRAINT "fk_attachment_documents_uploaded_by" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact_verifications" ADD CONSTRAINT "fk_contact_verifications_guardian" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_daily_acknowledgements" ADD CONSTRAINT "fk_parent_ack_guardian" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_daily_acknowledgements" ADD CONSTRAINT "fk_parent_ack_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_daily_acknowledgements" ADD CONSTRAINT "fk_parent_ack_lesson" FOREIGN KEY ("lesson_session_id") REFERENCES "lesson_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_daily_acknowledgements" ADD CONSTRAINT "fk_parent_ack_validation" FOREIGN KEY ("lesson_validation_id") REFERENCES "lesson_validations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_parental_subscriptions" ADD CONSTRAINT "fk_school_parental_subscription_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_parental_subscriptions" ADD CONSTRAINT "fk_school_parental_subscription_main" FOREIGN KEY ("school_subscription_id") REFERENCES "school_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_invoices" ADD CONSTRAINT "fk_school_invoices_school" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_invoices" ADD CONSTRAINT "fk_school_invoices_subscription" FOREIGN KEY ("school_subscription_id") REFERENCES "school_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_invoice_items" ADD CONSTRAINT "fk_school_invoice_items_invoice" FOREIGN KEY ("school_invoice_id") REFERENCES "school_invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_invoice_items" ADD CONSTRAINT "fk_school_invoice_items_parental_subscription" FOREIGN KEY ("school_parental_subscription_id") REFERENCES "school_parental_subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_invoice_payments" ADD CONSTRAINT "fk_school_invoice_payments_invoice" FOREIGN KEY ("school_invoice_id") REFERENCES "school_invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "school_invoice_payments" ADD CONSTRAINT "fk_school_invoice_payments_recorded_by" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
