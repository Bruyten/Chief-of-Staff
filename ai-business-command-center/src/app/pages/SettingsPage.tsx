import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, Input } from "../ui/Primitives";
import { account, billing, friendlyError, type BillingMe } from "../lib/apiClient";

export function SettingsPage() {
  const {
    user,
    logout,
    toast,
    mode,
    navigate,
    refreshUser,
    upgradePlanLocal,
  } = useApp();

  const [name, setName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [billingState, setBillingState] = useState<BillingMe | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  useEffect(() => {
    if (mode !== "live") return;

    billing.me().then(setBillingState).catch(() => {
      // ignore initial billing load failure
    });
  }, [mode]);

  const saveProfile = async () => {
    if (!name.trim() || name.trim() === user.name) return;
    setSavingName(true);

    try {
      if (mode === "live") {
        await account.updateProfile({ name: name.trim() });
        await refreshUser();
      }

      toast("Profile updated");
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setSavingName(false);
    }
  };

  const onManage = async () => {
    if (mode === "mock") {
      toast("Subscription management demo triggered (mock mode).", "info");
      upgradePlanLocal("starter", 100, 0);
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
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setBillingBusy(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Profile, subscription, usage, and platform readiness.">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle title="Profile" subtitle="Basic account identity shown across the app." />

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="h-14 w-14 rounded-full bg-white/10 grid place-items-center text-lg font-semibold">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-white/45">{user.email}</div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Input label="Display name" value={name} onChange={(event) => setName(event.target.value)} />
            <Button onClick={() => void saveProfile()} loading={savingName} disabled={!name.trim() || name.trim() === user.name}>
              Save profile
            </Button>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 space-y-3">
            <div>
              <div className="font-medium">Sign out</div>
              <div className="text-sm text-white/45">End your session on this device.</div>
            </div>
            <Button variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Plan and usage" subtitle="Text AI and premium video credits are tracked separately." />

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold capitalize">{user.plan}</div>
                {billingState?.fakeStripe ? <Badge>FAKE_STRIPE</Badge> : null}
              </div>
              <div className="mt-1 text-sm text-white/45">
                {billingState?.subscription?.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(billingState.subscription.currentPeriodEnd).toLocaleDateString()}`
                  : billingState?.subscription
                    ? `Renews on ${new Date(billingState.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : "Resets monthly."}
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate("pricing")}>
              View Pricing
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <UsageCard label="Text AI Credits" value={`${user.credits} / ${user.creditsMax}`} />
            <UsageCard label="Video Credits" value={`${user.videoCredits} / ${user.videoCreditsMax}`} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {user.plan === "free" ? (
              <Button onClick={() => navigate("pricing")}>Upgrade plan</Button>
            ) : (
              <>
                <Button onClick={() => navigate("pricing")}>Change plan</Button>
                <Button variant="secondary" onClick={() => void onManage()} loading={billingBusy}>
                  {billingState?.fakeStripe ? "Cancel (fake)" : "Manage subscription"}
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle title="Upgrade readiness" subtitle="What is available in the upgraded operating layer." />

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              { ok: true, label: "Existing generators and saved outputs" },
              { ok: true, label: "Campaign Workspaces" },
              { ok: true, label: "Brand Voice Profiles" },
              { ok: true, label: "Chief of Staff Chat" },
              { ok: true, label: "Workflow Templates" },
              { ok: true, label: "Automations scheduler" },
              { ok: user.videoCreditsMax > 0, label: "Premium Video Studio allowance" },
              { ok: true, label: "Dashboard command center" },
              { ok: true, label: "Separate text/video usage accounting" },
            ].map((feature) => (
              <div key={feature.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <span className={feature.ok ? "text-emerald-300" : "text-white/35"}>
                  {feature.ok ? "✓" : "○"}
                </span>{" "}
                {feature.label}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40 font-semibold">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-white/45">{subtitle}</p> : null}
    </div>
  );
}
