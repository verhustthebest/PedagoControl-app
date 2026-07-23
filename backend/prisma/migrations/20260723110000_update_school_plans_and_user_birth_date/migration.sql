ALTER TABLE "subscriptions" ADD COLUMN "trial_days" INTEGER, ADD COLUMN "billing_periods" TEXT[] NOT NULL DEFAULT ARRAY['monthly']::TEXT[];
ALTER TABLE "users" ADD COLUMN "birth_date" DATE;
ALTER TABLE "users" ADD COLUMN "public_id" UUID NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");

UPDATE "subscriptions" SET "is_active" = false WHERE "code" NOT IN ('LOCAL_TEST','BASIC','GOLD','EXTRA','PROFESSIONAL');
INSERT INTO "subscriptions" ("code","name","description","min_teachers","max_teachers","monthly_price","annual_price","trial_days","billing_periods","is_active") VALUES
('LOCAL_TEST','Plan local de test','Essai local de sept jours avec quota défini par Management.',1,NULL,0,NULL,7,ARRAY['monthly'],true),
('BASIC','Basic','De 1 à 10 enseignants.',1,10,80,960,NULL,ARRAY['monthly','quarterly','annual'],true),
('GOLD','Gold','De 11 à 16 enseignants.',11,16,100,1200,NULL,ARRAY['monthly','quarterly','annual'],true),
('EXTRA','Extra','De 17 à 24 enseignants.',17,24,135,1620,NULL,ARRAY['monthly','quarterly','annual'],true),
('PROFESSIONAL','Professionnel','À partir de 25 enseignants.',25,NULL,160,1920,NULL,ARRAY['monthly','quarterly','annual'],true)
ON CONFLICT ("code") DO UPDATE SET "name"=EXCLUDED."name","description"=EXCLUDED."description","min_teachers"=EXCLUDED."min_teachers","max_teachers"=EXCLUDED."max_teachers","monthly_price"=EXCLUDED."monthly_price","annual_price"=EXCLUDED."annual_price","trial_days"=EXCLUDED."trial_days","billing_periods"=EXCLUDED."billing_periods","is_active"=true;
