"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNeighborhoods = exports.listCommunes = exports.listCities = exports.listProvinces = void 0;
exports.geographyNameKey = geographyNameKey;
exports.createCity = createCity;
exports.createCommune = createCommune;
exports.createNeighborhood = createNeighborhood;
const client_1 = __importDefault(require("../prisma/client"));
/** Produit une clé stable afin d'empêcher les doublons de casse et d'espacement. */
function geographyNameKey(name) {
    return name.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
}
const select = { public_id: true, name: true };
const listProvinces = () => client_1.default.geo_provinces.findMany({ select, orderBy: { name: 'asc' } });
exports.listProvinces = listProvinces;
const listCities = (provincePublicId) => client_1.default.geo_cities.findMany({
    where: { province: { public_id: provincePublicId } }, select, orderBy: { name: 'asc' },
});
exports.listCities = listCities;
const listCommunes = (cityPublicId) => client_1.default.geo_communes.findMany({
    where: { city: { public_id: cityPublicId } }, select, orderBy: { name: 'asc' },
});
exports.listCommunes = listCommunes;
const listNeighborhoods = (communePublicId) => client_1.default.geo_neighborhoods.findMany({
    where: { commune: { public_id: communePublicId } }, select, orderBy: { name: 'asc' },
});
exports.listNeighborhoods = listNeighborhoods;
/** Création idempotente sous le parent public : la contrainte composée arbitre les accès concurrents. */
async function createCity(provincePublicId, name) {
    const province = await client_1.default.geo_provinces.findUnique({ where: { public_id: provincePublicId }, select: { id: true } });
    if (!province)
        return null;
    const nameKey = geographyNameKey(name);
    return client_1.default.geo_cities.upsert({
        where: { province_id_name_key: { province_id: province.id, name_key: nameKey } },
        update: {}, create: { province_id: province.id, name: name.trim().replace(/\s+/g, ' '), name_key: nameKey }, select,
    });
}
async function createCommune(cityPublicId, name) {
    const city = await client_1.default.geo_cities.findUnique({ where: { public_id: cityPublicId }, select: { id: true } });
    if (!city)
        return null;
    const nameKey = geographyNameKey(name);
    return client_1.default.geo_communes.upsert({
        where: { city_id_name_key: { city_id: city.id, name_key: nameKey } },
        update: {}, create: { city_id: city.id, name: name.trim().replace(/\s+/g, ' '), name_key: nameKey }, select,
    });
}
async function createNeighborhood(communePublicId, name) {
    const commune = await client_1.default.geo_communes.findUnique({ where: { public_id: communePublicId }, select: { id: true } });
    if (!commune)
        return null;
    const nameKey = geographyNameKey(name);
    return client_1.default.geo_neighborhoods.upsert({
        where: { commune_id_name_key: { commune_id: commune.id, name_key: nameKey } },
        update: {}, create: { commune_id: commune.id, name: name.trim().replace(/\s+/g, ' '), name_key: nameKey }, select,
    });
}
