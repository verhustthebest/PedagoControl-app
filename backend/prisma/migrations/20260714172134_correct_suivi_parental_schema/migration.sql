/*
  Warnings:

  - You are about to drop the column `file_path` on the `attachment_request_documents` table. All the data in the column will be lost.
  - You are about to drop the column `acknowledgement_date` on the `parent_daily_acknowledgements` table. All the data in the column will be lost.
  - You are about to drop the column `lesson_session_id` on the `parent_daily_acknowledgements` table. All the data in the column will be lost.
  - You are about to drop the column `lesson_validation_id` on the `parent_daily_acknowledgements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[guardian_id,student_id,journal_date]` on the table `parent_daily_acknowledgements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `file_url` to the `attachment_request_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `guardians` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `guardians` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_year_class_id` to the `parent_daily_acknowledgements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `journal_date` to the `parent_daily_acknowledgements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `journal_snapshot` to the `parent_daily_acknowledgements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_count_snapshot` to the `parent_daily_acknowledgements` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `schools` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `address` to the `students` table without a default value. This is not possible if the table is not empty.
  - Made the column `middle_name` on table `students` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `students` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birth_date` on table `students` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birth_place` on table `students` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "attachment_request_documents" DROP CONSTRAINT "fk_attachment_documents_uploaded_by";

-- DropForeignKey
ALTER TABLE "attachment_requests" DROP CONSTRAINT "fk_attachment_requests_requested_by";

-- DropForeignKey
ALTER TABLE "guardians" DROP CONSTRAINT "fk_guardians_user";

-- DropForeignKey
ALTER TABLE "parent_daily_acknowledgements" DROP CONSTRAINT "fk_parent_ack_lesson";

-- DropForeignKey
ALTER TABLE "parent_daily_acknowledgements" DROP CONSTRAINT "fk_parent_ack_validation";

-- DropIndex
DROP INDEX "idx_parent_ack_lesson";

-- DropIndex
DROP INDEX "idx_parent_ack_student_date";

-- DropIndex
DROP INDEX "uq_parent_daily_acknowledgement";

-- AlterTable
ALTER TABLE "attachment_request_documents" DROP COLUMN "file_path",
ADD COLUMN     "file_url" TEXT NOT NULL,
ADD COLUMN     "storage_key" TEXT,
ALTER COLUMN "uploaded_by_user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "attachment_requests" ALTER COLUMN "requested_by_user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "guardians" ADD COLUMN     "created_by_user_id" BIGINT,
ADD COLUMN     "email" VARCHAR(150),
ADD COLUMN     "email_verified_at" TIMESTAMP(6),
ADD COLUMN     "first_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "last_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "middle_name" VARCHAR(100),
ADD COLUMN     "phone" VARCHAR(30),
ADD COLUMN     "phone_verified_at" TIMESTAMP(6),
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "parent_daily_acknowledgements" DROP COLUMN "acknowledgement_date",
DROP COLUMN "lesson_session_id",
DROP COLUMN "lesson_validation_id",
ADD COLUMN     "academic_year_class_id" BIGINT NOT NULL,
ADD COLUMN     "journal_date" DATE NOT NULL,
ADD COLUMN     "journal_snapshot" JSONB NOT NULL,
ADD COLUMN     "lesson_count_snapshot" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "schools" ALTER COLUMN "address" SET NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "address" TEXT NOT NULL,
ALTER COLUMN "middle_name" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "birth_date" SET NOT NULL,
ALTER COLUMN "birth_place" SET NOT NULL;

-- CreateIndex
CREATE INDEX "idx_guardians_created_by" ON "guardians"("created_by_user_id");

-- CreateIndex
CREATE INDEX "idx_parent_ack_year_class" ON "parent_daily_acknowledgements"("academic_year_class_id");

-- CreateIndex
CREATE INDEX "idx_parent_ack_student_date" ON "parent_daily_acknowledgements"("student_id", "journal_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_parent_daily_acknowledgement" ON "parent_daily_acknowledgements"("guardian_id", "student_id", "journal_date");

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "fk_guardians_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "fk_guardians_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_requests" ADD CONSTRAINT "fk_attachment_requests_requested_by" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_request_documents" ADD CONSTRAINT "fk_attachment_documents_uploaded_by" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parent_daily_acknowledgements" ADD CONSTRAINT "fk_parent_ack_year_class" FOREIGN KEY ("academic_year_class_id") REFERENCES "academic_year_classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
