"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.globalErrorHandler = globalErrorHandler;
const client_1 = require("@prisma/client");
const request_context_middleware_1 = require("./request-context.middleware");
const PUBLIC_MESSAGES = {
    400: 'Invalid request', 401: 'Authentication required', 403: 'Access forbidden',
    404: 'Resource not found', 409: 'Request conflict', 413: 'Request body too large',
    429: 'Too many requests. Please try again later.', 500: 'Internal server error',
};
function notFound(request, response) {
    return response.status(404).json({ message: PUBLIC_MESSAGES[404], request_id: request.requestId });
}
function globalErrorHandler(error, request, response, _next) {
    const candidate = error;
    let status = candidate?.type === 'entity.too.large' || candidate?.status === 413 ? 413 : candidate?.statusCode ?? candidate?.status ?? 500;
    if (![400, 401, 403, 404, 409, 413, 429].includes(status))
        status = 500;
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError || error instanceof client_1.Prisma.PrismaClientUnknownRequestError)
        status = 500;
    const action = candidate?.statusCode === 403 ? 'cors_origin_refused' : 'unhandled_error';
    response.locals.security_action = action;
    (0, request_context_middleware_1.securityLog)(request, action, 'error', { error_type: error instanceof Error ? error.name : 'UnknownError' });
    return response.status(status).json({ message: PUBLIC_MESSAGES[status] ?? PUBLIC_MESSAGES[500] });
}
