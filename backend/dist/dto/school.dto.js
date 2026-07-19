"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolDto = schoolDto;
/** DTO public strict : aucune clé technique interne ne traverse la frontière HTTP. */
function schoolDto(school) {
    return {
        public_id: school.public_id,
        code: school.code,
        name: school.name,
        promoter_name: school.promoter_name,
        phone: school.phone,
        status: school.status,
        created_at: school.created_at,
    };
}
