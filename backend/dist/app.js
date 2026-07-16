"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const lesson_report_routes_1 = __importDefault(require("./routes/lesson-report.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const parental_routes_1 = __importDefault(require("./routes/parental.routes"));
const parental_guardian_routes_1 = __importDefault(require("./routes/parental-guardian.routes"));
const parent_registration_routes_1 = __importDefault(require("./routes/parent-registration.routes"));
const parent_portal_routes_1 = __importDefault(require("./routes/parent-portal.routes"));
const parental_billing_routes_1 = __importDefault(require("./routes/parental-billing.routes"));
const parental_student_routes_1 = __importDefault(require("./routes/parental-student.routes"));
const school_routes_1 = __importDefault(require("./routes/school.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = new Set([
    'http://localhost:5173',
    'https://pedago-control-app.vercel.app',
    process.env.FRONTEND_URL,
].filter(Boolean));
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
}));
app.use(express_1.default.json());
app.use('/api', auth_routes_1.default);
app.use('/api', health_routes_1.default);
app.use('/api', lesson_report_routes_1.default);
app.use('/api', notification_routes_1.default);
app.use('/api', parental_routes_1.default);
app.use('/api', parent_registration_routes_1.default);
app.use('/api', parent_portal_routes_1.default);
app.use('/api', parental_billing_routes_1.default);
app.use('/api', parental_guardian_routes_1.default);
app.use('/api', parental_student_routes_1.default);
app.use('/api', school_routes_1.default);
exports.default = app;
