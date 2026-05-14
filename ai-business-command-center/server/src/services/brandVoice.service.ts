import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";

export async function getOwnedBrandProfile(userId: string, profileId: string) {
  const profile = await prisma.brandVoiceProfile.findFirst({
    where: { id: profileId, userId },
  });

  if (!profile) throw errors.notFound("Brand Voice Profile not found");
  return profile;
}

export async function listOwnedBrandProfiles(userId: string) {
  return prisma.brandVoiceProfile.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}
