import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/requireAuth.js";
import { generateLimiter } from "../middleware/rateLimit.js";
import { runGeneration } from "../services/generate.service.js";
import { listSkills } from "../lib/promptAssembler.js";
import { errors } from "../lib/errors.js";
import {
  cuidParam,
  safeText,
} from "../lib/securityText.js";

const router = Router();

router.use(requireAuth);

const scalarContextValue = z.union([
  safeText(4000),
  z.number().finite(),
  z.boolean(),
]);

const contextSchema = z
  .record(scalarContextValue)
  .default({})
  .refine((value) => Object.keys(value).length <= 40, {
    message: "Too many context fields",
  })
  .refine(
    (value) =>
      Object.keys(value).every((key) =>
        /^[a-zA-Z0-9_:-]{1,64}$/.test(key),
      ),
    {
      message: "Context contains invalid field names",
    },
  );

const generateSchema = z.object({
  projectId: cuidParam.optional(),
  context: contextSchema,
});

router.post("/:skill", generateLimiter, async (req, res, next) => {
  try {
    const skill = safeText(120, 1).parse(req.params.skill);

    if (!listSkills().includes(skill)) {
      throw errors.badRequest("Unknown skill");
    }

    const { projectId, context } = generateSchema.parse(req.body);

    const result = await runGeneration({
      userId: req.user!.id,
      skill,
      projectId,
      context,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
