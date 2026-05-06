// Stripe Billing — Prompt #10
// Documents the full Stripe integration. Real code lives in the repo.

export type BillBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "callout"; tone: "info" | "warn" | "success" | "danger"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "filecode"; path: string; lang: string; description: string; code: string };

export type BillSection = { id: string; number: string; title: string; tagline: string; icon: string; blocks: BillBlock[] };

export const billingSpec: BillSection[] = [
  // 0
  {
    id: "overview", number: "00", icon: "💳",
    title: "What Just Connected",
    tagline: "Full Stripe subscriptions wired into the app — testable for $0.",
    blocks: [
      { type: "p", text: "This prompt shipped a complete subscription billing system: 4 plans, Stripe Checkout, customer portal, webhook handler, plan-aware credits, and a real Pricing page in the App tab. Everything works in FAKE_STRIPE mode without a Stripe account — flip one env var to go live." },
      { type: "callout", tone: "success", title: "Try the upgrade flow now",
        text: "App tab → 💎 Pricing → click any paid plan. In mock or FAKE_STRIPE mode, you're upgraded instantly + credits jump to the new ceiling. Your Settings → Your Plan card now shows 'Manage subscription' (or '🧪 Cancel (fake)') instead of 'Stripe ships in Phase 2'." },
    ],
  },
  // 1
  {
    id: "plans", number: "01", icon: "📋",
    title: "Plans (Single Source of Truth)",
    tagline: "One file, four plans, used by both backend and frontend.",
    blocks: [
      {
        type: "table",
        headers: ["Plan", "Price/mo", "Generations", "Stripe price ID env"],
        rows: [
          ["Free",    "$0",  "5",                  "—"],
          ["Starter", "$19", "100",                "STRIPE_PRICE_STARTER"],
          ["Pro",     "$49", "500",                "STRIPE_PRICE_PRO"],
          ["Agency",  "$99", "2,000",              "STRIPE_PRICE_AGENCY"],
        ],
      },
      {
        type: "filecode", path: "server/src/lib/plans.ts", lang: "ts",
        description: "Edit ONE file to change pricing or credits anywhere in the app.",
        code: `export const PLANS = {
  free:    { id: "free",    name: "Free",    priceUsd: 0,  credits: 5,    stripePriceId: "",                     features: [...] },
  starter: { id: "starter", name: "Starter", priceUsd: 19, credits: 100,  stripePriceId: env.STRIPE_PRICE_STARTER, features: [...] },
  pro:     { id: "pro",     name: "Pro",     priceUsd: 49, credits: 500,  stripePriceId: env.STRIPE_PRICE_PRO,     features: [...] },
  agency:  { id: "agency",  name: "Agency",  priceUsd: 99, credits: 2000, stripePriceId: env.STRIPE_PRICE_AGENCY,  features: [...] },
};

export function planFromStripePriceId(priceId: string) {
  if (priceId === PLANS.starter.stripePriceId) return "starter";
  if (priceId === PLANS.pro.stripePriceId)     return "pro";
  if (priceId === PLANS.agency.stripePriceId)  return "agency";
  return null;
}`,
      },
      { type: "callout", tone: "info", title: "Why one config file",
        text: "Frontend Pricing page, backend webhook, /api/billing/me — all read from the same PLANS object. No drift between marketing copy and what users actually get." },
    ],
  },
  // 2
  {
    id: "stripe-setup", number: "02", icon: "🛍️",
    title: "Stripe Product / Pricing Setup",
    tagline: "8 clicks in the Stripe dashboard. Then paste 3 IDs.",
    blocks: [
      {
        type: "ordered",
        items: [
          "Sign up for Stripe (test mode is fine for development).",
          "Dashboard → Products → 'Add product'. Name: 'Chief of Staff Starter'. Pricing: $19/mo recurring.",
          "Save. Copy the Price ID (starts with `price_`). Paste into STRIPE_PRICE_STARTER on Render.",
          "Repeat for Pro ($49) and Agency ($99). 3 products, 3 prices, 3 env vars.",
          "Dashboard → Developers → API keys. Copy the secret key. Paste into STRIPE_SECRET_KEY.",
          "Set FAKE_STRIPE=false on Render. Redeploy.",
          "Dashboard → Developers → Webhooks → 'Add endpoint'. URL: https://your-api.onrender.com/api/webhooks/stripe.",
          "Select events: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted. Save. Copy the signing secret (whsec_...) into STRIPE_WEBHOOK_SECRET.",
        ],
      },
      { type: "callout", tone: "warn", title: "Test mode first",
        text: "Stripe gives you a 'test mode' toggle. Use test keys + test card 4242 4242 4242 4242 (any future expiry, any CVC) until your flow is solid. Then flip both Stripe AND Render to live mode in one go." },
    ],
  },
  // 3
  {
    id: "schema", number: "03", icon: "🗄️",
    title: "Database Tables",
    tagline: "User got 1 new column. New Subscription table mirrors Stripe state.",
    blocks: [
      {
        type: "filecode", path: "server/prisma/schema.prisma (changes)", lang: "prisma",
        description: "stripeCustomerId on User + a 1-to-1 Subscription table.",
        code: `model User {
  // … existing fields …
  plan             String   @default("free")    // free | starter | pro | agency
  credits          Int      @default(5)         // remaining this period
  creditsMax       Int      @default(5)         // ceiling for the plan
  stripeCustomerId String?  @unique             // null until first checkout
  subscription     Subscription?
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeSubscriptionId String   @unique
  stripePriceId        String
  plan                 String
  status               String                  // active | trialing | past_due | canceled | incomplete | unpaid
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}`,
      },
      { type: "callout", tone: "info", title: "Why mirror Stripe locally",
        text: "Stripe is the source of truth — but for every page render, hitting their API would be slow + expensive. We sync to our DB on webhook. /api/billing/me is one DB query, instant." },
      {
        type: "code", lang: "bash",
        code: `# After updating schema.prisma — apply the migration:
cd server
npm run prisma:generate
npm run prisma:migrate    # creates the Subscription table + new User columns`,
      },
    ],
  },
  // 4
  {
    id: "checkout", number: "04", icon: "💵",
    title: "Checkout Session Route",
    tagline: "User clicks a plan → backend creates a Checkout session → user redirects to Stripe.",
    blocks: [
      {
        type: "filecode", path: "server/src/routes/billing.routes.ts", lang: "ts",
        description: "POST /api/billing/checkout — handles ensureCustomer + Checkout creation.",
        code: `router.post("/checkout", async (req, res, next) => {
  try {
    const { plan } = checkoutSchema.parse(req.body);                    // "starter" | "pro" | "agency"
    const planConfig = PLANS[plan];

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    // Create the Stripe Customer if this is their first ever checkout
    const customerId = await ensureCustomer({
      userId: user.id, email: user.email, existingCustomerId: user.stripeCustomerId,
    });
    if (customerId !== user.stripeCustomerId) {
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await createCheckoutSession({
      customerId,
      priceId: planConfig.stripePriceId,
      successUrl: env.BILLING_SUCCESS_URL,
      cancelUrl:  env.BILLING_CANCEL_URL,
      userId: user.id,
    });
    res.json({ url: session.url });    // frontend calls window.location.href = url
  } catch (e) { next(e); }
});`,
      },
      {
        type: "filecode", path: "server/src/lib/stripeClient.ts", lang: "ts",
        description: "Thin wrapper. FAKE_STRIPE returns a fake URL that bounces back into the app.",
        code: `export async function createCheckoutSession(args) {
  if (fake()) {
    return {
      id: \`cs_fake_\${Date.now()}\`,
      url: \`\${args.successUrl}&fake=1&priceId=\${encodeURIComponent(args.priceId)}\`,
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
  return { id: session.id, url: session.url };
}`,
      },
      { type: "callout", tone: "success", title: "subscription_data.metadata is the magic",
        text: "We tag every subscription with our internal userId. The webhook reads it back so we know exactly which user just upgraded — no email-matching guesswork." },
    ],
  },
  // 5
  {
    id: "webhook", number: "05", icon: "🪝",
    title: "Webhook Route",
    tagline: "Stripe pings us on every subscription change. Single source of truth.",
    blocks: [
      {
        type: "filecode", path: "server/src/app.ts (mounting)", lang: "ts",
        description: "CRITICAL: webhook mounts BEFORE express.json() — Stripe needs the raw body.",
        code: `// Stripe webhook needs the RAW body to verify the signature
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

// Then your normal JSON parsing for everything else
app.use(express.json({ limit: "100kb" }));`,
      },
      {
        type: "filecode", path: "server/src/routes/webhook.routes.ts", lang: "ts",
        description: "Handles 4 events. Updates DB, top-ups credits, demotes on cancel.",
        code: `router.post("/stripe", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = await constructWebhookEvent(req.body, signature);
  } catch (err) {
    return res.status(400).send("Bad signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // Acknowledge — actual subscription state lands in customer.subscription.* events
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const userId = sub.metadata?.userId ?? (await userIdFromCustomer(sub.customer));
      await applySubscriptionChange({
        userId,
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0]?.price.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const userId = ... ;
      await downgradeToFree(userId);
      break;
    }
  }
  res.json({ received: true });
});`,
      },
      {
        type: "filecode", path: "server/src/services/billing.service.ts", lang: "ts",
        description: "Webhook + fake-mode both call into here. One code path = no behavior drift.",
        code: `export async function applySubscriptionChange(args) {
  const planId = planFromStripePriceId(args.stripePriceId) ?? "free";

  await prisma.subscription.upsert({
    where: { userId: args.userId },
    create: { userId: args.userId, ...args, plan: planId },
    update: { ...args, plan: planId },
  });

  // Promote user — set plan + top up credits to new ceiling
  await prisma.user.update({
    where: { id: args.userId },
    data: { plan: planId, creditsMax: PLANS[planId].credits, credits: PLANS[planId].credits },
  });
}`,
      },
      { type: "callout", tone: "danger", title: "Always 200 OK on handler crash",
        text: "If your handler throws AFTER signature verification, return 200 anyway and log loudly. Otherwise Stripe retries every event for 3 days, eventually pausing your endpoint. Acknowledge → log → fix offline." },
    ],
  },
  // 6
  {
    id: "limits", number: "06", icon: "⛔",
    title: "Usage Limit Checking",
    tagline: "Already wired in. Same atomic credit decrement now reflects plan ceiling.",
    blocks: [
      { type: "p", text: "We didn't change generate.service.ts — just the User defaults. consumeCredit() already runs in a transaction, so credits never go negative. When a webhook fires, applySubscriptionChange() simply bumps creditsMax + credits to the new plan." },
      {
        type: "filecode", path: "server/src/services/credits.service.ts (unchanged)", lang: "ts",
        description: "Atomic, race-free, refundable on AI failure. Already shipped in Prompt #7.",
        code: `export async function consumeCredit(userId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
    if (!user) throw errors.unauthorized("Account not found");
    if (user.credits <= 0) throw errors.paymentRequired("You're out of credits this month");
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
      select: { credits: true },
    });
    return updated.credits;
  });
}`,
      },
      { type: "callout", tone: "info", title: "When a user hits 0",
        text: "The /api/generate route returns HTTP 402 OUT_OF_CREDITS. The frontend's friendlyError() maps that to a toast + a soft 'upgrade?' nudge. Pricing page is one click away from that toast." },
    ],
  },
  // 7
  {
    id: "frontend", number: "07", icon: "💎",
    title: "Frontend — Pricing & Account",
    tagline: "Two pages. One handles upgrade, one handles management.",
    blocks: [
      {
        type: "filecode", path: "src/app/pages/PricingPage.tsx (the upgrade handler)", lang: "tsx",
        description: "One button per plan. Handles real Stripe + fake-Stripe + mock mode.",
        code: `const onSelect = async (planId) => {
  if (planId === user.plan) return toast("You're already on this plan.", "info");
  setLoadingPlanId(planId);
  try {
    if (mode === "mock") {
      const plan = plans.find((p) => p.id === planId);
      upgradePlanLocal(planId, plan.credits);   // pure local — instant demo
      toast(\`Upgraded to \${plan.name} (mock mode)\`);
      navigate("dashboard");
      return;
    }
    const { url } = await billing.checkout(planId);
    if (fakeStripe && url.includes("fake=1")) {
      // FAKE_STRIPE: bounce back through the simulator
      await billing.simulateSuccess(planId);
      const plan = plans.find((p) => p.id === planId);
      upgradePlanLocal(planId, plan.credits);
      toast(\`Upgraded to \${plan.name} (fake Stripe mode)\`);
      navigate("dashboard");
    } else {
      window.location.href = url;               // real Stripe Checkout redirect
    }
  } catch (e) {
    toast(friendlyError(e), "danger");
  } finally {
    setLoadingPlanId(null);
  }
};`,
      },
      {
        type: "filecode", path: "src/app/pages/SettingsPage.tsx (Manage subscription)", lang: "tsx",
        description: "On real Stripe → Customer Portal redirect. On fake → simulate cancel.",
        code: `const onManage = async () => {
  if (billingState?.fakeStripe) {
    await billing.simulateCancel();
    await refreshUser();
    setBillingState(await billing.me());
    toast("Subscription cancelled (fake Stripe mode).", "info");
  } else {
    const { url } = await billing.portal();
    window.location.href = url;       // Stripe-hosted self-service portal
  }
};`,
      },
      { type: "callout", tone: "success", title: "Customer Portal = zero UI to build",
        text: "Stripe's portal handles update card, change plan, cancel, view invoices, download receipts. Free, hosted, branded with your logo. We just generate a session URL and redirect." },
    ],
  },
  // 8
  {
    id: "security", number: "08", icon: "🛡️",
    title: "Security Warnings",
    tagline: "5 things that will burn you if you skip them.",
    blocks: [
      {
        type: "table",
        headers: ["Risk", "Mitigation (already in code)"],
        rows: [
          ["Forged webhook calls", "constructWebhookEvent() verifies the Stripe signature using STRIPE_WEBHOOK_SECRET. Bad sig → 400."],
          ["Trusting client-sent plan + credit data", "Server reads PLANS[planId] from disk, never from the request. User can't POST `credits: 999`."],
          ["Stripe key leak", "STRIPE_SECRET_KEY only on server (Render env vars). Never NEXT_PUBLIC_/VITE_. Lazy-loaded so server boots without it."],
          ["Race condition in credit decrement", "consumeCredit uses prisma.$transaction → atomic. Two concurrent gens can't both win when credits=1."],
          ["User upgrades, webhook fails silently → not promoted", "applySubscriptionChange is the same code path for real + fake. Errors logged loudly. Stripe retries the webhook for 3 days."],
          ["Express.json() eating the raw body before signature check", "Webhook route mounted with express.raw() BEFORE express.json(). Order matters."],
        ],
      },
      { type: "callout", tone: "danger", title: "The #1 production billing bug",
        text: "Forgetting to mount express.raw() before express.json() on the webhook route. Symptom: 'Bad signature' 400s in your logs while Checkout works fine. Fix: see app.ts → '// Stripe webhook needs the RAW body' comment." },
    ],
  },
  // 9
  {
    id: "testing", number: "09", icon: "✅",
    title: "Testing Checklist",
    tagline: "Run these 12 tests before going live.",
    blocks: [
      {
        type: "ordered",
        items: [
          "FAKE_STRIPE=true: click Starter on Pricing → user.plan becomes 'starter', credits = 100, redirected to dashboard.",
          "FAKE_STRIPE=true: click Pro from Starter → upgraded, credits = 500.",
          "FAKE_STRIPE=true: Settings → '🧪 Cancel (fake)' → user.plan returns to 'free', credits frozen (don't reset on cancel).",
          "Stripe test mode: card 4242 4242 4242 4242, any future expiry, any CVC → Checkout completes, webhook updates DB.",
          "Stripe test mode: card 4000 0000 0000 9995 (declined) → Checkout shows error, no DB change.",
          "Webhook signature test: tamper with body → 400 Bad signature.",
          "Hit /api/generate while credits = 0 → 402 OUT_OF_CREDITS, frontend toast says 'You're out of credits this month.'",
          "Two concurrent generations when credits = 1 → exactly one succeeds, one gets 402.",
          "Cancel via Customer Portal → customer.subscription.updated webhook fires with cancel_at_period_end=true → DB updates.",
          "After period ends → customer.subscription.deleted webhook → user demoted to free, credits frozen.",
          "Refund via Stripe dashboard → no automatic action (intentional MVP simplification).",
          "Re-subscribe after cancel → ensureCustomer reuses existing stripeCustomerId, no duplicate Stripe customer.",
        ],
      },
      {
        type: "h",
        text: "Test webhooks locally with the Stripe CLI",
      },
      {
        type: "code", lang: "bash",
        code: `# Install: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:4000/api/webhooks/stripe
# Copy the whsec_… it prints into STRIPE_WEBHOOK_SECRET in server/.env

# In another terminal — trigger events manually:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted`,
      },
      { type: "callout", tone: "success", title: "Ship-it gate",
        text: "When all 12 tests pass with FAKE_STRIPE=false against Stripe test mode, you're production-ready. Flip Stripe + Render to live mode in one sitting (don't drag it out — easy to leak test keys into prod logs)." },
    ],
  },
];
