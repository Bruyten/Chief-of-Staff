import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState, Input, Modal, Textarea } from "../ui/Primitives";
import {
  automations,
  brandVoices,
  friendlyError,
  type Automation,
  type BrandVoiceProfile,
} from "../lib/apiClient";

type AutomationForm = {
  name: string;
  type: Automation["type"];
  projectId: string;
  brandVoiceProfileId: string;
  timezone: string;
  dayOfWeek: string;
  dayOfMonth: string;
  hour: string;
  minute: string;
  productName: string;
  targetAudience: string;
  offer: string;
  cta: string;
};

const EMPTY_FORM: AutomationForm = {
  name: "",
  type: "weekly_content_plan",
  projectId: "",
  brandVoiceProfileId: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  dayOfWeek: "1",
  dayOfMonth: "1",
  hour: "9",
  minute: "0",
  productName: "",
  targetAudience: "",
  offer: "",
  cta: "",
};

export function AutomationsPage() {
  const { mode, params, projects, toast } = useApp();
  const [items, setItems] = useState<Automation[]>([]);
  const [brandProfiles, setBrandProfiles] = useState<BrandVoiceProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AutomationForm>({
    ...EMPTY_FORM,
    projectId: typeof params.projectId === "string" ? params.projectId : "",
  });

  useEffect(() => {
    if (mode === "mock") {
      setItems([]);
      setBrandProfiles([]);
      return;
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function loadData() {
    setLoading(true);

    try {
      const [automationResponse, brandResponse] = await Promise.all([
        automations.list(),
        brandVoices.list(),
      ]);

      setItems(automationResponse.automations);
      setBrandProfiles(brandResponse.profiles);
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      projectId: typeof params.projectId === "string" ? params.projectId : "",
    });
    setModalOpen(true);
  }

  function closeCreate() {
    setModalOpen(false);
    setForm({
      ...EMPTY_FORM,
      projectId: typeof params.projectId === "string" ? params.projectId : "",
    });
  }

  const cadence = automationCadence(form.type);

  async function createAutomation() {
    if (!form.name.trim() || saving) return;

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        projectId: form.projectId || null,
        brandVoiceProfileId: form.brandVoiceProfileId || null,
        timezone: form.timezone.trim() || "UTC",
        dayOfWeek: cadence === "weekly" ? Number(form.dayOfWeek) : null,
        dayOfMonth: cadence === "monthly" ? Number(form.dayOfMonth) : null,
        hour: Number(form.hour),
        minute: Number(form.minute),
        config: {
          productName: form.productName.trim(),
          targetAudience: form.targetAudience.trim(),
          offer: form.offer.trim(),
          cta: form.cta.trim(),
        },
      };

      if (mode === "mock") {
        const now = new Date().toISOString();

        const item: Automation = {
          id: `automation_${Date.now()}`,
          userId: "u_demo",
          projectId: payload.projectId,
          brandVoiceProfileId: payload.brandVoiceProfileId,
          name: payload.name,
          type: payload.type,
          cadence,
          enabled: true,
          timezone: payload.timezone,
          dayOfWeek: payload.dayOfWeek,
          dayOfMonth: payload.dayOfMonth,
          hour: payload.hour,
          minute: payload.minute,
          config: payload.config,
          lastRunAt: null,
          nextRunAt: now,
          lastStatus: null,
          lastError: null,
          failureCount: 0,
          createdAt: now,
          updatedAt: now,
          project: projects.find((project) => project.id === payload.projectId)
            ? {
                id: payload.projectId ?? "",
                name: projects.find((project) => project.id === payload.projectId)?.name ?? "",
                emoji: projects.find((project) => project.id === payload.projectId)?.emoji ?? null,
              }
            : null,
          brandVoiceProfile: null,
          runs: [],
        };

        setItems((current) => [item, ...current]);
        toast("Mock automation created");
        closeCreate();
        return;
      }

      const response = await automations.create(payload);
      setItems((current) => [response.automation, ...current]);
      toast("Automation created");
      closeCreate();
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAutomation(item: Automation) {
    try {
      if (mode === "mock") {
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, enabled: !entry.enabled } : entry
          )
        );
        toast(item.enabled ? "Automation disabled" : "Automation enabled", "info");
        return;
      }

      const response = item.enabled
        ? await automations.disable(item.id)
        : await automations.enable(item.id);

      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? response.automation : entry))
      );
      toast(item.enabled ? "Automation disabled" : "Automation enabled", "info");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  async function runNow(item: Automation) {
    try {
      if (mode === "mock") {
        toast("Mock automation queued", "info");
        return;
      }

      await automations.runNow(item.id);
      toast("Automation queued for manual run");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  async function deleteAutomation(item: Automation) {
    const confirmed = window.confirm(`Delete "${item.name}"?`);
    if (!confirmed) return;

    try {
      if (mode === "live") {
        await automations.delete(item.id);
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast("Automation deleted", "info");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  const enabledCount = useMemo(() => items.filter((item) => item.enabled).length, [items]);

  return (
    <AppShell
      title="Automations"
      subtitle="Recurring marketing tasks built on top of workflows and lightweight AI routines."
      action={<Button onClick={openCreate}>+ New Automation</Button>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric title="Total Automations" value={items.length} />
          <Metric title="Enabled" value={enabledCount} />
          <Metric title="Disabled" value={items.length - enabledCount} />
        </div>

        <Card>
          <h2 className="text-lg font-semibold">Practical MVP Scope</h2>
          <p className="mt-2 text-sm text-white/55">
            This is intentionally not a drag-and-drop Zapier clone. It schedules repeatable marketing work and
            leaves room for stronger workers, notifications, and richer retry controls later.
          </p>
        </Card>

        {loading ? (
          <Card>
            <div className="text-sm text-white/55">Loading automations…</div>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon="⏱️"
              title="No automations yet"
              description="Create a recurring weekly or monthly marketing automation for a campaign workspace."
              action={<Button onClick={openCreate}>+ Create Automation</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      <Badge>{item.enabled ? "enabled" : "disabled"}</Badge>
                      <Badge>{item.cadence}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-white/55">{automationDescription(item.type)}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Info label="Project" value={item.project?.name ?? "No project"} />
                  <Info label="Brand Profile" value={item.brandVoiceProfile?.brandName ?? "None"} />
                  <Info label="Next Run" value={formatDate(item.nextRunAt)} />
                  <Info label="Last Run" value={formatDate(item.lastRunAt)} />
                  <Info label="Last Status" value={item.lastStatus ?? "Never run"} />
                  <Info label="Timezone" value={item.timezone} />
                </div>

                {item.lastError ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    {item.lastError}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => void toggleAutomation(item)}>
                    {item.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="secondary" onClick={() => void runNow(item)}>
                    Run Now
                  </Button>
                  <Button variant="secondary" onClick={() => void deleteAutomation(item)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeCreate}
        title="Create Marketing Automation"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreate}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void createAutomation()}>
              Create Automation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Automation name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Monday Weekly Content Plan"
            autoFocus
          />

          <label className="space-y-2 block">
            <div className="text-sm text-white/70">Automation Type</div>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as Automation["type"],
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="weekly_content_plan">Weekly Content Plan</option>
              <option value="monthly_campaign_ideas">Monthly Campaign Ideas</option>
              <option value="weekly_task_recommendation">Weekly Marketing Task Recommendation</option>
            </select>
          </label>

          <label className="space-y-2 block">
            <div className="text-sm text-white/70">Project / Campaign</div>
            <select
              value={form.projectId}
              onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">No project selected</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.emoji} {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 block">
            <div className="text-sm text-white/70">Brand Voice Profile</div>
            <select
              value={form.brandVoiceProfileId}
              onChange={(event) =>
                setForm((current) => ({ ...current, brandVoiceProfileId: event.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">No brand profile selected</option>
              {brandProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.brandName}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Timezone"
              value={form.timezone}
              onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
            />

            {cadence === "weekly" ? (
              <label className="space-y-2 block">
                <div className="text-sm text-white/70">Day of Week</div>
                <select
                  value={form.dayOfWeek}
                  onChange={(event) => setForm((current) => ({ ...current, dayOfWeek: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="7">Sunday</option>
                </select>
              </label>
            ) : (
              <Input
                label="Day of Month"
                type="number"
                min={1}
                max={31}
                value={form.dayOfMonth}
                onChange={(event) => setForm((current) => ({ ...current, dayOfMonth: event.target.value }))}
              />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Hour"
              type="number"
              min={0}
              max={23}
              value={form.hour}
              onChange={(event) => setForm((current) => ({ ...current, hour: event.target.value }))}
            />
            <Input
              label="Minute"
              type="number"
              min={0}
              max={59}
              value={form.minute}
              onChange={(event) => setForm((current) => ({ ...current, minute: event.target.value }))}
            />
          </div>

          <Input
            label="Product / Offer Name"
            value={form.productName}
            onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
          />

          <Textarea
            label="Target Audience"
            rows={2}
            value={form.targetAudience}
            onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))}
          />

          <Textarea
            label="Offer Details"
            rows={2}
            value={form.offer}
            onChange={(event) => setForm((current) => ({ ...current, offer: event.target.value }))}
          />

          <Input
            label="CTA"
            value={form.cta}
            onChange={(event) => setForm((current) => ({ ...current, cta: event.target.value }))}
          />
        </div>
      </Modal>
    </AppShell>
  );
}

function automationCadence(type: Automation["type"]): "weekly" | "monthly" {
  return type === "monthly_campaign_ideas" ? "monthly" : "weekly";
}

function automationDescription(type: Automation["type"]) {
  switch (type) {
    case "weekly_content_plan":
      return "Runs a weekly content workflow for the selected campaign.";
    case "monthly_campaign_ideas":
      return "Generates a monthly set of campaign and promotional ideas.";
    case "weekly_task_recommendation":
      return "Suggests next-best marketing tasks for the week.";
    default:
      return "Scheduled marketing automation.";
  }
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-[0.18em] text-white/40 font-semibold">{title}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">{label}</div>
      <div className="mt-2 text-sm text-white/70">{value}</div>
    </div>
  );
}
