"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexStudents = indexStudents;
exports.createStudentHandler = createStudentHandler;
exports.showStudent = showStudent;
exports.updateStudentHandler = updateStudentHandler;
exports.updateStudentTracking = updateStudentTracking;
const parental_student_service_1 = require("../services/parental-student.service");
const parental_service_1 = require("../services/parental.service");
function parameter(request, name) {
    const value = request.params[name];
    return Array.isArray(value) ? value[0] : value;
}
function queryValue(value) {
    return typeof value === 'string' ? value : undefined;
}
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function presentStudent(value) {
    const student = serialize(value);
    const enrollments = student.student_enrollments;
    student.enrollment = enrollments?.[0] ?? null;
    delete student.student_enrollments;
    const enrollment = student.enrollment;
    if (enrollment) {
        enrollment.tracking_status = (0, parental_student_service_1.enrollmentTrackingStatus)(enrollment);
    }
    return student;
}
function handleError(response, error, fallback) {
    if (error instanceof parental_service_1.ParentalApiError) {
        return response.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof SyntaxError) {
        return response.status(400).json({ message: 'Invalid request payload' });
    }
    return response.status(500).json({ message: fallback });
}
async function indexStudents(request, response) {
    try {
        const result = await (0, parental_student_service_1.listStudents)(parameter(request, 'schoolId'), {
            search: queryValue(request.query.search),
            academic_year_class_id: queryValue(request.query.academic_year_class_id ?? request.query.class_id),
            status: queryValue(request.query.status),
            parental_tracking_enabled: queryValue(request.query.parental_tracking_enabled ?? request.query.tracking),
            page: queryValue(request.query.page),
            limit: queryValue(request.query.limit),
        });
        return response.json({
            students: result.students.map(presentStudent),
            pagination: result.pagination,
        });
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch students');
    }
}
async function createStudentHandler(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const student = await (0, parental_student_service_1.createStudent)(parameter(request, 'schoolId'), request.user.id, request.body);
        return response.status(201).json({ student: presentStudent(student) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to create student');
    }
}
async function showStudent(request, response) {
    try {
        const student = await (0, parental_student_service_1.getStudent)(parameter(request, 'schoolId'), parameter(request, 'studentId'));
        return response.json({ student: presentStudent(student) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch student');
    }
}
async function updateStudentHandler(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const student = await (0, parental_student_service_1.updateStudent)(parameter(request, 'schoolId'), parameter(request, 'studentId'), request.user.id, request.body);
        return response.json({ student: presentStudent(student) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to update student');
    }
}
async function updateStudentTracking(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const student = await (0, parental_student_service_1.setStudentTracking)(parameter(request, 'schoolId'), parameter(request, 'studentId'), request.user.id, request.body?.enabled);
        return response.json({ student: presentStudent(student) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to update parental tracking');
    }
}
