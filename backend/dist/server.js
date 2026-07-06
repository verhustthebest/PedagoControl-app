"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const client_1 = __importDefault(require("./prisma/client"));
const port = Number(process.env.PORT) || 4000;
const server = app_1.default.listen(port, () => {
    console.log(`PEDAGO CONTROL API running on port ${port}`);
});
function shutdown() {
    server.close(async () => {
        await client_1.default.$disconnect();
        process.exit(0);
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
