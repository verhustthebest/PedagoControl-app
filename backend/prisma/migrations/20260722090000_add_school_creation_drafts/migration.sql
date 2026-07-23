UPDATE "geo_provinces" SET "name_key" = translate(lower(trim(regexp_replace("name", '\s+', ' ', 'g'))), 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy');
UPDATE "geo_cities" SET "name_key" = translate(lower(trim(regexp_replace("name", '\s+', ' ', 'g'))), 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy');
UPDATE "geo_communes" SET "name_key" = translate(lower(trim(regexp_replace("name", '\s+', ' ', 'g'))), 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy');
UPDATE "geo_neighborhoods" SET "name_key" = translate(lower(trim(regexp_replace("name", '\s+', ' ', 'g'))), 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy');

CREATE TABLE "school_creation_drafts" (
  "id" BIGSERIAL PRIMARY KEY,
  "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_by_user_id" BIGINT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "created_school_public_id" UUID,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "school_creation_drafts_public_id_key" UNIQUE ("public_id")
);
CREATE INDEX "school_creation_drafts_created_by_user_id_status_idx" ON "school_creation_drafts"("created_by_user_id", "status");
