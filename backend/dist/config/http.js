"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontendOrigins = frontendOrigins;
exports.corsOptions = corsOptions;
exports.shouldForceHttps = shouldForceHttps;
exports.httpsBoundary = httpsBoundary;
exports.sensitiveNoStore = sensitiveNoStore;
exports.configureHttpBoundary = configureHttpBoundary;
exports.httpErrorHandler = httpErrorHandler;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const BASE_HEADERS = ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'];
function frontendOrigins(environment = process.env.NODE_ENV, configured = process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL) {
    const origins = new Set((configured ?? '').split(',').map(value => value.trim()).filter(Boolean));
    if (environment !== 'production') {
        origins.add('http://localhost:5173');
        origins.add('http://127.0.0.1:5173');
    }
    return origins;
}
function corsOptions(environment = process.env.NODE_ENV, configured = process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL, csrfHeader = process.env.CSRF_HEADER_NAME || 'X-CSRF-Token') {
    const allowed = frontendOrigins(environment, configured);
    // Le nom configuré doit être identique à celui contrôlé par les routes refresh/logout.
    const allowedHeaders = [...BASE_HEADERS, csrfHeader];
    return {
        credentials: true,
        methods: METHODS,
        allowedHeaders,
        optionsSuccessStatus: 204,
        maxAge: 600,
        origin(origin, callback) {
            if (!origin || allowed.has(origin))
                return callback(null, true);
            return callback(Object.assign(new Error('Origin not allowed'), { statusCode: 403 }));
        },
    };
}
function positiveInteger(value, fallback) {
    if (!value)
        return fallback;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
function shouldForceHttps(environment = process.env.NODE_ENV, configured = process.env.FORCE_HTTPS) {
    return environment === 'production' && configured !== 'false';
}
function httpsBoundary(request, response, next) {
    if (!shouldForceHttps() || request.secure)
        return next();
    return response.redirect(308, `https://${request.get('host')}${request.originalUrl}`);
}
function sensitiveNoStore(request, response, next) {
    if (/^\/api\/(?:auth(?:\/|$)|parental\/auth(?:\/|$))/.test(request.path)) {
        response.setHeader('Cache-Control', 'no-store');
    }
    next();
}
function configureHttpBoundary(app) {
    app.disable('x-powered-by');
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: { directives: {
                defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"],
            } },
        hsts: false,
        referrerPolicy: { policy: 'no-referrer' },
        frameguard: { action: 'deny' },
    }));
    app.use((_request, response, next) => {
        response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        next();
    });
    app.use(httpsBoundary);
    app.use((request, response, next) => {
        if (process.env.NODE_ENV === 'production' && request.secure) {
            response.setHeader('Strict-Transport-Security', `max-age=${positiveInteger(process.env.HSTS_MAX_AGE, 31536000)}; includeSubDomains`);
        }
        next();
    });
    app.use((0, cors_1.default)(corsOptions()));
    app.options(/.*/, (0, cors_1.default)(corsOptions()));
    app.use(sensitiveNoStore);
    app.use((request, response, next) => {
        if (['POST', 'PUT', 'PATCH'].includes(request.method) && Number(request.get('content-length') ?? 0) > 0 && !request.is('application/json')) {
            return response.status(415).json({ message: 'Unsupported media type' });
        }
        next();
    });
    app.use(express_1.default.json({ limit: process.env.JSON_BODY_LIMIT ?? '256kb', type: 'application/json' }));
}
function httpErrorHandler(error, _request, response, next) {
    const candidate = error;
    if (candidate?.type === 'entity.too.large' || candidate?.status === 413) {
        return response.status(413).json({ message: 'Request body too large' });
    }
    if (candidate?.statusCode === 403)
        return response.status(403).json({ message: 'Origin not allowed' });
    return next(error);
}
