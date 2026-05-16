import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Textarea,
} from "../ui/Primitives";
import {
  automations,
  brandVoices,
  friendlyError,
  type Automation,
  type AutomationCadence,
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
  campaignGoal: string;
  researchKeywords: string;
  redditSubreddits: string;
  researchLocationCode: string;
  researchLanguageCode: string;
  researchTimeRange: string;
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
  campaignGoal: "",
  researchKeywords: "",
  redditSubreddits: "",
  researchLocationCode: "2840",
  researchLanguageCode: "en",
  researchTimeRange: "past_7_days",
};

export function AutomationsPage() {
  const { mode, params, projects, toast } = useApp();

  const [items, setItems] = useState<Automation[]>([]);
  const [brandProfiles, setBrandProfiles] = useState<BrandVoiceProfile[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<AutomationForm>({
    ...EMPTY_FORM,
    projectId:
      typeof params.projectId === "string" ? params.projectId : "",
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
      projectId:
        typeof params.projectId === "string" ? params.projectId : "",
    });
    setModalOpen(true);
  }

  function closeCreate() {
    setModalOpen(false);
    setForm({
      ...EMPTY_FORM,
      projectId:
        typeof params.projectId === "string" ? params.projectId : "",
    });
  }

  const cadence = automationCadence(form.type);
  const isDailyTrendResearch = form.type === "daily_trend_research";

  async function createAutomation() {
    if (!form.name.trim() || saving) {
      return;
    }

    if (
      isDailyTrendResearch &&
      !form.researchKeywords.trim() &&
      !form.productName.trim()
    ) {
      toast(
        "Add at least one research keyword or a product name before creating trend research automation.",
        "danger",
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        projectId: form.projectId || null,
        brandVoiceProfileId: form.brandVoiceProfileId || null,
        timezone: form.timezone.trim() || "UTC",
        dayOfWeek:
          cadence === "weekly" ? Number(form.dayOfWeek) : null,
        dayOfMonth:
          cadence === "monthly" ? Number(form.dayOfMonth) : null,
        hour: Number(form.hour),
        minute: Number(form.minute),
        config: {
          productName: form.productName.trim(),
          targetAudience: form.targetAudience.trim(),
          offer: form.offer.trim(),
          cta: form.cta.trim(),
          campaignGoal: form.campaignGoal.trim(),
          researchKeywords: form.researchKeywords.trim(),
          redditSubreddits: form.redditSubreddits.trim(),
          researchLocationCode:
            form.researchLocationCode.trim() || "2840",
          researchLanguageCode:
            form.researchLanguageCode.trim() || "en",
          researchTimeRange:
            form.researchTimeRange.trim() || "past_7_days",
        },
      };

      if (mode === "mock") {
        const now = new Date().toISOString();
        const matchedProject = projects.find(
          (project) => project.id === payload.projectId,
        );

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
          project: matchedProject
            ? {
                id: matchedProject.id,
                name: matchedProject.name,
                emoji: matchedProject.emoji ?? null,
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
            entry.id === item.id
              ? {
                  ...entry,
                  enabled: !entry.enabled,
                }
              : entry,
          ),
        );

        toast(
          item.enabled ? "Automation disabled" : "Automation enabled",
          "info",
        );
        return;
      }

      const response = item.enabled
        ? await automations.disable(item.id)
        : await automations.enable(item.id);

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? response.automation : entry,
        ),
      );

      toast(
        item.enabled ? "Automation disabled" : "Automation enabled",
        "info",
      );
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

    if (!confirmed) {
      return;
    }

    try {
      if (mode === "live") {
        await automations.delete(item.id);
      }

      setItems((current) =>
        current.filter((entry) => entry.id !== item.id),
      );
      toast("Automation deleted", "info");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  const enabledCount = useMemo(
    () => items.filter((item) => item.enabled).length,
    [items],
  );

  return (
    <AppShell
      title="Automations"
      eyebrow="Recurring Revenue Operations"
      actions={<Button onClick={openCreate}>+ New Automation</Button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Automations" value={items.length} />
        <Metric title="Enabled" value={enabledCount} />
        <Metric
          title="Daily Research"
          value={
            items.filter(
              (item) => item.type === "daily_trend_research",
            ).length
          }
        />
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-white">
          Practical MVP Scope
        </h2>
        <p className="mt-2 text-sm text-white/65">
          This is intentionally not a drag-and-drop Zapier clone. It schedules
          repeatable marketing work, including daily trend research briefs that
          can help users spot what to promote and create next.
        </p>
      </Card>

      {loading ? (
        <Card>
          <div className="text-sm text-white/65">
            Loading automations…
          </div>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="No automations yet"
          body="Create a scheduled marketing automation to reduce manual recurring work."
          action={<Button onClick={openCreate}>+ Create Automation</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">
                      {item.name}
                    </h2>

                    <Badge tone={item.enabled ? "emerald" : "slate"}>
                      {item.enabled ? "enabled" : "disabled"}
                    </Badge>

                    <Badge tone="violet">{item.cadence}</Badge>

                    {item.type === "daily_trend_research" ? (
                      <Badge tone="amber">Trend Research</Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm text-white/65">
                    {automationDescription(item.type)}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Info
                      label="Next Run"
                      value={formatDate(item.nextRunAt)}
                    />
                    <Info
                      label="Last Run"
                      value={formatDate(item.lastRunAt)}
                    />
                    <Info
                      label="Last Status"
                      value={item.lastStatus ?? "—"}
                    />
                  </div>

                  {item.lastError ? (
                    <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                      {item.lastError}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void toggleAutomation(item)}
                  >
                    {item.enabled ? "Disable" : "Enable"}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => void runNow(item)}
                  >
                    Run Now
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => void deleteAutomation(item)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeCreate}
        title="Create Automation"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              onClick={() => void createAutomation()}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create Automation"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Automation Name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="e.g. Daily Trend Research - The Simple Digital Path"
            autoFocus
          />

          <div className="space-y-2">
            <div className="text-sm font-medium text-white/75">
              Automation Type
            </div>

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
              <option value="daily_trend_research">
                Daily Trend Research Automation
              </option>
              <option value="weekly_content_plan">
                Weekly Content Plan
              </option>
              <option value="monthly_campaign_ideas">
                Monthly Campaign Ideas
              </option>
              <option value="weekly_task_recommendation">
                Weekly Marketing Task Recommendation
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-white/75">
              Project / Campaign
            </div>

            <select
              value={form.projectId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  projectId: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">No project selected</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.emoji ? `${project.emoji} ` : ""}
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-white/75">
              Brand Voice Profile
            </div>

            <select
              value={form.brandVoiceProfileId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  brandVoiceProfileId: event.target.value,
                }))
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
          </div>

          <Input
            label="Timezone"
            value={form.timezone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                timezone: event.target.value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            {cadence === "weekly" ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-white/75">
                  Day of Week
                </div>

                <select
                  value={form.dayOfWeek}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dayOfWeek: event.target.value,
                    }))
                  }
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
              </div>
            ) : cadence === "monthly" ? (
              <Input
                label="Day of Month"
                value={form.dayOfMonth}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dayOfMonth: event.target.value,
                  }))
                }
              />
            ) : (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-50/80">
                Daily automations run every day at the selected time.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hour"
                value={form.hour}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hour: event.target.value,
                  }))
                }
              />

              <Input
                label="Minute"
                value={form.minute}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minute: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Input
            label="Product / Item"
            value={form.productName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                productName: event.target.value,
              }))
            }
            placeholder="e.g. The Simple Digital Path"
          />

          <Input
            label="Target Audience"
            value={form.targetAudience}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                targetAudience: event.target.value,
              }))
            }
            placeholder="Who is this automation focused on?"
          />

          <Textarea
            label="Offer Details"
            rows={2}
            value={form.offer}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                offer: event.target.value,
              }))
            }
            placeholder="The offer, lead magnet, product, course, or affiliate angle."
          />

          <Textarea
            label="Campaign Goal"
            rows={2}
            value={form.campaignGoal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                campaignGoal: event.target.value,
              }))
            }
            placeholder="What should the automation help create, decide, or push?"
          />

          <Input
            label="CTA"
            value={form.cta}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                cta: event.target.value,
              }))
            }
            placeholder="e.g. Download the free guide"
          />

          {isDailyTrendResearch ? (
            <div className="space-y-5 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4">
              <div>
                <Badge tone="amber">Trend Research Configuration</Badge>
                <p className="mt-3 text-sm text-amber-50/80">
                  This automation collects trend/search signals on a schedule,
                  then turns them into a saved opportunity brief and action
                  plan.
                </p>
              </div>

              <Textarea
                label="Research Keywords"
                rows={4}
                value={form.researchKeywords}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    researchKeywords: event.target.value,
                  }))
                }
                placeholder={`One per line or comma-separated:
beginner digital products
how to start selling digital products
passive income templates
low cost online business ideas`}
              />

              <Textarea
                label="Reddit Subreddits"
                rows={3}
                value={form.redditSubreddits}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    redditSubreddits: event.target.value,
                  }))
                }
                placeholder={`Optional, one per line:
Entrepreneur
sidehustle
digitalproducts`}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Location Code"
                  value={form.researchLocationCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      researchLocationCode: event.target.value,
                    }))
                  }
                  placeholder="2840"
                />

                <Input
                  label="Language Code"
                  value={form.researchLanguageCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      researchLanguageCode: event.target.value,
                    }))
                  }
                  placeholder="en"
                />

                <div className="space-y-2">
                  <div className="text-sm font-medium text-white/75">
                    Research Window
                  </div>

                  <select
                    value={form.researchTimeRange}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        researchTimeRange: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="past_day">Past day</option>
                    <option value="past_7_days">Past 7 days</option>
                    <option value="past_30_days">Past 30 days</option>
                    <option value="past_90_days">Past 90 days</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </AppShell>
  );
}

function automationCadence(
  type: Automation["type"],
): AutomationCadence {
  if (type === "daily_trend_research") {
    return "daily";
  }

  if (type === "monthly_campaign_ideas") {
    return "monthly";
  }

  return "weekly";
}

function automationDescription(type: Automation["type"]) {
  switch (type) {
    case "daily_trend_research":
      return "Runs daily trend and opportunity research, then saves a market brief, monetization angles, and today's action plan.";
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

function Metric({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <Card>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
        {title}
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </Card>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-2 text-sm text-white/70">{value}</div>
    </div>
  );
}
