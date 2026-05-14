import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { constructWebhookEvent, isFakeStripe } from "../lib/stripeClient.js";
import { applySubscriptionChange, downgradeToFree } from "../services/billing.service.js";

const router = Router();

router.post("/stripe", async (req: Request, res: Response) => {
  if (isFakeStripe()) {
    return res.status(200).json({ ok: true, fake: true });
  }

  const signature = req.headers["stripe-signature"] as string | undefined;
  if (!signature) return res.status(400).send("Missing stripe-signature");

  let event;
  try {
    event = await constructWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature failed");
    return res.status(400).send("Bad signature");
  }

  const receiptWhere = {
    provider_externalEventId: {
      provider: "stripe",
      externalEventId: event.id,
    },
  } as const;

  const existing = await prisma.webhookEventReceipt.findUnique({
    where: receiptWhere,
  });

  if (existing?.status === "processed") {
    return res.json({ received: true, duplicate: true });
  }

  if (!existing) {
    await prisma.webhookEventReceipt.create({
      data: {
        provider: "stripe",
        externalEventId: event.id,
        status: "processing",
      },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          subscription?: string;
          client_reference_id?: string;
        };

        if (session.subscription && session.client_reference_id) {
          logger.info({ userId: session.client_reference_id }, "Checkout completed");
        }
        break;
      }
export default router;
