import { env } from "../env.js";

export type PlanId = "free" | "starter" | "pro" | "agency";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  textCredits: number;
  videoCredits: number;
  stripePriceId: string;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    textCredits: 5,
    videoCredits: 0,
    stripePriceId: "",
    features: [
      "5 AI text generations per month",
      "Core marketing workspace",
      "Saved outputs",
      "Mock-mode development support",
    ],
  },

  starter: {
    id: "starter",
    name: "Starter",
    priceUsd: 19,
    textCredits: 100,
    videoCredits: 0,
    stripePriceId: env.STRIPE_PRICE_STARTER,
    features: [
      "100 AI text generations per month",
      "Projects and campaign workspaces",
      "Saved outputs",
      "Brand voice profiles",
    ],
  },

  pro: {
    id: "pro",
    name: "Pro",
    priceUsd: 49,
    textCredits: 500,
    videoCredits: 5,
    stripePriceId: env.STRIPE_PRICE_PRO,
    features: [
      "500 AI text generations per month",
      "5 premium video credits per month",
      "Chief of Staff chat",
      "Workflow templates and workflow runs",
      "Automations",
    ],
  },

  agency: {
    id: "agency",
    name: "Agency",
    priceUsd: 99,
    textCredits: 2000,
    videoCredits: 20,
    stripePriceId: env.STRIPE_PRICE_AGENCY,
    features: [
      "2,000 AI text generations per month",
      "20 premium video credits per month",
      "Advanced workflow support",
      "Recurring automations",
      "Higher-volume campaign planning",
    ],
  },
};

export const PAID_PLANS: PlanId[] = ["starter", "pro", "agency"];

export function planFromStripePriceId(priceId: string): PlanId | null {
  if (priceId && priceId === PLANS.starter.stripePriceId) return "starter";
  if (priceId && priceId === PLANS.pro.stripePriceId) return "pro";
  if (priceId && priceId === PLANS.agency.stripePriceId) return "agency";
  return null;
}

export function getPlan(planId: string | null | undefined): Plan {
  if (!planId) return PLANS.free;
  if (planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.free;
}
