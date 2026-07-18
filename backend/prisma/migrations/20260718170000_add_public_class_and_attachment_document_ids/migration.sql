CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "academic_years" ADD COLUMN "public_id" UUID;
UPDATE "academic_years" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
ALTER TABLE "academic_years" ALTER COLUMN "public_id" SET NOT NULL;
CREATE UNIQUE INDEX "academic_years_public_id_key" ON "academic_years"("public_id");

ALTER TABLE "academic_year_classes" ADD COLUMN "public_id" UUID;
UPDATE "academic_year_classes" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
ALTER TABLE "academic_year_classes" ALTER COLUMN "public_id" SET NOT NULL;
CREATE UNIQUE INDEX "academic_year_classes_public_id_key" ON "academic_year_classes"("public_id");

ALTER TABLE "school_classes" ADD COLUMN "public_id" UUID;
UPDATE "school_classes" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
ALTER TABLE "school_classes" ALTER COLUMN "public_id" SET NOT NULL;
CREATE UNIQUE INDEX "school_classes_public_id_key" ON "school_classes"("public_id");

ALTER TABLE "attachment_request_documents"
  ADD COLUMN "public_id" UUID,
  ADD COLUMN "removed_at" TIMESTAMP(6);
UPDATE "attachment_request_documents" SET "public_id" = gen_random_uuid() WHERE "public_id" IS NULL;
ALTER TABLE "attachment_request_documents" ALTER COLUMN "public_id" SET NOT NULL;
CREATE UNIQUE INDEX "attachment_request_documents_public_id_key" ON "attachment_request_documents"("public_id");
