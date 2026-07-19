"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
const parent_contribution_automation_service_1 = require("../services/parent-contribution-automation.service");
/** Point d'entrée sans interaction, compatible avec Heroku Scheduler. */
async function main() { await (0, parent_contribution_automation_service_1.runParentContributionAutomation)(); }
main().catch((error) => {
    console.error(JSON.stringify({ event: 'parent_contribution_automation', outcome: 'error', occurred_at: new Date().toISOString(), error: error instanceof Error ? error.name : 'UnknownError' }));
    process.exitCode = 1;
}).finally(async () => client_1.default.$disconnect());
