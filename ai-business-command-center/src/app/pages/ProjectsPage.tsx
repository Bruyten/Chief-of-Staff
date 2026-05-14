import { useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState, Input, Modal, Textarea } from "../ui/Primitives";

export function ProjectsPage() {
  const { projects, navigate, createProject, toast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    niche: "",
    emoji: "✨",
    campaignGoal: "",
    targetAudience: "",
    offer: "",
    campaignStatus: "planning" as "planning" | "active" | "paused" | "completed",
    launchDate: "",
  });

  const onCreate = async () => {
    if (!form.name.trim() || creating) return;
    setCreating(true);

    try {
      const project = await createProject({
        name: form.name,
        niche: form.niche,
        emoji: form.emoji,
        campaignGoal: form.campaignGoal,
        targetAudience: form.targetAudience,
        offer: form.offer,
        campaignStatus: form.campaignStatus,
        launchDate: form.launchDate ? new Date(form.launchDate).toISOString() : undefined,
      });

      setForm({
        name: "",
        niche: "",
        emoji: "✨",
        campaignGoal: "",
        targetAudience: "",
        offer: "",
        campaignStatus: "planning",
        launchDate: "",
      });

      setModalOpen(false);
      toast("Campaign workspace created");
      navigate("project-detail", { projectId: project.id });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not create campaign workspace", "danger");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell
      title="Campaign Workspaces"
      subtitle="Projects now act as campaign command centers for strategy, outputs, workflows, and automations."
      action={<Button onClick={() => setModalOpen(true)}>+ New Campaign</Button>}
    >
      {projects.length === 0 ? (
        <Card>
          <EmptyState
            icon="🗂️"
            title="No campaign workspaces yet"
            description="Create one to organize strategy, saved outputs, workflows, and future automations."
            action={<Button onClick={() => setModalOpen(true)}>+ Create your first campaign</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <button
              type="button"
              key={project.id}
              onClick={() => navigate("project-detail", { projectId: project.id })}
              className="text-left"
            >
              <Card className="h-full hover:border-violet-400/30 hover:bg-white/[0.05] transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-2xl">{project.emoji}</div>
                  <Badge>{project.campaignStatus ?? "planning"}</Badge>
                </div>

                <div className="mt-4 text-xs uppercase tracking-[0.18em] text-white/40 font-semibold">
                  {project.niche}
                </div>
                <div className="mt-2 text-lg font-semibold">{project.name}</div>

                {project.campaignGoal ? (
                  <p className="mt-3 text-sm text-white/55 line-clamp-3">{project.campaignGoal}</p>
                ) : (
                  <p className="mt-3 text-sm text-white/35">No campaign goal added yet.</p>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <Metric label="Outputs" value={project.outputCount} />
                  <Metric label="Runs" value={project.workflowRunCount ?? 0} />
                  <Metric label="Autos" value={project.automationCount ?? 0} />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Campaign Workspace"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onCreate()} loading={creating}>
              Create campaign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="text-sm text-white/70 mb-2">Emoji</div>
            <div className="flex flex-wrap gap-2">
              {["✨", "🚀", "🎯", "💸", "📣", "🧠", "🛍️", "🎥", "🌱"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, emoji }))}
                  className={
                    "w-10 h-10 rounded-xl border text-lg grid place-items-center transition " +
                    (emoji === form.emoji
                      ? "bg-white/10 border-white/30"
                      : "bg-white/[0.02] border-white/10 hover:bg-white/5")
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Campaign name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Spring Serum Launch"
            autoFocus
          />

          <Input
            label="Niche / business type"
            value={form.niche}
            onChange={(event) => setForm((current) => ({ ...current, niche: event.target.value }))}
            placeholder="e.g. Beauty / DTC"
          />

          <Textarea
            label="Campaign goal"
            rows={2}
            value={form.campaignGoal}
            onChange={(event) => setForm((current) => ({ ...current, campaignGoal: event.target.value }))}
            placeholder="What does this campaign need to accomplish?"
          />

          <Textarea
            label="Target audience"
            rows={2}
            value={form.targetAudience}
            onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))}
            placeholder="Who is this campaign for?"
          />

          <Textarea
            label="Offer"
            rows={2}
            value={form.offer}
            onChange={(event) => setForm((current) => ({ ...current, offer: event.target.value }))}
            placeholder="What are you promoting?"
          />

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-black/20 px-2 py-2">
      <div className="text-white font-semibold">{value}</div>
      <div className="text-white/40 mt-0.5">{label}</div>
    </div>
  );
}
