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
      "5 text AI generations per month",
      "Core text tools",
      "Unlimited projects",
      "Saved library",
      "Video Studio locked",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceUsd: 19,
    textCredits: 100,
    videoCredits: 0,
}
