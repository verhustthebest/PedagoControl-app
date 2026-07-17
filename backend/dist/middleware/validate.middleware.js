"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(schemas) {
    return (request, response, next) => {
        for (const location of ['params', 'query', 'body']) {
            const schema = schemas[location];
            if (!schema)
                continue;
            const result = schema.safeParse(request[location]);
            if (!result.success) {
                return response.status(400).json({
                    message: 'Invalid request',
                    errors: result.error.issues.map(issue => ({ location, field: issue.path.join('.'), code: issue.code })),
                });
            }
            if (location !== 'query')
                request[location] = result.data;
        }
        return next();
    };
}
