import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState, Input, Textarea } from "../ui/Primitives";
import { outputTypeLabels } from "../mock/data";
import { brandVoices, friendlyError, projects as projectsApi, type Project } from "../lib/apiClient";

export function ProjectDetailPage() {
  const { params, projects, products, outputs, navigate, updateProject, toast, mode } = useApp();
  const fallbackProject = projects.find((project) => project.id === params.projectId);
  const [liveProject, setLiveProject] = useState<Project | null>(null);
  const [brandProfiles, setBrandProfiles] = useState<Array<{ id: string; brandName: string }>>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const project = liveProject
    ? {
        id: liveProject.id,
        name: liveProject.name,
        niche: liveProject.niche ?? "—",
        emoji: liveProject.emoji ?? "✨",
        brandVoice: liveProject.brandVoice ?? undefined,
        campaignGoal: liveProject.campaignGoal ?? undefined,
        targetAudience: liveProject.targetAudience ?? undefined,
        offer: liveProject.offer ?? undefined,
        campaignStatus: liveProject.campaignStatus ?? "planning",
        launchDate: liveProject.launchDate,
        brandVoiceProfileId: liveProject.brandVoiceProfileId,
        brandVoiceProfile: liveProject.brandVoiceProfile
          ? {
              id: liveProject.brandVoiceProfile.id,
              brandName: liveProject.brandVoiceProfile.brandName,
            }
          : null,
        productCount: liveProject.products?.length ?? 0,
        outputCount: liveProject.outputs?.length ?? 0,
        workflowRunCount: liveProject.workflowRuns?.length ?? 0,
        chatCount: liveProject.chatConversations?.length ?? 0,
        automationCount: 0,
      }
    : fallbackProject;

  const [form, setForm] = useState({
    name: project?.name ?? "",
    niche: project?.niche ?? "",
    campaignGoal: project?.campaignGoal ?? "",
    targetAudience: project?.targetAudience ?? "",
    offer: project?.offer ?? "",
    campaignStatus: (project?.campaignStatus ?? "planning") as "planning" | "active" | "paused" | "completed",
    launchDate: project?.launchDate ? project.launchDate.slice(0, 10) : "",
    brandVoiceProfileId: project?.brandVoiceProfileId ?? "",
  });

  useEffect(() => {
    if (mode !== "live" || !params.projectId || typeof params.projectId !== "string") return;

    projectsApi
      .get(params.projectId)
      .then((response) => setLiveProject(response.project))
      .catch((error) => toast(friendlyError(error), "danger"));

    brandVoices
      .list()
      .then((response) =>
        setBrandProfiles(response.profiles.map((profile) => ({ id: profile.id, brandName: profile.brandName })))
      )
      .catch(() => setBrandProfiles([]));
  }, [mode, params.projectId, toast]);

  useEffect(() => {
    if (!project) return;

    setForm({
      name: project.name ?? "",
      niche: project.niche ?? "",
      campaignGoal: project.campaignGoal ?? "",
      targetAudience: project.targetAudience ?? "",
      offer: project.offer ?? "",
      campaignStatus: (project.campaignStatus ?? "planning") as typeof form.campaignStatus,
      launchDate: project.launchDate ? project.launchDate.slice(0, 10) : "",
      brandVoiceProfileId: project.brandVoiceProfileId ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const projectProducts = useMemo(
    () => liveProject?.products ?? products.filter((product) => product.projectId === project?.id),
    [liveProject?.products, products, project?.id]
  );

  const projectOutputs = useMemo(
    () => liveProject?.outputs ?? outputs.filter((output) => output.projectId === project?.id),
    [liveProject?.outputs, outputs, project?.id]
  );

  if (!project) {
    return (
      <AppShell title="Campaign Workspace" subtitle="Project not found.">
        <Card>
          <EmptyState
            icon="🗂️"
            title="Campaign workspace not found"
            description="Return to your campaign list and choose another workspace."
            action={<Button onClick={() => navigate("projects")}>← Back to campaigns</Button>}
          />
        </Card>
      </AppShell>
    );
  }

  const saveCampaign = async () => {
    setSaving(true);

    try {
      await updateProject(project.id, {
        name: form.name,
        niche: form.niche,
        campaignGoal: form.campaignGoal,
        targetAudience: form.targetAudience,
        offer: form.offer,
        campaignStatus: form.campaignStatus,
        launchDate: form.launchDate ? new Date(form.launchDate).toISOString() : "",
        brandVoiceProfileId: form.brandVoiceProfileId || null,
      });

      toast("Campaign workspace updated");
      setEditing(false);

      if (mode === "live") {
        const refreshed = await projectsApi.get(project.id);
        setLiveProject(refreshed.project);
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update campaign workspace", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title={`${project.emoji} ${project.name}`}
      subtitle="Campaign command center for strategy, outputs, chat, workflows, and automations."
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate("projects")}>
            ← Back
          </Button>
          <Button variant="secondary" onClick={() => navigate("chief-chat", { projectId: project.id })}>
            🧠 Chat
          </Button>
          <Button onClick={() => navigate("workflows", { projectId: project.id })}>🧩 Workflow</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge>{project.campaignStatus ?? "planning"}</Badge>
                {project.brandVoiceProfile ? <Badge>{project.brandVoiceProfile.brandName}</Badge> : null}
              </div>

              <h2 className="mt-4 text-xl font-semibold">Campaign Overview</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OverviewItem label="Goal" value={project.campaignGoal || "Add a campaign goal."} />
                <OverviewItem label="Audience" value={project.targetAudience || "Add a target audience."} />
                <OverviewItem label="Offer" value={project.offer || "Add the active offer."} />
                <OverviewItem
                  label="Launch"
                  value={project.launchDate ? new Date(project.launchDate).toLocaleDateString() : "No date set"}
                />
              </div>
            </div>

            <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
              {editing ? "Close Editor" : "Edit Campaign"}
            </Button>
          </div>

          {editing ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Campaign name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Input
                  label="Niche"
                  value={form.niche}
                  onChange={(event) => setForm((current) => ({ ...current, niche: event.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Textarea
                  label="Campaign goal"
                  rows={3}
                  value={form.campaignGoal}
                  onChange={(event) => setForm((current) => ({ ...current, campaignGoal: event.target.value }))}
                />
                <Textarea
                  label="Target audience"
                  rows={3}
                  value={form.targetAudience}
                  onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))}
                />
              </div>

              <Textarea
                label="Offer"
                rows={3}
                value={form.offer}
                onChange={(event) => setForm((current) => ({ ...current, offer: event.target.value }))}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <div className="text-sm text-white/70">Status</div>
                  <select
                    value={form.campaignStatus}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        campaignStatus: event.target.value as typeof current.campaignStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>

                <Input
                  label="Launch date"
                  type="date"
                  value={form.launchDate}
                  onChange={(event) => setForm((current) => ({ ...current, launchDate: event.target.value }))}
                />

                <label className="space-y-2">
                  <div className="text-sm text-white/70">Brand Voice Profile</div>
                  <select
                    value={form.brandVoiceProfileId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, brandVoiceProfileId: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="">None selected</option>
                    {brandProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.brandName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void saveCampaign()} loading={saving}>
                  Save Workspace
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <SectionHeader title="Saved Outputs" subtitle="Recent assets tied to this campaign." />

            {projectOutputs.length === 0 ? (
              <EmptyState
                icon="✨"
                title="No campaign outputs yet"
                description="Generate content directly or launch a workflow to populate this workspace."
                action={<Button onClick={() => navigate("new-task", { projectId: project.id })}>✨ Start a Task</Button>}
              />
            ) : (
              <div className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">
                {projectOutputs.slice(0, 8).map((output) => {
                  const meta = outputTypeLabels[output.type as keyof typeof outputTypeLabels];

                  return (
                    <button
                      type="button"
                      key={output.id}
                      onClick={() => navigate("saved-outputs", { outputId: output.id })}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition flex items-center gap-3"
                    >
                      <div>{meta?.icon ?? "✨"}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{output.title}</div>
                        <div className="truncate text-xs text-white/45">{meta?.label ?? output.type}</div>
                      </div>
                      <span className="text-white/35">→</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader
              title="Chief of Staff + Workflow Readiness"
              subtitle="Use project context to move from ideas to execution."
            />

            <div className="mt-4 grid gap-3">
              <ActionPanel
                title="Chat with this campaign context"
                description="Ask what is missing, what to market next, or how to sharpen the offer."
                button="Open Chat"
                onClick={() => navigate("chief-chat", { projectId: project.id })}
              />
              <ActionPanel
                title="Launch a marketing workflow"
                description="Turn the project strategy into a campaign launch, weekly content, or funnel workflow."
                button="Open Workflows"
                onClick={() => navigate("workflows", { projectId: project.id })}
              />
              <ActionPanel
                title="Prepare recurring automations"
                description="Recurring marketing tasks become more useful once your campaign context is complete."
                button="Open Automations"
                onClick={() => navigate("automations", { projectId: project.id })}
              />
            </div>
          </Card>
        </div>

        <Card>
          <SectionHeader
            title="Products / Offers"
            subtitle="Existing product records connected to this campaign workspace."
          />

          {projectProducts.length === 0 ? (
            <EmptyState
              icon="🛍️"
              title="No products connected"
              description="The existing product system is preserved. Add product records through your current product flow when needed."
            />
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {projectProducts.map((product) => (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{product.name}</div>
                    <Badge>{product.price ?? "Offer"}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/55">{product.description}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
                    <OverviewItem label="Audience" value={product.audience ?? "—"} />
                    <OverviewItem label="Pain" value={product.painPoint ?? "—"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">{label}</div>
      <div className="mt-2 text-sm text-white/75">{value}</div>
    </div>
  );
}

function ActionPanel({
  title,
  description,
  button,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm text-white/50">{description}</div>
      </div>
      <Button variant="secondary" onClick={onClick}>
        {button}
      </Button>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-white/45">{subtitle}</p> : null}
    </div>
  );
}
