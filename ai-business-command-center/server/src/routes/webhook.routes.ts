import { Router, type Request, type Response } from "express";

import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import {
  constructWebhookEvent,
  isFakeStripe,
} from "../lib/stripeClient.js";
import {
  applySubscriptionChange,
  downgradeToFree,
} from "../services/billing.service.js";

const router = Router();

function asDateFromUnix(value: number | null | undefined) {
  return new Date((value ?? Math.floor(Date.now() / 1000)) * 1000);
}

router.post("/stripe", async (req: Request, res: Response) => {
  if (isFakeStripe()) {
    return res.status(200).json({
      ok: true,
      fake: true,
    });
  }

  const signature = req.headers["stripe-signature"] as
    | string
    | undefined;

  if (!signature) {
    return res.status(400).send("Missing stripe-signature");
  }

  let event;

  try {
    event = await constructWebhookEvent(
      req.body as Buffer,
      signature,
    );
  } catch (error) {
    logger.warn({ err: error }, "Stripe webhook signature failed");
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
    return res.json({
      received: true,
      duplicate: true,
    });
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
          subscription?: string | null;
          client_reference_id?: string | null;
        };

        if (
          session.subscription &&
          session.client_reference_id
        ) {
          logger.info(
            {
              userId: session.client_reference_id,
              stripeSubscriptionId: session.subscription,
            },
            "Stripe checkout completed",
          );
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as {
          id: string;
          status: string;
          cancel_at_period_end?: boolean;
          current_period_start?: number;
          current_period_end?: number;
          metadata?: {
            userId?: string;
          };
          items?: {
            data?: Array<{
              price?: {
                id?: string;
              };
            }>;
          };
        };

        const userId = subscription.metadata?.userId;
        const stripePriceId =
          subscription.items?.data?.[0]?.price?.id;

        if (!userId || !stripePriceId) {
          logger.warn(
            {
              subscriptionId: subscription.id,
              userId,
              stripePriceId,
            },
            "Subscription webhook missing user or price metadata",
          );
          break;
        }

        await applySubscriptionChange({
          userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId,
          status: subscription.status,
          currentPeriodStart: asDateFromUnix(
            subscription.current_period_start,
          ),
          currentPeriodEnd: asDateFromUnix(
            subscription.current_period_end,
          ),
          cancelAtPeriodEnd:
            subscription.cancel_at_period_end ?? false,
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as {
          id: string;
          metadata?: {
            userId?: string;
          };
        };

        let userId = subscription.metadata?.userId;

        if (!userId) {
          const existingSubscription =
            await prisma.subscription.findFirst({
              where: {
                stripeSubscriptionId: subscription.id,
              },
              select: {
                userId: true,
              },
            });

          userId = existingSubscription?.userId;
        }

        if (userId) {
          await downgradeToFree(userId);
        }

        break;
      }

      default: {
        logger.info(
          {
            type: event.type,
          },
          "Unhandled Stripe webhook event type",
        );
      }
    }

    await prisma.webhookEventReceipt.update({
      where: receiptWhere,
      data: {
        status: "processed",
        processedAt: new Date(),
        errorMsg: null,
      },
    });

    return res.json({
      received: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown webhook processing error";

    logger.error(
      {
        err: error,
        eventId: event.id,
        eventType: event.type,
      },
      "Stripe webhook processing failed",
    );

    await prisma.webhookEventReceipt.update({
      where: receiptWhere,
      data: {
        status: "failed",
        errorMsg: message,
      },
    });

    return res.status(500).json({
      received: false,
    });
  }
});

export default router;
