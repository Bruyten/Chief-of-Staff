import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState } from "../ui/Primitives";
import { friendlyError, workflows, type WorkflowRun } from "../lib/apiClient";

export function WorkflowRunPage() {
  const { mode, params, toast, navigate } = useApp();
  const workflowRunId = typeof params.workflowRunId === "string" ? params.workflowRunId : "";
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workflowRunId) return;

    if (mode === "mock") {
      return;
    }

    setLoading(true);
    workflows
      .getRun(workflowRunId)
      .then((response) => setRun(response.run))
      .catch((error) => toast(friendlyError(error), "danger"))
      .finally(() => setLoading(false));
  }, [mode, toast, workflowRunId]);

  if (!workflowRunId) {
    return (
      <AppShell title="Workflow Run" subtitle="No workflow run selected.">
        <Card>
          <EmptyState
            icon="🧩"
            title="No workflow run selected"
            description="Return to Workflows and open a completed or in-progress workflow run."
            action={<Button onClick={() => navigate("workflows")}>Back to Workflows</Button>}
          />
        </Card>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Workflow Run" subtitle="Loading workflow details.">
        <Card>
          <div className="text-sm text-white/55">Loading workflow run…</div>
        </Card>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell title="Workflow Run" subtitle="Workflow details will appear here once loaded.">
        <Card>
          <EmptyState
            icon="🧩"
            title="Workflow details unavailable"
            description="The run may still exist, but this page does not have its detail payload yet."
            action={<Button onClick={() => navigate("workflows")}>Back to Workflows</Button>}
          />
        </Card>
      </AppShell>
    );
  }

  const completedSteps = run.steps.filter((step) => step.status === "done").length;
  const failedSteps = run.steps.filter((step) => step.status === "failed").length;

  return (
    <AppShell
      title={run.title}
      subtitle="Workflow run detail, step outcomes, outputs, and partial failure status."
      action={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("workflows")}>
            ← Workflows
          </Button>
          {run.project ? (
            <Button
              variant="secondary"
              onClick={() => navigate("project-detail", { projectId: run.project?.id })}
            >
              Open Campaign
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{run.status}</Badge>
                <Badge>{completedSteps} completed</Badge>
                {failedSteps > 0 ? <Badge>{failedSteps} failed</Badge> : null}
                <Badge>{run.creditsSpent} text credits spent</Badge>
              </div>

              <h2 className="mt-4 text-xl font-semibold">{run.title}</h2>

              <div className="mt-2 text-sm text-white/50">
                {run.project?.name ?? "No project"} · {run.brandVoiceProfile?.brandName ?? "No brand profile"} ·{" "}
                Started {new Date(run.startedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Workflow Steps</h2>
          <p className="mt-1 text-sm text-white/50">
            Each step runs independently so a partial failure does not erase successful work.
          </p>

          <div className="mt-5 space-y-4">
            {run.steps.map((step, index) => (
              <div key={step.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/40">Step {index + 1}</div>
                    <div className="mt-1 text-lg font-semibold">{step.stepLabel}</div>
                    <div className="mt-1 text-xs text-white/45">{step.skill}</div>
                  </div>
                  <Badge>{step.status}</Badge>
                </div>

                {step.status === "failed" ? (
                  <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                    {step.errorMsg || "This workflow step failed."}
                  </div>
                ) : null}

                {step.content ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="whitespace-pre-wrap text-sm leading-6 text-white/75">{step.content}</div>
                  </div>
                ) : null}

                {step.outputId ? (
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => navigate("saved-outputs", { outputId: step.outputId })}
                    >
                      View Saved Output
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
