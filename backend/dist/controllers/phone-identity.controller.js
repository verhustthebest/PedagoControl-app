"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhone = checkPhone;
const phone_identity_1 = require("../security/phone-identity");
async function checkPhone(request, response) { const result = await (0, phone_identity_1.checkPhoneIdentity)({ ...request.body, schoolId: request.user?.school_id ? BigInt(request.user.school_id) : null }); return response.json(result); }
