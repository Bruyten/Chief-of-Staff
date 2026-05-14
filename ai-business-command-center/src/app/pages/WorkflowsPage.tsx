import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState, Input, Modal, Textarea } from "../ui/Primitives";
import {
  brandVoices,
  friendlyError,
  workflows,
  type BrandVoiceProfile,
  type WorkflowRun,
  type WorkflowTemplate,
} from "../lib/apiClient";

type WorkflowLaunchForm = {
  title: string;
  projectId: string;
  brandVoiceProfileId: string;
  productName: string;
  targetAudience: string;
  cta: string;
  offer: string;
  campaignGoal: string;
};

const EMPTY_FORM: WorkflowLaunchForm = {
  title: "",
  projectId: "",
  brandVoiceProfileId: "",
  productName: "",
  targetAudience: "",
  cta: "",
  offer: "",
  campaignGoal: "",
};

export function WorkflowsPage() {
  const { mode, params, projects, toast, navigate, user, setCreditsLocal } = useApp();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [brandProfiles, setBrandProfiles] = useState<BrandVoiceProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<WorkflowLaunchForm>({
    ...EMPTY_FORM,
    projectId: typeof params.projectId === "string" ? params.projectId : "",
  });

  useEffect(() => {
    if (mode === "mock") {
      setTemplates(MOCK_TEMPLATES);
      setRuns([]);
      setBrandProfiles([]);
      return;
    }

    void loadWorkflowData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function loadWorkflowData() {
    setLoading(true);

    try {
      const [templateResponse, runResponse, brandResponse] = await Promise.all([
        workflows.templates(),
        workflows.runs(),
        brandVoices.list(),
      ]);

      setTemplates(templateResponse.templates);
      setRuns(runResponse.runs);
      setBrandProfiles(brandResponse.profiles);
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  function openLaunch(template: WorkflowTemplate) {
    setSelectedTemplate(template);
    setForm((current) => ({
      ...EMPTY_FORM,
      projectId: current.projectId || (typeof params.projectId === "string" ? params.projectId : ""),
      title: template.name,
    }));
    setModalOpen(true);
  }

  function closeLaunch() {
    setModalOpen(false);
    setSelectedTemplate(null);
    setForm({
      ...EMPTY_FORM,
      projectId: typeof params.projectId === "string" ? params.projectId : "",
    });
  }

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId),
    [form.projectId, projects]
  );

  async function launchWorkflow() {
    if (!selectedTemplate || launching) return;

    setLaunching(true);

    try {
      const context = {
        productName: form.productName.trim(),
        targetAudience: form.targetAudience.trim(),
        cta: form.cta.trim(),
        offer: form.offer.trim(),
        campaignGoal: form.campaignGoal.trim(),
        projectName: selectedProject?.name ?? "",
      };

      if (mode === "mock") {
        const now = new Date().toISOString();

        const fakeRun: WorkflowRun = {
          id: `run_${Date.now()}`,
          userId: "u_demo",
          projectId: form.projectId || null,
          brandVoiceProfileId: form.brandVoiceProfileId || null,
          templateId: selectedTemplate.id,
          title: form.title.trim() || selectedTemplate.name,
          status: "completed",
          input: context,
          summary: null,
          creditsSpent: selectedTemplate.steps.length,
          startedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
          project: selectedProject
            ? {
                id: selectedProject.id,
                name: selectedProject.name,
                emoji: selectedProject.emoji ?? null,
              }
            : null,
          brandVoiceProfile: null,
          steps: selectedTemplate.steps.map((step, index) => ({
            id: `step_${Date.now()}_${index}`,
            workflowRunId: `run_${Date.now()}`,
            outputId: null,
            stepKey: step.key,
            stepLabel: step.label,
            skill: step.skill,
            status: "done",
            input: context,
            content: `Mock workflow result for ${step.label}.`,
            tokensUsed: 0,
            errorMsg: null,
            startedAt: now,
            completedAt: now,
            createdAt: now,
            updatedAt: now,
            output: null,
          })),
        };

        setRuns((current) => [fakeRun, ...current]);
        setCreditsLocal(Math.max(user.credits - selectedTemplate.steps.length, 0));
        toast("Mock workflow completed");
        closeLaunch();
        navigate("workflow-run", { workflowRunId: fakeRun.id });
        return;
      }

      const response = await workflows.createRun({
        templateId: selectedTemplate.id,
        title: form.title.trim() || undefined,
        projectId: form.projectId || null,
        brandVoiceProfileId: form.brandVoiceProfileId || null,
        context,
      });

      setRuns((current) => [response.run, ...current]);
      setCreditsLocal(Math.max(user.credits - response.run.creditsSpent, 0));
      toast("Workflow completed");
      closeLaunch();
      navigate("workflow-run", { workflowRunId: response.run.id });
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <AppShell
      title="Workflows"
      subtitle="Chain existing marketing generators into repeatable campaign systems."
      action={<Badge>{user.credits} text credits available</Badge>}
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Workflow Templates</h2>
              <p className="mt-1 text-sm text-white/50">
                Each workflow runs step-by-step, saves useful outputs, and handles partial failures gracefully.
              </p>
            </div>
            <Badge>Launchable MVP</Badge>
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="text-sm text-white/55">Loading workflows…</div>
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <EmptyState
              icon="🧩"
              title="No workflow templates available"
              description="Templates will appear here once the workflow registry is available."
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="mt-2 text-sm text-white/55">{template.description}</p>
                  </div>
                  <Badge>{template.steps.length} steps</Badge>
                </div>

                <div className="mt-5 space-y-2">
                  {template.steps.map((step, index) => (
                    <div key={step.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                      <span className="text-white/40">{index + 1}.</span> {step.label}
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <Button className="w-full" onClick={() => openLaunch(template)}>
                    Launch Workflow
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent Workflow Runs</h2>
              <p className="mt-1 text-sm text-white/50">Review completed and partially completed workflow results.</p>
            </div>
            <Badge>{runs.length}</Badge>
          </div>

          {runs.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon="🗂️"
                title="No workflow runs yet"
                description="Launch your first workflow above to build campaign assets in sequence."
              />
            </div>
          ) : (
            <div className="mt-5 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">
              {runs.map((run) => (
                <button
                  type="button"
                  key={run.id}
                  onClick={() => navigate("workflow-run", { workflowRunId: run.id })}
                  className="w-full p-4 text-left hover:bg-white/[0.03] transition flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium">{run.title}</div>
                    <div className="mt-1 text-xs text-white/45">
                      {run.project?.name ?? "No project"} · {run.templateId} · {run.creditsSpent} credits spent
                    </div>
                  </div>
                  <Badge>{run.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeLaunch}
        title={selectedTemplate ? `Launch: ${selectedTemplate.name}` : "Launch Workflow"}
        footer={
          <>
            <Button variant="secondary" onClick={closeLaunch}>
              Cancel
            </Button>
            <Button loading={launching} onClick={() => void launchWorkflow()}>
              Run Workflow
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Optional run title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="e.g. Spring Product Launch"
          />

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

          <Input
            label="Product / offer name"
            value={form.productName}
            onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
            placeholder="e.g. Glow Serum Bundle"
          />

          <Textarea
            label="Target audience"
            rows={3}
            value={form.targetAudience}
            onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))}
            placeholder="Who is this campaign for?"
          />

          <Textarea
            label="Offer details"
            rows={3}
            value={form.offer}
            onChange={(event) => setForm((current) => ({ ...current, offer: event.target.value }))}
            placeholder="What makes this offer compelling?"
          />

          <Textarea
            label="Campaign goal"
            rows={3}
            value={form.campaignGoal}
            onChange={(event) => setForm((current) => ({ ...current, campaignGoal: event.target.value }))}
            placeholder="What should this workflow accomplish?"
          />

          <Input
            label="CTA"
            value={form.cta}
            onChange={(event) => setForm((current) => ({ ...current, cta: event.target.value }))}
            placeholder="e.g. Start the free trial"
          />
        </div>
      </Modal>
    </AppShell>
  );
}

const MOCK_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "campaign_launch",
    name: "Campaign Launch Workflow",
    description: "Create launch angle, hooks, scripts, promo copy, and a rollout plan.",
    requiredInputs: ["productName", "targetAudience", "cta"],
    steps: [
      { key: "campaign_angle", label: "Offer / campaign angle", skill: "campaign_angle", outputTitle: "Campaign Angle" },
      { key: "hook_ideas", label: "Hook ideas", skill: "hook_generator", outputTitle: "Campaign Hooks" },
      { key: "short_form_scripts", label: "Short-form script ideas", skill: "tiktok_script", outputTitle: "Script Ideas" },
      { key: "promo_email", label: "Promotional email asset", skill: "email_promo", outputTitle: "Promo Email" },
      { key: "launch_plan", label: "Launch plan", skill: "workflow_publishing_sequence", outputTitle: "Launch Plan" },
    ],
  },
  {
    id: "weekly_content",
    name: "Weekly Content Workflow",
    description: "Create the weekly focus, content ideas, email touchpoint, and publishing sequence.",
    requiredInputs: ["productName", "targetAudience", "cta"],
    steps: [
      { key: "weekly_focus", label: "Weekly marketing focus", skill: "workflow_weekly_marketing_focus", outputTitle: "Weekly Focus" },
      { key: "social_ideas", label: "Social post ideas", skill: "social_post_ideas", outputTitle: "Social Ideas" },
      { key: "short_form_ideas", label: "Short-form ideas", skill: "tiktok_script", outputTitle: "Short-form Ideas" },
      { key: "email_touchpoint", label: "Email touchpoint", skill: "email_promo", outputTitle: "Email Touchpoint" },
      { key: "publishing_sequence", label: "Publishing sequence", skill: "workflow_publishing_sequence", outputTitle: "Publishing Sequence" },
    ],
  },
  {
    id: "lead_magnet_funnel",
    name: "Lead Magnet Funnel Workflow",
    description: "Build a lead magnet concept, landing angle, welcome sequence, and promo hooks.",
    requiredInputs: ["productName", "targetAudience"],
    steps: [
      { key: "lead_magnet_idea", label: "Lead magnet idea", skill: "lead_magnet_idea", outputTitle: "Lead Magnet Idea" },
      { key: "landing_page_angle", label: "Landing page angle", skill: "landing_page_copy", outputTitle: "Landing Page Angle" },
      { key: "welcome_sequence", label: "Welcome email sequence", skill: "email_sequence", outputTitle: "Welcome Sequence" },
      { key: "promo_hooks", label: "Promo hooks", skill: "hook_generator", outputTitle: "Promo Hooks" },
    ],
  },
];
