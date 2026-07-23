"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = __importDefault(require("../prisma/client"));
dotenv_1.default.config();
function assertLocalDevelopment() {
    if (process.env.NODE_ENV === 'production')
        throw new Error('Commande interdite en production.');
    if (process.env.CONFIRM_RESET_SCHOOL_DATA !== 'RESET_LOCAL_SCHOOLS')
        throw new Error('Confirmation explicite manquante.');
    const databaseUrl = new URL(process.env.DATABASE_URL || '');
    if (!['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname))
        throw new Error('La base PostgreSQL doit être locale.');
}
/**
 * Supprime uniquement les données rattachées à une école. Les tables système et
 * le référentiel géographique sont volontairement exclus de cette opération locale.
 */
async function main() {
    assertLocalDevelopment();
    await client_1.default.$executeRaw `
    DO $$
    DECLARE target RECORD; pass INTEGER;
    BEGIN
      -- Plusieurs passages rendent l'ordre des contraintes sans importance.
      FOR pass IN 1..5 LOOP
        FOR target IN
          SELECT table_name FROM information_schema.columns
          WHERE table_schema = 'public' AND column_name = 'school_id'
            AND table_name <> 'users'
            AND table_name NOT LIKE 'geo_%'
        LOOP
          BEGIN
            EXECUTE format('DELETE FROM %I', target.table_name);
          EXCEPTION WHEN foreign_key_violation THEN NULL;
          END;
        END LOOP;
      END LOOP;
      DELETE FROM users WHERE school_id IS NOT NULL;
      DELETE FROM schools;
    END $$;
  `;
    console.info('Réinitialisation locale des données écoles terminée.');
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Réinitialisation refusée.');
    process.exitCode = 1;
}).finally(() => client_1.default.$disconnect());
