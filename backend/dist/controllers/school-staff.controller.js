"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaff = createStaff;
const school_staff_service_1 = require("../services/school-staff.service");
const phone_identity_1 = require("../security/phone-identity");
async function createStaff(request, response) {
    try {
        const staff = await (0, school_staff_service_1.createSchoolStaff)(BigInt(request.params.schoolId), request.body);
        return response.status(201).json({ staff });
    }
    catch (error) {
        if (error instanceof school_staff_service_1.SchoolStaffError)
            return response.status(error.status).json({ message: error.message });
        if (error instanceof phone_identity_1.PhoneIdentityError)
            return response.status(error.status).json({ message: error.message });
        return response.status(400).json({ message: 'Impossible de créer ce compte.' });
    }
}
