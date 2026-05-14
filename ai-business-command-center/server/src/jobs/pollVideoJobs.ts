import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { pollDueVideoJobs } from "../services/videoStudio.service.js";

async function main() {
  logger.info("Video poller sweep started");

  try {
    const result = await pollDueVideoJobs();
    logger.info({ result }, "Video poller sweep finished");
  } catch (err) {
    logger.error({ err }, "Video poller sweep failed");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
