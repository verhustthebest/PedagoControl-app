"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherReports = teacherReports;
exports.teacherReportsToday = teacherReportsToday;
exports.submitTeacherReport = submitTeacherReport;
exports.prefetReportsPending = prefetReportsPending;
exports.decidePrefetReport = decidePrefetReport;
exports.supervisionReports = supervisionReports;
const lesson_report_service_1 = require("../services/lesson-report.service");
function requireUser(request, response) {
    if (!request.user) {
        response.status(401).json({ message: 'Authentication required' });
        return null;
    }
    return request.user;
}
async function teacherReports(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const reports = await (0, lesson_report_service_1.getTeacherReports)(user);
        return response.json({ reports });
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch teacher reports' });
    }
}
async function teacherReportsToday(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const reports = await (0, lesson_report_service_1.getTeacherReportsToday)(user);
        return response.json({ reports });
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch teacher reports today' });
    }
}
async function submitTeacherReport(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const report = await (0, lesson_report_service_1.createTeacherReport)(user, request.body);
        return response.status(201).json({ report });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to submit teacher report';
        const status = message.includes('required') || message.includes('not found') ? 400 : 500;
        return response.status(status).json({ message });
    }
}
async function prefetReportsPending(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const reports = await (0, lesson_report_service_1.getPendingReports)(user);
        return response.json({ reports });
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch pending reports' });
    }
}
async function decidePrefetReport(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const reportId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
        if (!reportId) {
            return response.status(400).json({ message: 'Report id is required' });
        }
        const report = await (0, lesson_report_service_1.decideReport)(user, reportId, request.body);
        return response.json({ report });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to decide report';
        const status = message.includes('decision must') ? 400 : message.includes('not found') ? 404 : 500;
        return response.status(status).json({ message });
    }
}
async function supervisionReports(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const supervision = await (0, lesson_report_service_1.getSupervisionReports)(user);
        return response.json(supervision);
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch supervision reports' });
    }
}
