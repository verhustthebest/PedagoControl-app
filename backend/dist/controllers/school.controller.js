"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchools = getSchools;
const client_1 = __importDefault(require("../prisma/client"));
function serializeBigInt(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
async function getSchools(_request, response) {
    try {
        const schools = await client_1.default.schools.findMany({
            orderBy: { created_at: 'desc' },
        });
        return response.json(serializeBigInt(schools));
    }
    catch (error) {
        console.error('Unable to fetch schools', error);
        return response.status(500).json({ message: 'Unable to fetch schools' });
    }
}
