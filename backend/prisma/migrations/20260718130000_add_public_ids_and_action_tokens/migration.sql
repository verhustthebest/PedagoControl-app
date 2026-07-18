CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "schools" ADD COLUMN "public_id" UUID;
ALTER TABLE "students" ADD COLUMN "public_id" UUID;
ALTER TABLE "guardians" ADD COLUMN "public_id" UUID;
ALTER TABLE "school_invoices" ADD COLUMN "public_id" UUID;
ALTER TABLE "attachment_requests" ADD COLUMN "public_id" UUID;

UPDATE "schools" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
UPDATE "students" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
UPDATE "guardians" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
UPDATE "school_invoices" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
UPDATE "attachment_requests" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;

ALTER TABLE "schools" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "guardians" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "school_invoices" ALTER COLUMN "public_id" SET NOT NULL;
ALTER TABLE "attachment_requests" ALTER COLUMN "public_id" SET NOT NULL;

CREATE UNIQUE INDEX "schools_public_id_key" ON "schools"("public_id");
CREATE UNIQUE INDEX "students_public_id_key" ON "students"("public_id");
CREATE UNIQUE INDEX "guardians_public_id_key" ON "guardians"("public_id");
CREATE UNIQUE INDEX "school_invoices_public_id_key" ON "school_invoices"("public_id");
CREATE UNIQUE INDEX "attachment_requests_public_id_key" ON "attachment_requests"("public_id");

CREATE TABLE "action_tokens" (
  "id" UUID NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "action" VARCHAR(60) NOT NULL,
  "user_id" BIGINT,
  "guardian_id" BIGINT,
  "school_invoice_id" BIGINT,
  "resource_public_id" UUID,
  "expires_at" TIMESTAMP(6) NOT NULL,
  "used_at" TIMESTAMP(6),
  "revoked_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "action_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "action_tokens_token_hash_key" ON "action_tokens"("token_hash");
CREATE INDEX "idx_action_tokens_action_user" ON "action_tokens"("action", "user_id");
CREATE INDEX "idx_action_tokens_action_guardian" ON "action_tokens"("action", "guardian_id");
CREATE INDEX "idx_action_tokens_action_invoice" ON "action_tokens"("action", "school_invoice_id");
CREATE INDEX "idx_action_tokens_expires_at" ON "action_tokens"("expires_at");
CREATE INDEX "idx_action_tokens_revoked_at" ON "action_tokens"("revoked_at");

ALTER TABLE "action_tokens" ADD CONSTRAINT "fk_action_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "action_tokens" ADD CONSTRAINT "fk_action_tokens_guardian" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "action_tokens" ADD CONSTRAINT "fk_action_tokens_invoice" FOREIGN KEY ("school_invoice_id") REFERENCES "school_invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
