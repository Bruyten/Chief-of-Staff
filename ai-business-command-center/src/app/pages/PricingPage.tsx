import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card } from "../ui/Primitives";
import { billing, friendlyError, type BillingPlan } from "../lib/apiClient";
import { cn } from "../../utils/cn";

const MOCK_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceUsd: 0,
    textCredits: 5,
    videoCredits: 0,
    features: [
      "5 text AI generations / month",
      "Core generators",
      "Unlimited projects",
      "Saved library",
      "Video Studio locked",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceUsd: 19,
    textCredits: 100,
    videoCredits: 0,
    features: [
      "100 text AI generations / month",
      "Chief of Staff Chat",
      "Workflows and Automations use text credits",
      "Video Studio locked",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 49,
    textCredits: 500,
    videoCredits: 3,
    features: [
      "500 text AI generations / month",
      "3 premium video credits / month",
      "Brand Voice Profiles",
      "Chief of Staff Chat",
      "Workflows and Automations",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    priceUsd: 99,
    textCredits: 2000,
    videoCredits: 10,
    features: [
      "2,000 text AI generations / month",
      "10 premium video credits / month",
      "Everything in Pro",
      "Higher-capacity production",
      "Founder support channel",
    ],
  },
];

export function PricingPage() {
  const { user, mode, navigate, toast, upgradePlanLocal } = useApp();
  const [plans, setPlans] = useState<BillingPlan[]>(MOCK_PLANS);
  const [loadingPlanId, setLoadingPlanId] = useState<BillingPlan["id"] | null>(null);
  const [fakeStripe, setFakeStripe] = useState(true);

  useEffect(() => {
    if (mode !== "live") return;

    billing
      .plans()
      .then((response) => {
        setPlans(response.plans);
        setFakeStripe(response.fakeStripe);
      })
      .catch(() => {
        // fallback to mock plans
      });
  }, [mode]);

  const onSelect = async (planId: BillingPlan["id"]) => {
    if (planId === "free") {
      toast("Switching down to free is handled from Settings / subscription management.", "info");
      return;
    }

    if (planId === user.plan) {
      toast("You're already on this plan.", "info");
      return;
    }

    setLoadingPlanId(planId);

    try {
      if (mode === "mock") {
        const plan = plans.find((entry) => entry.id === planId)!;
        upgradePlanLocal(planId, plan.textCredits, plan.videoCredits);
        toast(`Upgraded to ${plan.name} (mock mode)`);
        navigate("dashboard");
        return;
      }

      const { url } = await billing.checkout(planId as "starter" | "pro" | "agency");

      if (fakeStripe && url.includes("fake=1")) {
        await billing.simulateSuccess(planId as "starter" | "pro" | "agency");
        const plan = plans.find((entry) => entry.id === planId)!;
        upgradePlanLocal(planId, plan.textCredits, plan.videoCredits);
        toast(`Upgraded to ${plan.name} (fake Stripe mode)`);
        navigate("dashboard");
      } else {
        window.location.href = url;
      }
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <AppShell
      title="Pricing"
      subtitle="Text AI usage and premium video usage are tracked separately."
      action={
        <Button variant="secondary" onClick={() => navigate("settings")}>
          ← Back
        </Button>
      }
    >
      <div className="space-y-6">
        {fakeStripe ? (
          <Card>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              <strong>FAKE_STRIPE mode is on.</strong> Clicking a paid plan upgrades instantly for development.
              Switch to live Stripe only after products, prices, webhooks, and env vars are configured.
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = user.plan === plan.id;
            const isHighlighted = plan.id === "pro";

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative h-full",
                  isHighlighted ? "border-violet-400/40 bg-violet-400/[0.06]" : ""
                )}
              >
                {isHighlighted ? (
                  <div className="absolute right-4 top-4">
                    <Badge>Most popular</Badge>
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{plan.name}</h2>
                      {isCurrent ? <Badge>Current</Badge> : null}
                    </div>
                    <div className="mt-3 text-3xl font-semibold">${plan.priceUsd}</div>
                    <div className="text-sm text-white/45">/ month</div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <Allowance label="Text AI" value={`${plan.textCredits.toLocaleString()} / month`} />
                    <Allowance label="Video" value={`${plan.videoCredits.toLocaleString()} / month`} />
                  </div>

                  <div className="space-y-2 text-sm text-white/70 min-h-[160px]">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex gap-2">
                        <span className="text-emerald-300">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    loading={loadingPlanId === plan.id}
                    disabled={isCurrent}
                    onClick={() => void onSelect(plan.id)}
                  >
                    {isCurrent
                      ? "Current plan"
                      : plan.id === "free"
                        ? "Stay free"
                        : `Choose ${plan.name}`}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-sm text-white/45 text-center">
          Prices shown in USD. Manage or cancel active billing from Settings.
        </div>
      </div>
    </AppShell>
  );
}

function Allowance({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
