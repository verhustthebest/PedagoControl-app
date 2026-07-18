"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchools = getSchools;
const client_1 = __importDefault(require("../prisma/client"));
const access_policy_1 = require("../security/access-policy");
function serializeBigInt(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function positiveInteger(value, fallback, maximum) {
    if (value === undefined)
        return fallback;
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0 || (maximum !== undefined && parsed > maximum))
        return null;
    return parsed;
}
async function getSchools(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    const page = positiveInteger(request.query.page, 1);
    const limit = positiveInteger(request.query.limit, 20, 100);
    if (!page || !limit)
        return response.status(400).json({ message: 'Invalid pagination' });
    try {
        const where = (0, access_policy_1.isSuperAdmin)(request.user)
            ? {}
            : { id: BigInt(request.user.school_id) };
        const [schools, total] = await client_1.default.$transaction([
            client_1.default.schools.findMany({
                where,
                select: {
                    id: true,
                    code: true,
                    name: true,
                    promoter_name: true,
                    phone: true,
                    status: true,
                    created_at: true,
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            client_1.default.schools.count({ where }),
        ]);
        return response.json(serializeBigInt({
            schools,
            pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
        }));
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch schools' });
    }
}
