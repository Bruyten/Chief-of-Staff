import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";
import {
  optionalSafeText,
  safeText,
} from "../lib/securityText.js";
import {
  getOwnedBrandProfile,
  listOwnedBrandProfiles,
} from "../services/brandVoice.service.js";

const router = Router();

router.use(requireAuth);

const brandProfileSchema = z.object({
  brandName: safeText(120, 1),
  businessType: optionalSafeText(200),
  targetAudience: optionalSafeText(1200),
  primaryOffer: optionalSafeText(1200),
  toneOfVoice: optionalSafeText(1200),
  valueProposition: optionalSafeText(1200),
  preferredCtas: optionalSafeText(1200),
  bannedPhrases: optionalSafeText(1200),
  differentiators: optionalSafeText(1200),
  notes: optionalSafeText(3000),
});

router.get("/", async (req, res, next) => {
  try {
    const profiles = await listOwnedBrandProfiles(req.user!.id);

    res.json({ profiles });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = brandProfileSchema.parse(req.body);

    const profile = await prisma.brandVoiceProfile.create({
      data: {
        userId: req.user!.id,
        brandName: data.brandName,
        businessType: data.businessType || null,
        targetAudience: data.targetAudience || null,
        primaryOffer: data.primaryOffer || null,
        toneOfVoice: data.toneOfVoice || null,
        valueProposition: data.valueProposition || null,
        preferredCtas: data.preferredCtas || null,
        bannedPhrases: data.bannedPhrases || null,
        differentiators: data.differentiators || null,
        notes: data.notes || null,
      },
    });

    res.status(201).json({ profile });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const profile = await getOwnedBrandProfile(
      req.user!.id,
      req.params.id,
    );

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = brandProfileSchema.partial().parse(req.body);

    if (Object.keys(data).length === 0) {
      throw errors.badRequest(
        "Provide at least one field to update",
      );
    }

    const existing = await getOwnedBrandProfile(
      req.user!.id,
      req.params.id,
    );

    const profile = await prisma.brandVoiceProfile.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.brandName !== undefined
          ? { brandName: data.brandName }
          : {}),
        ...(data.businessType !== undefined
          ? { businessType: data.businessType || null }
          : {}),
        ...(data.targetAudience !== undefined
          ? { targetAudience: data.targetAudience || null }
          : {}),
        ...(data.primaryOffer !== undefined
          ? { primaryOffer: data.primaryOffer || null }
          : {}),
        ...(data.toneOfVoice !== undefined
          ? { toneOfVoice: data.toneOfVoice || null }
          : {}),
        ...(data.valueProposition !== undefined
          ? { valueProposition: data.valueProposition || null }
          : {}),
        ...(data.preferredCtas !== undefined
          ? { preferredCtas: data.preferredCtas || null }
          : {}),
        ...(data.bannedPhrases !== undefined
          ? { bannedPhrases: data.bannedPhrases || null }
          : {}),
        ...(data.differentiators !== undefined
          ? { differentiators: data.differentiators || null }
          : {}),
        ...(data.notes !== undefined
          ? { notes: data.notes || null }
          : {}),
      },
    });

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getOwnedBrandProfile(
      req.user!.id,
      req.params.id,
    );

    await prisma.brandVoiceProfile.delete({
      where: {
        id: existing.id,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
