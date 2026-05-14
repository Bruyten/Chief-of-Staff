import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { runDueAutomations } from "../services/automation.service.js";

async function main() {
  logger.info("Automation due-run sweep started");

  try {
    const result = await runDueAutomations(10);
    logger.info({ result }, "Automation due-run sweep finished");
  } catch (err) {
    logger.error({ err }, "Automation due-run sweep failed");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
