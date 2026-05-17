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
  researchKeywords: string;
  redditSubreddits: string;
  researchLocationCode: string;
  researchLanguageCode: string;
  researchTimeRange: string;
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
  researchKeywords: "",
  redditSubreddits: "",
  researchLocationCode: "2840",
  researchLanguageCode: "en",
  researchTimeRange: "past_7_days",
};

export function WorkflowsPage() {
  const {
    mode,
    params,
    projects,
    toast,
    navigate,
    user,
    setCreditsLocal,
  } = useApp();

  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [brandProfiles, setBrandProfiles] = useState<BrandVoiceProfile[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkflowTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<WorkflowLaunchForm>({
    ...EMPTY_FORM,
    projectId:
      typeof params.projectId === "string" ? params.projectId : "",
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
      const [templateResponse, runResponse, brandResponse] =
        await Promise.all([
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
      projectId:
        current.projectId ||
        (typeof params.projectId === "string" ? params.projectId : ""),
      title: template.name,
    }));

    setModalOpen(true);
  }

  function closeLaunch() {
    setModalOpen(false);
    setSelectedTemplate(null);

    setForm({
      ...EMPTY_FORM,
      projectId:
        typeof params.projectId === "string" ? params.projectId : "",
    });
  }

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId),
    [form.projectId, projects],
  );

  const isResearchDrivenWorkflow =
    selectedTemplate?.id === "daily_trend_research" ||
    selectedTemplate?.id === "daily_product_opportunity_engine";

  async function launchWorkflow() {
    if (!selectedTemplate || launching) {
      return;
    }

    if (
      isResearchDrivenWorkflow &&
      !form.researchKeywords.trim() &&
      !form.productName.trim()
    ) {
      toast(
        "Add at least one research keyword or a product name before running this research workflow.",
        "danger",
      );
      return;
    }

    setLaunching(true);

    try {
      const context = {
        productName: form.productName.trim(),
        targetAudience: form.targetAudience.trim(),
        cta: form.cta.trim(),
        offer: form.offer.trim(),
        campaignGoal: form.campaignGoal.trim(),
        projectName: selectedProject?.name ?? "",
        researchKeywords: form.researchKeywords.trim(),
        redditSubreddits: form.redditSubreddits.trim(),
        researchLocationCode: form.researchLocationCode.trim() || "2840",
        researchLanguageCode: form.researchLanguageCode.trim() || "en",
        researchTimeRange: form.researchTimeRange.trim() || "past_7_days",
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
        setCreditsLocal(
          Math.max(user.credits - selectedTemplate.steps.length, 0),
        );
        toast("Mock workflow completed");
        closeLaunch();
        navigate("workflow-run", {
          workflowRunId: fakeRun.id,
        });
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
      setCreditsLocal(
        Math.max(user.credits - response.run.creditsSpent, 0),
      );
      toast("Workflow completed");
      closeLaunch();
      navigate("workflow-run", {
        workflowRunId: response.run.id,
      });
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <AppShell
      title="Workflows"
      eyebrow="Sequential Business Output"
      actions={<Badge tone="violet">{user.credits} text credits available</Badge>}
    >
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Workflow Templates
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Each workflow runs step-by-step, saves useful outputs, and
              handles partial failures gracefully.
            </p>
          </div>

          <Badge tone="emerald">Launchable MVP</Badge>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="text-sm text-white/65">Loading workflows…</div>
        </Card>
      ) : templates.length === 0 ? (
        <EmptyState
          title="No workflow templates found"
          body="The workflow engine is ready, but no templates are currently available."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <div className="flex h-full flex-col">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {template.name}
                    </h3>

                    {template.id === "daily_trend_research" ? (
                      <Badge tone="amber">Research + Revenue</Badge>
                    ) : null}

                    {template.id === "daily_product_opportunity_engine" ? (
                      <Badge tone="emerald">Product Opportunity Engine</Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm text-white/65">
                    {template.description}
                  </p>

                  <div className="mt-4">
                    <Badge tone="slate">
                      {template.steps.length} steps
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    {template.steps.map((step, index) => (
                      <div
                        key={step.key}
                        className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70"
                      >
                        <span className="mr-2 text-white/40">
                          {index + 1}.
                        </span>
                        {step.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <Button onClick={() => openLaunch(template)}>
                    Launch Workflow
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Recent Workflow Runs
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Review completed and partially completed workflow results.
            </p>
          </div>

          <Badge tone="slate">{runs.length}</Badge>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          {runs.length === 0 ? (
            <div className="p-5 text-sm text-white/55">
              No workflow runs yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() =>
                    navigate("workflow-run", {
                      workflowRunId: run.id,
                    })
                  }
                  className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium text-white">{run.title}</div>
                    <div className="mt-1 text-sm text-white/55">
                      {run.project?.name ?? "No project"} · {run.templateId} ·{" "}
                      {run.creditsSpent} credits spent
                    </div>
                  </div>

                  <Badge tone="violet">{run.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeLaunch}
        title={
          selectedTemplate
            ? `Run ${selectedTemplate.name}`
            : "Run Workflow"
        }
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeLaunch}>
              Cancel
            </Button>
            <Button
              onClick={() => void launchWorkflow()}
              disabled={launching}
            >
              {launching ? "Running…" : "Run Workflow"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Workflow Run Title"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="e.g. The Simple Digital Path Daily Product Opportunity Engine"
            autoFocus
          />

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
            label="Product / Item"
            value={form.productName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                productName: event.target.value,
              }))
            }
            placeholder="Optional for Product Opportunity Engine; useful for product-specific research."
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
            placeholder="Who is this for?"
          />

          <Textarea
            label="Offer Details"
            rows={3}
            value={form.offer}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                offer: event.target.value,
              }))
            }
            placeholder="What product, freebie, affiliate item, or program should this connect back to?"
          />

          <Textarea
            label="Campaign Goal"
            rows={3}
            value={form.campaignGoal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                campaignGoal: event.target.value,
              }))
            }
            placeholder="What should this workflow help you decide, create, or promote?"
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

          {isResearchDrivenWorkflow ? (
            <div className="space-y-5 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4">
              <div>
                <Badge tone="amber">Research Inputs</Badge>
                <p className="mt-3 text-sm text-amber-50/80">
                  These settings control the research source queries before the
                  AI turns findings into trends, product opportunities, and
                  revenue actions.
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

const MOCK_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "daily_trend_research",
    name: "Daily Trend & Opportunity Research",
    description:
      "Research daily search and community signals, then turn them into revenue-relevant content and campaign recommendations.",
    requiredInputs: [
      "productName",
      "targetAudience",
      "researchKeywords",
    ],
    steps: [
      {
        key: "trend_digest",
        label: "Trend signal digest",
        skill: "daily_trend_research_digest",
        outputTitle: "Daily Trend Signal Digest",
      },
      {
        key: "monetization_angles",
        label: "Revenue and offer opportunities",
        skill: "daily_trend_research_monetization_angles",
        outputTitle: "Daily Trend Monetization Angles",
      },
      {
        key: "daily_action_plan",
        label: "Today's content and campaign actions",
        skill: "daily_trend_research_action_plan",
        outputTitle: "Daily Trend Action Plan",
      },
    ],
  },
  {
    id: "daily_product_opportunity_engine",
    name: "Daily Product Opportunity Engine",
    description:
      "Research current demand signals, scan the Product Library, recommend what to promote, detect missing products worth creating, and generate video concepts.",
    requiredInputs: ["targetAudience", "researchKeywords"],
    steps: [
      {
        key: "existing_product_matches",
        label: "Best existing products to promote",
        skill: "daily_product_existing_match",
        outputTitle: "Best Products to Promote Today",
      },
      {
        key: "missing_product_gaps",
        label: "Missing products worth creating",
        skill: "daily_product_gap_detector",
        outputTitle: "Missing Product Opportunities",
      },
      {
        key: "daily_promotion_plan",
        label: "Daily promotion plan",
        skill: "daily_product_promotion_plan",
        outputTitle: "Daily Product Promotion Plan",
      },
      {
        key: "video_concepts",
        label: "Video concepts and prompts",
        skill: "daily_product_video_concepts",
        outputTitle: "Daily Product Video Concepts",
      },
    ],
  },
  {
    id: "campaign_launch",
    name: "Campaign Launch Workflow",
    description:
      "Create launch angle, hooks, scripts, promo copy, and a rollout plan.",
    requiredInputs: ["productName", "targetAudience", "cta"],
    steps: [
      {
        key: "campaign_angle",
        label: "Offer / campaign angle",
        skill: "campaign_angle",
        outputTitle: "Campaign Angle",
      },
      {
        key: "hook_ideas",
        label: "Hook ideas",
        skill: "hook_generator",
        outputTitle: "Campaign Hooks",
      },
      {
        key: "short_form_scripts",
        label: "Short-form script ideas",
        skill: "tiktok_script",
        outputTitle: "Script Ideas",
      },
      {
        key: "promo_email",
        label: "Promotional email asset",
        skill: "email_promo",
        outputTitle: "Promo Email",
      },
      {
        key: "launch_plan",
        label: "Launch plan",
        skill: "workflow_publishing_sequence",
        outputTitle: "Launch Plan",
      },
    ],
  },
  {
    id: "weekly_content",
    name: "Weekly Content Workflow",
    description:
      "Create the weekly focus, content ideas, email touchpoint, and publishing sequence.",
    requiredInputs: ["productName", "targetAudience", "cta"],
    steps: [
      {
        key: "weekly_focus",
        label: "Weekly marketing focus",
        skill: "workflow_weekly_marketing_focus",
        outputTitle: "Weekly Focus",
      },
      {
        key: "social_ideas",
        label: "Social post ideas",
        skill: "social_post_ideas",
        outputTitle: "Social Ideas",
      },
      {
        key: "short_form_ideas",
        label: "Short-form ideas",
        skill: "tiktok_script",
        outputTitle: "Short-form Ideas",
      },
      {
        key: "email_touchpoint",
        label: "Email touchpoint",
        skill: "email_promo",
        outputTitle: "Email Touchpoint",
      },
      {
        key: "publishing_sequence",
        label: "Publishing sequence",
        skill: "workflow_publishing_sequence",
        outputTitle: "Publishing Sequence",
      },
    ],
  },
  {
    id: "lead_magnet_funnel",
    name: "Lead Magnet Funnel Workflow",
    description:
      "Build a lead magnet concept, landing angle, welcome sequence, and promo hooks.",
    requiredInputs: ["productName", "targetAudience"],
    steps: [
      {
        key: "lead_magnet_idea",
        label: "Lead magnet idea",
        skill: "lead_magnet_idea",
        outputTitle: "Lead Magnet Idea",
      },
      {
        key: "landing_page_angle",
        label: "Landing page angle",
        skill: "landing_page_copy",
        outputTitle: "Landing Page Angle",
      },
      {
        key: "welcome_sequence",
        label: "Welcome email sequence",
        skill: "email_sequence",
        outputTitle: "Welcome Sequence",
      },
      {
        key: "promo_hooks",
        label: "Promo hooks",
        skill: "hook_generator",
        outputTitle: "Promo Hooks",
      },
    ],
  },
];
