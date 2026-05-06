// Singleton PrismaClient. Reusing the connection prevents the dreaded
// "too many connections" error in dev with hot-reload.

import { PrismaClient } from "@prisma/client";
import { env } from "../env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
