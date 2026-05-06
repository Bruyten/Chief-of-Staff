import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card } from "../ui/Primitives";
import { billing, friendlyError, type BillingPlan } from "../lib/apiClient";
import { cn } from "../../utils/cn";

// Mirror of the server PLANS — used in mock mode where there's no backend.
const MOCK_PLANS: BillingPlan[] = [
  { id: "free",    name: "Free",    priceUsd: 0,  credits: 5,    features: ["5 AI generations / month", "All 15 generators", "Unlimited projects", "Saved library"] },
  { id: "starter", name: "Starter", priceUsd: 19, credits: 100,  features: ["100 AI generations / month", "Everything in Free", "Priority email support"] },
  { id: "pro",     name: "Pro",     priceUsd: 49, credits: 500,  features: ["500 AI generations / month", "Everything in Starter", "Brand voice profiles (Phase 2)", "Bulk export"] },
  { id: "agency",  name: "Agency",  priceUsd: 99, credits: 2000, features: ["2,000 AI generations / month", "Everything in Pro", "3 client workspaces (Phase 2)", "Founder Slack channel"] },
];

export function PricingPage() {
  const { user, mode, navigate, toast, upgradePlanLocal } = useApp();
  const [plans, setPlans] = useState<BillingPlan[]>(MOCK_PLANS);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [fakeStripe, setFakeStripe] = useState<boolean>(true);

  useEffect(() => {
    if (mode !== "live") return;
    billing
      .plans()
      .then((res) => {
        setPlans(res.plans);
        setFakeStripe(res.fakeStripe);
      })
      .catch(() => { /* fall back to MOCK_PLANS */ });
  }, [mode]);

  const onSelect = async (planId: BillingPlan["id"]) => {
    if (planId === "free") {
      toast("You're already on a paid path — switching to free is via Settings.", "info");
      return;
    }
    if (planId === user.plan) {
      toast("You're already on this plan.", "info");
      return;
    }
    setLoadingPlanId(planId);
    try {
      if (mode === "mock") {
        // Pure local — instant upgrade for the demo
        const plan = plans.find((p) => p.id === planId)!;
        upgradePlanLocal(planId, plan.credits);
        toast(`Upgraded to ${plan.name} (mock mode)`);
        navigate("dashboard");
        return;
      }
      const { url } = await billing.checkout(planId as "starter" | "pro" | "agency");
      // In FAKE_STRIPE mode the URL points back at our app with ?fake=1.
      // We honor it by calling /simulate-success then bouncing to dashboard.
      if (fakeStripe && url.includes("fake=1")) {
        await billing.simulateSuccess(planId as "starter" | "pro" | "agency");
        const plan = plans.find((p) => p.id === planId)!;
        upgradePlanLocal(planId, plan.credits);
        toast(`Upgraded to ${plan.name} (fake Stripe mode)`);
        navigate("dashboard");
      } else {
        window.location.href = url;        // real Stripe Checkout
      }
    } catch (e) {
      toast(friendlyError(e), "danger");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <AppShell
      title="Pricing"
      subtitle="Pick a plan. Upgrade or cancel anytime."
      action={
        <Button variant="ghost" size="md" onClick={() => navigate("settings")}>
          ← Back
        </Button>
      }
    >
      {fakeStripe && (
        <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 text-amber-100 text-[13px]">
          🧪 <strong>FAKE_STRIPE mode is on.</strong> Clicking a plan upgrades you instantly without
          touching a real Stripe account — perfect for development. Set
          <code className="mx-1 text-amber-200">FAKE_STRIPE=false</code> + paste real
          <code className="mx-1 text-amber-200">STRIPE_*</code> env vars when you're ready.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = user.plan === plan.id;
          const isHighlighted = plan.id === "pro";
          return (
            <Card
              key={plan.id}
              padded={false}
              className={cn(
                "flex flex-col overflow-hidden transition",
                isHighlighted && "!border-violet-400/40 ring-1 ring-violet-400/20",
                isCurrent && "!border-emerald-400/40"
              )}
            >
              {isHighlighted && (
                <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] uppercase tracking-widest font-semibold text-center py-1">
                  Most popular
                </div>
              )}
              <div className="px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-white text-lg font-bold">{plan.name}</div>
                  {isCurrent && <Badge tone="success">Current</Badge>}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">${plan.priceUsd}</span>
                  <span className="text-white/45 text-sm">/ month</span>
                </div>
                <div className="text-white/50 text-[12px] mt-1">{plan.credits.toLocaleString()} generations / month</div>
              </div>
              <div className="px-5 py-4 flex-1">
                <ul className="space-y-2 text-[13px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-white/80">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-5 pb-5">
                <Button
                  variant={isHighlighted ? "primary" : "secondary"}
                  className="w-full"
                  loading={loadingPlanId === plan.id}
                  disabled={isCurrent}
                  onClick={() => onSelect(plan.id)}
                >
                  {isCurrent ? "Current plan" : plan.id === "free" ? "Stay free" : `Choose ${plan.name}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center text-[12px] text-white/40">
        Prices in USD. Cancel anytime in Settings → Manage subscription.
      </div>
    </AppShell>
  );
}
