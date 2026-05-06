// Thin Stripe wrapper. Same trick as aiClient.ts: in FAKE_STRIPE mode,
// every call returns a believable fake response so the whole billing
// flow can be developed and demoed WITHOUT a Stripe account.
//
// Real Stripe SDK is loaded lazily — server boots fine without it.

import { env } from "../env.js";

export type CheckoutSession = { id: string; url: string };
export type PortalSession = { url: string };

let realStripe: import("stripe").default | null = null;
async function getRealStripe(): Promise<import("stripe").default> {
  if (realStripe) return realStripe;
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  const Stripe = (await import("stripe")).default;
  realStripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" as never });
  return realStripe;
}

const fake = () => env.FAKE_STRIPE || !env.STRIPE_SECRET_KEY;

/** Create or fetch a Stripe Customer for this user. */
export async function ensureCustomer(args: {
  userId: string;
  email: string;
  existingCustomerId?: string | null;
}): Promise<string> {
  if (fake()) return args.existingCustomerId ?? `cus_fake_${args.userId.slice(0, 8)}`;
  if (args.existingCustomerId) return args.existingCustomerId;
  const stripe = await getRealStripe();
  const customer = await stripe.customers.create({
    email: args.email,
    metadata: { userId: args.userId },
  });
  return customer.id;
}

/** Create a Checkout Session in subscription mode. */
export async function createCheckoutSession(args: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}): Promise<CheckoutSession> {
  if (fake()) {
    return {
      id: `cs_fake_${Date.now()}`,
      // In fake mode we redirect straight back to the success URL — the
      // frontend then asks the backend to "simulate" the webhook.
      url: `${args.successUrl}&fake=1&priceId=${encodeURIComponent(args.priceId)}`,
    };
  }
  const stripe = await getRealStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: args.customerId,
    line_items: [{ price: args.priceId, quantity: 1 }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: args.userId,
    subscription_data: { metadata: { userId: args.userId } },
  });
  return { id: session.id, url: session.url ?? args.cancelUrl };
}

/** Create a Customer Portal session so users self-manage subscription. */
export async function createPortalSession(args: {
  customerId: string;
  returnUrl: string;
}): Promise<PortalSession> {
  if (fake()) return { url: `${args.returnUrl}&portal=1` };
  const stripe = await getRealStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: args.customerId,
    return_url: args.returnUrl,
  });
  return { url: session.url };
}

/** Verify webhook signature. Throws if invalid. */
export async function constructWebhookEvent(
  rawBody: Buffer,
  signature: string
): Promise<import("stripe").Stripe.Event> {
  if (fake()) {
    // Caller (webhook route) handles fake events directly via JSON parse.
    throw new Error("constructWebhookEvent should not be called in FAKE_STRIPE mode");
  }
  const stripe = await getRealStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

export const isFakeStripe = fake;
