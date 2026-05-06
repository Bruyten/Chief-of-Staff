// Seed a demo user + project + product so you can poke the API immediately.
// Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@chiefofstaff.app";
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Demo User",
      plan: "free",
      credits: 5,
      creditsMax: 5,
    },
  });

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Glow Skincare",
      niche: "Beauty / DTC",
      brandVoice: "Calm, no exclamations, peer-to-peer.",
      emoji: "🧴",
    },
  });

  await prisma.product.create({
    data: {
      projectId: project.id,
      name: "Glow Serum Bundle",
      description: "A 3-step skincare routine for oily, breakout-prone skin.",
      audience: "Women 22-35 with adult acne",
      painPoint: "Cystic breakouts that don't respond to drugstore products",
      price: "$48",
      offerType: "digital_product",
      cta: "Tap the link in my bio to grab the bundle.",
    },
  });

  // eslint-disable-next-line no-console
  console.log("✅ Seeded demo user:", email, "(password: demo1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
