import { useEffect, useMemo, useState } from "react";

import { useApp } from "../AppContext";
import { useUnlimitedAccess } from "../lib/useUnlimitedAccess";
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
  friendlyError,
  videoStudio,
  workflows,
  type VideoJob,
  type WorkflowRun,
} from "../lib/apiClient";

type VideoStudioForm = {
  title: string;
  sourceType: VideoJob["sourceType"];
  projectId: string;
  sourceOutputId: string;
  sourceWorkflowRunId: string;
  useCase: VideoJob["useCase"];
  aspectRatio: VideoJob["aspectRatio"];
  durationSeconds: VideoJob["durationSeconds"];
  toneStyle: string;
  cta: string;
};

const EMPTY_FORM: VideoStudioForm = {
  title: "",
  sourceType: "scratch",
  projectId: "",
  sourceOutputId: "",
  sourceWorkflowRunId: "",
  useCase: "promo_ad",
  aspectRatio: "9:16",
  durationSeconds: 8,
  toneStyle:
    "Polished, premium, conversion-focused short-form marketing video.",
  cta: "",
};

export function VideoStudioPage() {
  const {
    mode,
    user,
    projects,
    outputs,
    toast,
    setCreditsLocal,
  } = useApp();

  const unlimitedAccess = useUnlimitedAccess(mode);

  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<VideoStudioForm>(EMPTY_FORM);

  useEffect(() => {
    if (mode === "mock") {
      setJobs([]);
      setWorkflowRuns([]);
      return;
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function loadData() {
    setLoading(true);

    try {
      const [jobResponse, workflowResponse] = await Promise.all([
        videoStudio.jobs(),
        workflows.runs(),
      ]);

      setJobs(jobResponse.jobs);
      setWorkflowRuns(workflowResponse.runs);
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function closeCreate() {
    setModalOpen(false);
    setForm(EMPTY_FORM);
  }

  const selectedProjectOutputs = useMemo(
    () =>
      outputs.filter(
        (output) =>
          !form.projectId || output.projectId === form.projectId,
      ),
    [form.projectId, outputs],
  );

  const selectedProjectWorkflowRuns = useMemo(
    () =>
      workflowRuns.filter(
        (run) =>
          !form.projectId || run.projectId === form.projectId,
      ),
    [form.projectId, workflowRuns],
  );

  const ownerUnlimited = unlimitedAccess.unlimited;
  const videoLocked = !ownerUnlimited && user.videoCreditsMax <= 0;

  const videoCreditLabel = ownerUnlimited
    ? "Owner / Unlimited"
    : `${user.videoCredits} / ${user.videoCreditsMax} video credits`;

  async function createJob() {
    if (!form.title.trim() || creating || videoLocked) {
      return;
    }

    setCreating(true);

    try {
      const payload = {
        title: form.title.trim(),
        sourceType: form.sourceType,
        projectId: form.projectId || null,
        sourceOutputId: form.sourceOutputId || null,
        sourceWorkflowRunId: form.sourceWorkflowRunId || null,
        useCase: form.useCase,
        aspectRatio: form.aspectRatio,
        durationSeconds: form.durationSeconds,
        toneStyle: form.toneStyle.trim(),
        cta: form.cta.trim() || undefined,
      };

      if (mode === "mock") {
        const now = new Date().toISOString();
        const selectedProject = projects.find(
          (project) => project.id === payload.projectId,
        );

        const job: VideoJob = {
          id: `video_${Date.now()}`,
          userId: "u_demo",
          projectId: payload.projectId,
          sourceOutputId: payload.sourceOutputId,
          sourceWorkflowRunId: payload.sourceWorkflowRunId,
          title: payload.title,
          sourceType: payload.sourceType,
          useCase: payload.useCase,
          aspectRatio: payload.aspectRatio,
          durationSeconds: payload.durationSeconds,
          toneStyle: payload.toneStyle,
          cta: payload.cta ?? null,
          promptBrief: "Mock provider-ready video prompt brief.",
          provider: "mock",
          externalJobId: `mock_${Date.now()}`,
          providerStatus: "queued",
          status: "submitted",
          errorMsg: null,
          videoUrl: null,
          thumbnailUrl: null,
          submittedAt: now,
          completedAt: null,
          failedAt: null,
          pollAttempts: 0,
          createdAt: now,
          updatedAt: now,
          project: selectedProject
            ? {
                id: selectedProject.id,
                name: selectedProject.name,
                emoji: selectedProject.emoji ?? null,
              }
            : null,
          sourceOutput: null,
          sourceWorkflowRun: null,
        };

        setJobs((current) => [job, ...current]);

        if (!ownerUnlimited) {
          setCreditsLocal(
            user.credits,
            Math.max(user.videoCredits - 1, 0),
          );
        }

        toast("Mock video job created");
        closeCreate();
        return;
      }

      const response = await videoStudio.create(payload);

      setJobs((current) => [response.job, ...current]);

      if (!ownerUnlimited) {
        setCreditsLocal(user.credits, response.videoCreditsRemaining);
      }

      toast("Video job created");
      closeCreate();
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setCreating(false);
    }
  }

  async function refreshJob(job: VideoJob) {
    try {
      if (mode === "mock") {
        setJobs((current) =>
          current.map((entry) =>
            entry.id === job.id
              ? {
                  ...entry,
                  status:
                    entry.status === "submitted"
                      ? "processing"
                      : "completed",
                  providerStatus:
                    entry.status === "submitted"
                      ? "processing"
                      : "completed",
                  updatedAt: new Date().toISOString(),
                  completedAt:
                    entry.status === "submitted"
                      ? null
                      : new Date().toISOString(),
                }
              : entry,
          ),
        );

        toast("Mock video job refreshed", "info");
        return;
      }

      const response = await videoStudio.refresh(job.id);

      setJobs((current) =>
        current.map((entry) =>
          entry.id === response.job.id ? response.job : entry,
        ),
      );

      toast("Video job refreshed", "info");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  return (
    <AppShell
      title="Video Studio"
      subtitle="Create provider-backed promotional video jobs from briefs, assets, and workflow results."
      action={<Badge>{videoCreditLabel}</Badge>}
    >
      <div className="space-y-6">
        {videoLocked ? (
          <Card>
            <div className="space-y-3">
              <Badge>Plan-gated</Badge>

              <h2 className="text-lg font-semibold">
                Video Studio is plan-gated
              </h2>

              <p className="max-w-3xl text-sm text-white/60">
                This feature is reserved for plans with premium video credits.
                Owner accounts and future video-enabled paid plans can submit
                real provider-backed video jobs from this workspace.
              </p>
            </div>
          </Card>
        ) : null}

        {ownerUnlimited ? (
          <Card>
            <div className="space-y-2">
              <Badge>Owner access</Badge>

              <h2 className="text-lg font-semibold">
                Unlimited Video Studio access is active
              </h2>

              <p className="max-w-3xl text-sm text-white/60">
                Your owner account can submit video jobs without app-level
                video-credit depletion. Provider-side API usage still depends
                on the configured live video account.
              </p>
            </div>
          </Card>
        ) : null}

        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Create Video Job
              </h2>

              <p className="mt-1 text-sm text-white/55">
                Start from scratch, campaign context, a saved asset, or a
                workflow result.
              </p>
            </div>

            <Button onClick={openCreate} disabled={videoLocked}>
              + New Video Job
            </Button>
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="text-sm text-white/55">
              Loading video jobs…
            </div>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <EmptyState
              icon="🎬"
              title="No video jobs yet"
              description="Create your first provider-ready short-form video job from a campaign, saved output, or workflow result."
              action={
                <Button onClick={openCreate} disabled={videoLocked}>
                  Create Video Job
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        {job.title}
                      </h2>

                      <Badge>{job.status}</Badge>

                      <Badge>{job.provider}</Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <Info
                        label="Use Case"
                        value={useCaseLabel(job.useCase)}
                      />

                      <Info
                        label="Format"
                        value={`${job.aspectRatio} · ${job.durationSeconds}s`}
                      />

                      <Info
                        label="Provider Status"
                        value={job.providerStatus ?? "—"}
                      />

                      <Info
                        label="Poll Attempts"
                        value={String(job.pollAttempts)}
                      />
                    </div>

                    {job.errorMsg ? (
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                        {job.errorMsg}
                      </div>
                    ) : null}

                    {job.videoUrl ? (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/70 font-semibold">
                          Completed Video
                        </div>

                        <a
                          href={job.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm font-medium text-emerald-100 hover:text-white underline underline-offset-4"
                        >
                          Open completed video
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="secondary"
                      onClick={() => void refreshJob(job)}
                    >
                      Refresh Status
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Create Video Job"
        onClose={closeCreate}
        footer={
          <>
            <Button variant="secondary" onClick={closeCreate}>
              Cancel
            </Button>

            <Button
              onClick={() => void createJob()}
              disabled={videoLocked || creating}
            >
              {creating ? "Submitting…" : "Generate Video Brief + Submit Job"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="e.g. The Simple Digital Path Promo Reel"
            autoFocus
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/75">
              Start From
            </span>

            <select
              value={form.sourceType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sourceType: event.target.value as VideoJob["sourceType"],
                  sourceOutputId: "",
                  sourceWorkflowRunId: "",
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="scratch">Start from scratch</option>
              <option value="project">Start from Project / Campaign</option>
              <option value="output">Start from Saved Output</option>
              <option value="workflow_run">Start from Workflow Result</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/75">
              Project / Campaign
            </span>

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
          </label>

          {form.sourceType === "output" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/75">
                Saved Output
              </span>

              <select
                value={form.sourceOutputId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceOutputId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="">Select saved output</option>

                {selectedProjectOutputs.map((output) => (
                  <option key={output.id} value={output.id}>
                    {output.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {form.sourceType === "workflow_run" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/75">
                Workflow Result
              </span>

              <select
                value={form.sourceWorkflowRunId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceWorkflowRunId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="">Select workflow run</option>

                {selectedProjectWorkflowRuns.map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/75">
              Video Goal
            </span>

            <select
              value={form.useCase}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  useCase: event.target.value as VideoJob["useCase"],
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="promo_ad">Short-form promotional ad</option>
              <option value="product_highlight">
                Product / service highlight
              </option>
              <option value="offer_announcement">Offer announcement</option>
              <option value="social_reel">Social reel / short creative</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/75">
                Aspect Ratio
              </span>

              <select
                value={form.aspectRatio}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    aspectRatio:
                      event.target.value as VideoJob["aspectRatio"],
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="9:16">9:16 Vertical</option>
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Landscape</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/75">
                Length
              </span>

              <select
                value={form.durationSeconds}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationSeconds: Number(
                      event.target.value,
                    ) as VideoJob["durationSeconds"],
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value={6}>6 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={12}>12 seconds</option>
              </select>
            </label>
          </div>

          <Textarea
            label="Tone / Style"
            value={form.toneStyle}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                toneStyle: event.target.value,
              }))
            }
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
        </div>
      </Modal>
    </AppShell>
  );
}

function useCaseLabel(useCase: VideoJob["useCase"]) {
  switch (useCase) {
    case "promo_ad":
      return "Promotional Ad";
    case "product_highlight":
      return "Product Highlight";
    case "offer_announcement":
      return "Offer Announcement";
    case "social_reel":
      return "Social Reel";
    default:
      return "Video";
  }
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
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">
        {label}
      </div>

      <div className="mt-2 text-sm text-white/70">
        {value}
      </div>
    </div>
  );
}
