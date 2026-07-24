"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceDescription = exports.optionsForLevel = exports.RDC_HUMANITIES_OPTIONS = exports.RDC_LEVELS = void 0;
exports.referencedLevels = referencedLevels;
/**
 * Référentiel embarqué d'après les publications MINEDU-NC.
 * Sources : https://edu-nc.gouv.cd/systeme-educatif
 * et https://edu-nc.gouv.cd/programmes-nationaux
 */
exports.RDC_LEVELS = [
    'Maternelle',
    '1re Primaire', '2e Primaire', '3e Primaire', '4e Primaire', '5e Primaire', '6e Primaire',
    '7e CTEB', '8e CTEB',
    '1re Humanités', '2e Humanités', '3e Humanités', '4e Humanités',
    '1re Professionnel — cycle court (3 ans)', '2e Professionnel — cycle court (3 ans)', '3e Professionnel — cycle court (3 ans)',
    '1re Professionnel — cycle long (4 ans)', '2e Professionnel — cycle long (4 ans)', '3e Professionnel — cycle long (4 ans)', '4e Professionnel — cycle long (4 ans)',
];
// Liste volontairement conservatrice : uniquement les options nommées par les documents officiels consultés.
exports.RDC_HUMANITIES_OPTIONS = [
    'Pédagogie générale', 'Normale', 'Éducation physique',
    'Latin-philosophie', 'Latin-grec', 'Mathématique-physique', 'Chimie-biologie',
    'Commerciale et gestion', 'Secrétariat-administration', 'Électricité', 'Électronique',
    'Pétrochimie', 'Coupe-couture', 'Informatique',
];
const optionsForLevel = (level) => level.includes('Humanités') || level.includes('Professionnel') ? [...exports.RDC_HUMANITIES_OPTIONS] : [];
exports.optionsForLevel = optionsForLevel;
const referenceDescription = (levels, official = true) => JSON.stringify({ source: official ? 'MINEDU-NC' : 'ECOLE', levels });
exports.referenceDescription = referenceDescription;
function referencedLevels(description) { try {
    const value = JSON.parse(description || '');
    return Array.isArray(value.levels) ? value.levels.filter((item) => typeof item === 'string') : [];
}
catch {
    return [];
} }
