import { Router } from "express";
    const profiles = await listOwnedBrandProfiles(req.user!.id);
    res.json({ profiles });
  } catch (e) {
    next(e);
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
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const profile = await getOwnedBrandProfile(req.user!.id, req.params.id);
    res.json({ profile });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = brandProfileSchema.partial().parse(req.body);
    if (Object.keys(data).length === 0) {
      throw errors.badRequest("Provide at least one field to update");
    }

    const existing = await getOwnedBrandProfile(req.user!.id, req.params.id);

    const profile = await prisma.brandVoiceProfile.update({
      where: { id: existing.id },
      data: {
        ...(data.brandName !== undefined ? { brandName: data.brandName } : {}),
        ...(data.businessType !== undefined ? { businessType: data.businessType || null } : {}),
        ...(data.targetAudience !== undefined ? { targetAudience: data.targetAudience || null } : {}),
        ...(data.primaryOffer !== undefined ? { primaryOffer: data.primaryOffer || null } : {}),
        ...(data.toneOfVoice !== undefined ? { toneOfVoice: data.toneOfVoice || null } : {}),
        ...(data.valueProposition !== undefined
          ? { valueProposition: data.valueProposition || null }
          : {}),
        ...(data.preferredCtas !== undefined ? { preferredCtas: data.preferredCtas || null } : {}),
        ...(data.bannedPhrases !== undefined ? { bannedPhrases: data.bannedPhrases || null } : {}),
        ...(data.differentiators !== undefined
          ? { differentiators: data.differentiators || null }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      },
    });

    res.json({ profile });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getOwnedBrandProfile(req.user!.id, req.params.id);
    await prisma.brandVoiceProfile.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
