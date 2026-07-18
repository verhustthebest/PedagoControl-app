-- CreateTable
CREATE TABLE "parent_contribution_settings" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "school_id" BIGINT NOT NULL,
    "mode" VARCHAR(40) NOT NULL,
    "monthly_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "due_day" INTEGER NOT NULL DEFAULT 5,
    "grace_days" INTEGER NOT NULL DEFAULT 0,
    "reminder_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "created_by_user_id" BIGINT NOT NULL,
    "updated_by_user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_contribution_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_contribution_dues" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "school_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "setting_id" BIGINT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "mode_snapshot" VARCHAR(40) NOT NULL,
    "amount_due" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "grace_days_snapshot" INTEGER NOT NULL,
    "reminder_days_snapshot" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_contribution_dues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_contribution_payments" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "due_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "payment_method" VARCHAR(30) NOT NULL,
    "reference" VARCHAR(150),
    "notes" TEXT,
    "paid_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_contribution_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_contribution_settings_public_id_key" ON "parent_contribution_settings"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_contribution_settings_school_id_key" ON "parent_contribution_settings"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_contribution_dues_public_id_key" ON "parent_contribution_dues"("public_id");

-- CreateIndex
CREATE INDEX "parent_contribution_dues_school_id_period_start_idx" ON "parent_contribution_dues"("school_id", "period_start");

-- CreateIndex
CREATE INDEX "parent_contribution_dues_student_id_status_idx" ON "parent_contribution_dues"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_parent_contribution_student_period" ON "parent_contribution_dues"("student_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "parent_contribution_payments_public_id_key" ON "parent_contribution_payments"("public_id");

-- CreateIndex
CREATE INDEX "parent_contribution_payments_due_id_paid_at_idx" ON "parent_contribution_payments"("due_id", "paid_at");

-- AddForeignKey
ALTER TABLE "parent_contribution_settings" ADD CONSTRAINT "parent_contribution_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_contribution_settings" ADD CONSTRAINT "parent_contribution_settings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_contribution_settings" ADD CONSTRAINT "parent_contribution_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_contribution_dues" ADD CONSTRAINT "parent_contribution_dues_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_contribution_dues" ADD CONSTRAINT "parent_contribution_dues_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_contribution_dues" ADD CONSTRAINT "parent_contribution_dues_setting_id_fkey" FOREIGN KEY ("setting_id") REFERENCES "parent_contribution_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_contribution_payments" ADD CONSTRAINT "parent_contribution_payments_due_id_fkey" FOREIGN KEY ("due_id") REFERENCES "parent_contribution_dues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_contribution_payments" ADD CONSTRAINT "parent_contribution_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
