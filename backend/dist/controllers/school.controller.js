"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchools = getSchools;
exports.getSchool = getSchool;
const school_dto_1 = require("../dto/school.dto");
const access_policy_1 = require("../security/access-policy");
const school_service_1 = require("../services/school.service");
function query(value) { return typeof value === 'string' ? value : undefined; }
async function getSchools(request, response) { if (!request.user)
    return response.status(401).json({ message: 'Authentication required' }); const page = Number(query(request.query.page) || 1), limit = Number(query(request.query.limit) || 20); try {
    const result = await (0, school_service_1.listSchools)({ page, limit, search: query(request.query.search), status: query(request.query.status), schoolId: (0, access_policy_1.isSuperAdmin)(request.user) ? undefined : BigInt(request.user.school_id) });
    return response.json({ schools: result.schools.map(school_dto_1.schoolDto), pagination: { page, limit, total: result.total, total_pages: Math.ceil(result.total / limit) } });
}
catch {
    return response.status(500).json({ message: 'Unable to fetch schools' });
} }
async function getSchool(request, response) { try {
    const school = await (0, school_service_1.findSchoolByInternalScope)(BigInt(request.params.schoolId));
    if (!school)
        return response.status(404).json({ message: 'Resource not found' });
    return response.json({ school: (0, school_dto_1.schoolDto)(school) });
}
catch {
    return response.status(500).json({ message: 'Unable to fetch school' });
} }
