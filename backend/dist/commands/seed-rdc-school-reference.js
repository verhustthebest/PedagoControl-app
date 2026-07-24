"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedRdcSchoolReference = seedRdcSchoolReference;
const client_1 = __importDefault(require("../prisma/client"));
const rdc_school_reference_1 = require("../services/rdc-school-reference");
/** Charge le référentiel en base sans service Internet au runtime. */
async function seedRdcSchoolReference() {
    await client_1.default.education_levels.updateMany({ where: { name: { in: ['1re Professionnel', '2e Professionnel', '3e Professionnel', '4e Professionnel'] } }, data: { is_active: false } });
    for (const [name, index] of rdc_school_reference_1.RDC_LEVELS.map((name, index) => [name, index + 1]))
        await client_1.default.education_levels.upsert({ where: { name }, update: { order_index: index, is_active: true }, create: { name, order_index: index } });
    for (const name of rdc_school_reference_1.RDC_HUMANITIES_OPTIONS) {
        const levels = rdc_school_reference_1.RDC_LEVELS.filter(level => (0, rdc_school_reference_1.optionsForLevel)(level).includes(name));
        await client_1.default.education_options.upsert({ where: { name }, update: { description: (0, rdc_school_reference_1.referenceDescription)(levels), is_active: true }, create: { name, description: (0, rdc_school_reference_1.referenceDescription)(levels) } });
    }
    return { levels: rdc_school_reference_1.RDC_LEVELS.length, options: rdc_school_reference_1.RDC_HUMANITIES_OPTIONS.length };
}
if (require.main === module)
    seedRdcSchoolReference().then(result => { console.log(`Référentiel RDC chargé : ${result.levels} niveaux, ${result.options} options.`); }).finally(() => client_1.default.$disconnect());
