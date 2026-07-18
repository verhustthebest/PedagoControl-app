"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePublicResource = resolvePublicResource;
exports.resolveOwnChild = resolveOwnChild;
const client_1 = __importDefault(require("../prisma/client"));
const public_id_1 = require("../security/public-id");
function resolvePublicResource(resource, parameterName) {
    return async (request, response, next) => {
        const raw = request.params[parameterName];
        const value = Array.isArray(raw) ? raw[0] : raw;
        if (!value || !(0, public_id_1.isPublicId)(value))
            return next();
        const schoolValue = request.params.schoolId;
        if (!schoolValue || Array.isArray(schoolValue) || !/^\d+$/.test(schoolValue)) {
            return response.status(404).json({ message: 'Resource not found' });
        }
        const schoolId = BigInt(schoolValue);
        const found = resource === 'student'
            ? await client_1.default.students.findFirst({ where: { public_id: value, school_id: schoolId }, select: { id: true } })
            : resource === 'guardian'
                ? await client_1.default.guardians.findFirst({ where: { public_id: value, school_id: schoolId }, select: { id: true } })
                : await client_1.default.school_invoices.findFirst({ where: { public_id: value, school_id: schoolId }, select: { id: true } });
        if (!found) {
            response.locals.security_action = 'opaque_resource_access_refused';
            return response.status(404).json({ message: 'Resource not found' });
        }
        request.params[parameterName] = found.id.toString();
        return next();
    };
}
function resolveOwnChild(parameterName = 'studentId') {
    return async (request, response, next) => {
        const raw = request.params[parameterName];
        const value = Array.isArray(raw) ? raw[0] : raw;
        if (!value || !(0, public_id_1.isPublicId)(value) || !request.user)
            return next();
        const student = await client_1.default.students.findFirst({ where: {
                public_id: value,
                student_guardians: { some: { status: 'active', guardians: { user_id: BigInt(request.user.id), status: 'active' } } },
            }, select: { id: true } });
        if (!student) {
            response.locals.security_action = 'parent_child_ownership_refused';
            return response.status(404).json({ message: 'Resource not found' });
        }
        request.params[parameterName] = student.id.toString();
        return next();
    };
}
