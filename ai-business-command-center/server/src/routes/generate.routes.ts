// One generic route handles every skill. We accept the skill in the URL,
// validate it against the loadable prompt files, then run the shared
// generation service. This means adding a new generator = drop a .md file
// in /prompts/skills/ — zero code changes here.

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { generateLimiter } from "../middleware/rateLimit.js";
import { runGeneration } from "../services/generate.service.js";
import { listSkills } from "../lib/promptAssembler.js";
import { errors } from "../lib/errors.js";

const router = Router();
router.use(requireAuth);

const generateSchema = z.object({
  projectId: z.string().cuid().optional(),
  context: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

router.post("/:skill", generateLimiter, async (req, res, next) => {
  try {
    const skill = req.params.skill;
    if (!listSkills().includes(skill)) throw errors.badRequest(`Unknown skill: ${skill}`);

    const { projectId, context } = generateSchema.parse(req.body);
    const result = await runGeneration({
      userId: req.user!.id,
      skill,
      projectId,
      context,
    });
    res.json(result);
  } catch (e) { next(e); }
});

// GET /api/generate/skills — list every available skill
router.get("/", (_req, res) => {
  res.json({ skills: listSkills() });
});

export default router;
