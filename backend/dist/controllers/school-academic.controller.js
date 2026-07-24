"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubject = exports.editSubject = exports.addSubject = exports.subjects = exports.deleteClass = exports.editClass = exports.addClass = exports.catalog = void 0;
const school_academic_service_1 = require("../services/school-academic.service");
const sid = (r) => BigInt(r.params.schoolId);
const fail = (res, e) => e instanceof school_academic_service_1.SchoolAcademicError ? res.status(e.status).json({ message: e.message }) : res.status(400).json({ message: 'Requête impossible.' });
const catalog = async (_r, res) => res.json(await (0, school_academic_service_1.listCatalog)());
exports.catalog = catalog;
const addClass = async (r, res) => { try {
    return res.status(201).json({ class: await (0, school_academic_service_1.createClass)(sid(r), r.body) });
}
catch (e) {
    return fail(res, e);
} };
exports.addClass = addClass;
const editClass = async (r, res) => { try {
    return res.json({ class: await (0, school_academic_service_1.updateClass)(sid(r), r.params.classId, r.body) });
}
catch (e) {
    return fail(res, e);
} };
exports.editClass = editClass;
const deleteClass = async (r, res) => { try {
    await (0, school_academic_service_1.deactivateClass)(sid(r), r.params.classId);
    return res.status(204).end();
}
catch (e) {
    return fail(res, e);
} };
exports.deleteClass = deleteClass;
const subjects = async (r, res) => res.json({ subjects: await (0, school_academic_service_1.listSubjects)(sid(r)) });
exports.subjects = subjects;
const addSubject = async (r, res) => { try {
    return res.status(201).json({ subject: await (0, school_academic_service_1.saveSubject)(sid(r), r.body) });
}
catch (e) {
    return fail(res, e);
} };
exports.addSubject = addSubject;
const editSubject = async (r, res) => { try {
    return res.json({ subject: await (0, school_academic_service_1.saveSubject)(sid(r), r.body, r.params.subjectId) });
}
catch (e) {
    return fail(res, e);
} };
exports.editSubject = editSubject;
const deleteSubject = async (r, res) => { try {
    await (0, school_academic_service_1.removeSubject)(sid(r), r.params.subjectId);
    return res.status(204).end();
}
catch (e) {
    return fail(res, e);
} };
exports.deleteSubject = deleteSubject;
