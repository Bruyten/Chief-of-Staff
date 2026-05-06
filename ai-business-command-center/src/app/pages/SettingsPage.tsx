import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, Input } from "../ui/Primitives";
import { billing, friendlyError, type BillingMe } from "../lib/apiClient";

export function SettingsPage() {
  const { user, logout, toast, mode, navigate, refreshUser, upgradePlanLocal } = useApp();
  const [name, setName] = useState(user.name);
  const [savedName, setSavedName] = useState(false);
  const [billingState, setBillingState] = useState<BillingMe | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    if (mode !== "live") return;
    billing.me().then(setBillingState).catch(() => { /* ignore */ });
  }, [mode]);

  const onManage = async () => {
    if (mode === "mock") {
      toast("Cancelling subscription (mock mode).", "info");
      upgradePlanLocal("starter", 100);     // toggle a fake demote
      return;
    }
    setBillingBusy(true);
    try {
      if (billingState?.fakeStripe) {
        await billing.simulateCancel();
        await refreshUser();
        const updated = await billing.me();
        setBillingState(updated);
        toast("Subscription cancelled (fake Stripe mode).", "info");
      } else {
        const { url } = await billing.portal();
        window.location.href = url;
      }
    } catch (e) {
      toast(friendlyError(e), "danger");
    } finally {
      setBillingBusy(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Profile, plan, and account.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <SectionTitle title="Profile" subtitle="How you appear in the app." />
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-lg font-semibold text-white">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold">{user.name}</div>
                <div className="text-white/45 text-[12.5px]">{user.email}</div>
              </div>
            </div>
            <div className="space-y-3">
              <Input
                label="Display name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSavedName(false);
                }}
              />
              <Input label="Email" value={user.email} disabled hint="Email changes coming in Phase 1.5." />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  onClick={() => {
                    setSavedName(true);
                    toast("Profile updated");
                  }}
                  disabled={savedName || name === user.name}
                >
                  {savedName ? "✓ Saved" : "Save changes"}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Danger zone" subtitle="Account-level actions." />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white text-[13.5px] font-semibold">Sign out</div>
                <div className="text-white/45 text-[12px]">End your session on this device.</div>
              </div>
              <Button variant="danger" onClick={logout}>
                Sign out
              </Button>
            </div>
            <div className="border-t border-white/5 mt-4 pt-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-white text-[13.5px] font-semibold">Delete account</div>
                <div className="text-white/45 text-[12px]">Permanently delete all data. Coming in Phase 1.5.</div>
              </div>
              <Button variant="danger" disabled>
                Delete
              </Button>
            </div>
          </Card>
        </div>

        {/* Plan & credits */}
        <div className="space-y-5">
          <Card className="!bg-gradient-to-br !from-violet-500/10 !to-fuchsia-500/5 !border-violet-400/20">
            <div className="flex items-center justify-between mb-2">
              <SectionTitle title="Your plan" />
              <Badge tone={user.plan === "free" ? "neutral" : "violet"}>
                {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
              </Badge>
            </div>
            <div className="text-white text-2xl font-bold mt-2">
              {user.credits}
              <span className="text-white/40 text-base font-normal"> / {user.creditsMax} credits</span>
            </div>
            <div className="text-white/45 text-[12px] mb-3">
              {billingState?.subscription?.cancelAtPeriodEnd
                ? `Cancels on ${new Date(billingState.subscription.currentPeriodEnd).toLocaleDateString()}`
                : billingState?.subscription
                ? `Renews on ${new Date(billingState.subscription.currentPeriodEnd).toLocaleDateString()}`
                : "Resets monthly."}
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all"
                style={{ width: `${Math.min(100, (user.credits / Math.max(user.creditsMax, 1)) * 100)}%` }}
              />
            </div>

            {user.plan === "free" ? (
              <Button variant="primary" className="w-full" onClick={() => navigate("pricing")}>
                💎 Upgrade plan
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="primary" className="w-full" onClick={() => navigate("pricing")}>
                  Change plan
                </Button>
                <Button variant="secondary" className="w-full" loading={billingBusy} onClick={onManage}>
                  {billingState?.fakeStripe ? "🧪 Cancel (fake)" : "Manage subscription"}
                </Button>
              </div>
            )}
            {billingState?.fakeStripe && (
              <div className="text-[10px] text-amber-300/80 mt-2 text-center">FAKE_STRIPE mode</div>
            )}
          </Card>

          <Card>
            <SectionTitle title="What's included" />
            <ul className="space-y-2 text-[13px]">
              {[
                { ok: true, label: "All 15 generators" },
                { ok: true, label: "Unlimited projects" },
                { ok: true, label: "Saved library" },
                { ok: false, label: "Brand voice profiles" },
                { ok: false, label: "Stripe / Gmail integrations" },
                { ok: false, label: "Workflow automations" },
              ].map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  <span className={f.ok ? "text-emerald-400" : "text-white/25"}>{f.ok ? "✓" : "○"}</span>
                  <span className={f.ok ? "text-white/85" : "text-white/45"}>{f.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-white text-[15px] font-semibold">{title}</h2>
      {subtitle && <div className="text-white/45 text-[12px] mt-0.5">{subtitle}</div>}
    </div>
  );
}
