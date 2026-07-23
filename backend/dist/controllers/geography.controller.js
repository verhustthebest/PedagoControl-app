"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provinces = provinces;
exports.cities = cities;
exports.communes = communes;
exports.neighborhoods = neighborhoods;
exports.addCity = addCity;
exports.addCommune = addCommune;
exports.addNeighborhood = addNeighborhood;
const geography_service_1 = require("../services/geography.service");
async function provinces(_request, response) { return response.json({ items: await (0, geography_service_1.listProvinces)() }); }
async function cities(request, response) { return response.json({ items: await (0, geography_service_1.listCities)(request.params.parentId) }); }
async function communes(request, response) { return response.json({ items: await (0, geography_service_1.listCommunes)(request.params.parentId) }); }
async function neighborhoods(request, response) { return response.json({ items: await (0, geography_service_1.listNeighborhoods)(request.params.parentId) }); }
async function created(response, operation) {
    const item = await operation;
    return item ? response.status(201).json({ item }) : response.status(404).json({ message: 'Resource not found' });
}
async function addCity(request, response) { return created(response, (0, geography_service_1.createCity)(request.params.parentId, request.body.name)); }
async function addCommune(request, response) { return created(response, (0, geography_service_1.createCommune)(request.params.parentId, request.body.name)); }
async function addNeighborhood(request, response) { return created(response, (0, geography_service_1.createNeighborhood)(request.params.parentId, request.body.name)); }
