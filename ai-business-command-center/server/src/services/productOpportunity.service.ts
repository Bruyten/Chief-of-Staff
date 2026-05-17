import { prisma } from "../lib/prisma.js";

function clip(value: string | null | undefined, max: number) {
  const clean = (value ?? "").trim();

  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max).trim()}…`;
}

export async function enrichProductOpportunityContext(
  userId: string,
  context: Record<string, unknown>,
) {
  const items = await prisma.productLibraryItem.findMany({
    where: {
      userId,
      status: "active",
    },
    orderBy: [
      {
        promotionPriority: "asc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: 60,
  });

  const digest =
    items.length === 0
      ? "No active product library items exist yet."
      : items
          .map((item, index) =>
            [
              `Product ${index + 1}: ${item.name}`,
              `- Type: ${item.productType}`,
              `- Revenue lane: ${item.revenueLane || "not specified"}`,
              `- Description: ${clip(item.description, 420) || "not provided"}`,
              `- Audience: ${clip(item.targetAudience, 280) || "not provided"}`,
              `- Pain points: ${clip(item.painPoints, 360) || "not provided"}`,
              `- Benefits: ${clip(item.benefits, 360) || "not provided"}`,
              `- Keywords: ${clip(item.keywords, 240) || "not provided"}`,
              `- Tags: ${clip(item.tags, 200) || "not provided"}`,
              `- Offer: ${clip(item.offer, 280) || "not provided"}`,
              `- CTA: ${clip(item.cta, 180) || "not provided"}`,
              `- Price range: ${item.priceRange || "not provided"}`,
              `- Cover image available: ${item.coverImageUrl ? "yes" : "no"}`,
              `- Promotion priority: ${item.promotionPriority}`,
            ].join("\n"),
          )
          .join("\n\n");

  return {
    ...context,
    productLibraryItemCount: items.length,
    productLibraryDigest: digest,
  };
}
