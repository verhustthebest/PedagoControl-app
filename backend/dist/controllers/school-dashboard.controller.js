"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolDashboard = schoolDashboard;
const school_dashboard_service_1 = require("../services/school-dashboard.service");
/** Retourne le tableau de bord de l'école après résolution sécurisée du public_id. */
async function schoolDashboard(request, response) {
    try {
        const dashboard = await (0, school_dashboard_service_1.getSchoolDashboard)(BigInt(request.params.schoolId));
        if (!dashboard)
            return response.status(404).json({ message: 'Resource not found' });
        return response.json({ dashboard });
    }
    catch {
        return response.status(500).json({ message: 'Unable to fetch school dashboard' });
    }
}
