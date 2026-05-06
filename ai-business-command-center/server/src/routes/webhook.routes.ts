// Stripe webhook handler.
//
// IMPORTANT: this route MUST be mounted with `express.raw({ type: 'application/json' })`
// BEFORE the global express.json() middleware — Stripe needs the raw body to
// verify the signature. See app.ts for the wiring.

import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { constructWebhookEvent, isFakeStripe } from "../lib/stripeClient.js";
import { applySubscriptionChange, downgradeToFree } from "../services/billing.service.js";

const router = Router();

router.post("/stripe", async (req: Request, res: Response) => {
  if (isFakeStripe()) {
    // We don't accept real webhooks in FAKE_STRIPE mode — the frontend uses
    // /api/billing/simulate-* endpoints instead.
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

  try {
    switch (event.type) {
      // Fired when a Checkout completes — fetch the subscription and apply.
      case "checkout.session.completed": {
        const session = event.data.object as { subscription?: string; client_reference_id?: string };
        if (session.subscription && session.client_reference_id) {
          // Subscription will be filled in by subsequent customer.subscription.created
          // event, so we can just acknowledge here.
          logger.info({ userId: session.client_reference_id }, "Checkout completed");
        }
        break;
      }

      // The lifecycle events we care about
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as {
          id: string;
          status: string;
          customer: string;
          items: { data: { price: { id: string } }[] };
          current_period_start: number;
          current_period_end: number;
          cancel_at_period_end: boolean;
          metadata: Record<string, string>;
        };
        const userId = sub.metadata?.userId ?? (await userIdFromCustomer(sub.customer));
        if (!userId) {
          logger.warn({ subId: sub.id }, "Subscription event with no matching user");
          break;
        }
        await applySubscriptionChange({
          userId,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id ?? "",
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as { customer: string; metadata: Record<string, string> };
        const userId = sub.metadata?.userId ?? (await userIdFromCustomer(sub.customer));
        if (userId) await downgradeToFree(userId);
        break;
      }

      default:
        // Unknown / uninteresting event types are acknowledged silently.
        break;
    }
    res.json({ received: true });
  } catch (err) {
    logger.error({ err, type: event.type }, "Webhook handler failed");
    // Acknowledge so Stripe doesn't keep retrying — but log loudly.
    res.status(200).json({ received: true, error: "handler_failed" });
  }
});

async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export default router;
