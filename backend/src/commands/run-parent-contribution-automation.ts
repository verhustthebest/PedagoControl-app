import prisma from '../prisma/client'
import { runParentContributionAutomation } from '../services/parent-contribution-automation.service'

/** Point d'entrée sans interaction, compatible avec Heroku Scheduler. */
async function main() { await runParentContributionAutomation() }

main().catch((error: unknown) => {
  console.error(JSON.stringify({ event: 'parent_contribution_automation', outcome: 'error', occurred_at: new Date().toISOString(), error: error instanceof Error ? error.name : 'UnknownError' }))
  process.exitCode = 1
}).finally(async () => prisma.$disconnect())
