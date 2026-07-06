"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/health', (_request, response) => {
    response.json({ status: 'ok', app: 'PEDAGO CONTROL API' });
});
exports.default = router;
