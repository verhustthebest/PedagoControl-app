ALTER TABLE "schools"
  ADD COLUMN "school_type" VARCHAR(50),
  ADD COLUMN "province_id" BIGINT,
  ADD COLUMN "city_id" BIGINT,
  ADD COLUMN "commune_id" BIGINT,
  ADD COLUMN "neighborhood_id" BIGINT,
  ADD COLUMN "geographic_reference" TEXT;

CREATE TABLE "geo_provinces" (
  "id" BIGSERIAL PRIMARY KEY,
  "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "name_key" VARCHAR(120) NOT NULL,
  CONSTRAINT "geo_provinces_public_id_key" UNIQUE ("public_id"),
  CONSTRAINT "geo_provinces_name_key_key" UNIQUE ("name_key")
);
CREATE TABLE "geo_cities" (
  "id" BIGSERIAL PRIMARY KEY,
  "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "province_id" BIGINT NOT NULL REFERENCES "geo_provinces"("id") ON DELETE CASCADE,
  "name" VARCHAR(120) NOT NULL,
  "name_key" VARCHAR(120) NOT NULL,
  CONSTRAINT "geo_cities_public_id_key" UNIQUE ("public_id"),
  CONSTRAINT "geo_cities_parent_name_key" UNIQUE ("province_id", "name_key")
);
CREATE TABLE "geo_communes" (
  "id" BIGSERIAL PRIMARY KEY,
  "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "city_id" BIGINT NOT NULL REFERENCES "geo_cities"("id") ON DELETE CASCADE,
  "name" VARCHAR(120) NOT NULL,
  "name_key" VARCHAR(120) NOT NULL,
  CONSTRAINT "geo_communes_public_id_key" UNIQUE ("public_id"),
  CONSTRAINT "geo_communes_parent_name_key" UNIQUE ("city_id", "name_key")
);
CREATE TABLE "geo_neighborhoods" (
  "id" BIGSERIAL PRIMARY KEY,
  "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "commune_id" BIGINT NOT NULL REFERENCES "geo_communes"("id") ON DELETE CASCADE,
  "name" VARCHAR(120) NOT NULL,
  "name_key" VARCHAR(120) NOT NULL,
  CONSTRAINT "geo_neighborhoods_public_id_key" UNIQUE ("public_id"),
  CONSTRAINT "geo_neighborhoods_parent_name_key" UNIQUE ("commune_id", "name_key")
);
CREATE INDEX "geo_cities_province_id_idx" ON "geo_cities"("province_id");
CREATE INDEX "geo_communes_city_id_idx" ON "geo_communes"("city_id");
CREATE INDEX "geo_neighborhoods_commune_id_idx" ON "geo_neighborhoods"("commune_id");
CREATE INDEX "schools_province_id_idx" ON "schools"("province_id");
CREATE INDEX "schools_city_id_idx" ON "schools"("city_id");
CREATE INDEX "schools_commune_id_idx" ON "schools"("commune_id");
CREATE INDEX "schools_neighborhood_id_idx" ON "schools"("neighborhood_id");
ALTER TABLE "schools" ADD CONSTRAINT "schools_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "geo_provinces"("id") ON DELETE SET NULL;
ALTER TABLE "schools" ADD CONSTRAINT "schools_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "geo_cities"("id") ON DELETE SET NULL;
ALTER TABLE "schools" ADD CONSTRAINT "schools_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "geo_communes"("id") ON DELETE SET NULL;
ALTER TABLE "schools" ADD CONSTRAINT "schools_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "geo_neighborhoods"("id") ON DELETE SET NULL;

INSERT INTO "geo_provinces" ("name", "name_key") VALUES
('Bas-Uele','bas-uele'),('Équateur','équateur'),('Haut-Katanga','haut-katanga'),('Haut-Lomami','haut-lomami'),
('Haut-Uele','haut-uele'),('Ituri','ituri'),('Kasaï','kasaï'),('Kasaï-Central','kasaï-central'),
('Kasaï-Oriental','kasaï-oriental'),('Kinshasa','kinshasa'),('Kongo-Central','kongo-central'),('Kwango','kwango'),
('Kwilu','kwilu'),('Lomami','lomami'),('Lualaba','lualaba'),('Mai-Ndombe','mai-ndombe'),
('Maniema','maniema'),('Mongala','mongala'),('Nord-Kivu','nord-kivu'),('Nord-Ubangi','nord-ubangi'),
('Sankuru','sankuru'),('Sud-Kivu','sud-kivu'),('Sud-Ubangi','sud-ubangi'),('Tanganyika','tanganyika'),
('Tshopo','tshopo'),('Tshuapa','tshuapa');
