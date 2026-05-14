import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";
import {
  assertOwnsOutput,
  assertOwnsProduct,
  assertOwnsProject,
} from "../services/ownership.service.js";
import { boundedJsonRecord, cuidParam, safeText } from "../lib/securityText.js";

const router = Router();
router.use(requireAuth);

const outputTypeSchema = safeText(80, 1).refine((value) => /^[a-zA-Z0-9:_-]+$/.test(value), {
  message: "Output type contains invalid characters",
});

const createSchema = z.object({
  projectId: cuidParam.optional(),
  productId: cuidParam.optional(),
  type: outputTypeSchema,
  title: safeText(200, 1),
  content: safeText(100_000, 1),
  inputSnapshot: boundedJsonRecord(80, 50_000),
});

const querySchema = z.object({
  projectId: cuidParam.optional(),
  type: safeText(80).optional(),
  search: safeText(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get("/", async (req, res, next) => {
export default router;
