import { useEffect, useMemo, useState } from "react";

import { useApp } from "../AppContext";
import { useUnlimitedAccess } from "../lib/useUnlimitedAccess";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState } from "../ui/Primitives";
import {
  dashboard,
  friendlyError,
  type DashboardCommandCenter,
} from "../lib/apiClient";
import { outputTypeLabels } from "../mock/data";

export function DashboardPage() {
  const { user, projects, outputs, navigate, mode, toast } = useApp();
  const unlimitedAccess = useUnlimitedAccess(mode);

  const [commandCenter, setCommandCenter] =
    useState<DashboardCommandCenter | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "live") {
      return;
    }

    setLoading(true);

    dashboard
      .commandCenter()
      .then(setCommandCenter)
      .catch((error) => toast(friendlyError(error), "danger"))
      .finally(() => setLoading(false));
  }, [mode, toast]);

  const fallbackRecommendations = useMemo(() => {
    const items: DashboardCommandCenter["recommendations"] = [];

    if (projects.length === 0) {
      items.push({
        id: "create-project",
        title: "Create your first campaign workspace",
        description:
          "Projects organize strategy, outputs, workflows, and future automation.",
        priority: "high",
        actionLabel: "Create Project",
        actionPage: "projects",
      });
    }

    if (projects.length > 0 && outputs.length === 0) {
      items.push({
        id: "generate-output",
        title: "Generate your first saved output",
        description:
          "Turn an active project into reusable content and campaign assets.",
        priority: "high",
        actionLabel: "Start Task",
        actionPage: "new-task",
      });
    }

    items.push({
      id: "brand-voice",
      title: "Create a reusable Brand Voice Profile",
      description:
        "Keep Chat, Workflows, and future video prompts consistent.",
      priority: "medium",
      actionLabel: "Open Brand Voices",
      actionPage: "brand-voices",
    });

    return items.slice(0, 4);
  }, [outputs.length, projects.length]);

  const isUnlimited = unlimitedAccess.unlimited;

  const stats = [
    {
      label: "Campaigns",
      value: commandCenter?.stats.projectCount ?? projects.length,
      icon: "📁",
    },
    {
      label: "Saved Outputs",
      value: commandCenter?.stats.outputCount ?? outputs.length,
      icon: "✨",
    },
    {
      label: "Text Credits",
      value: isUnlimited ? "Owner / Unlimited" : user.credits,
      icon: "⚡",
    },
    {
      label: "Video Credits",
      value: isUnlimited ? "Owner / Unlimited" : user.videoCredits,
      icon: "🎬",
    },
  ];

  const recommendations =
    commandCenter?.recommendations ?? fallbackRecommendations;

  const recentOutputs =
    commandCenter?.recentOutputs ??
    outputs.slice(0, 5).map((output) => ({
      id: output.id,
      type: output.type,
      title: output.title,
      content: output.content,
      projectId: output.projectId,
      createdAt: output.createdAt,
      updatedAt: output.createdAt,
      project: output.projectId
        ? {
            id: output.projectId,
            name: output.projectName,
            emoji: output.projectEmoji ?? null,
          }
        : null,
    }));

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your Digital Marketing Chief of Staff command center."
      action={<Button onClick={() => navigate("new-task")}>✨ New Task</Button>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/40 font-semibold">
                    {stat.label}
                  </div>

                  <div
                    className={
                      typeof stat.value === "string" && stat.value.includes("Unlimited")
                        ? "mt-3 text-lg font-semibold tracking-tight text-violet-200"
                        : "mt-3 text-3xl font-semibold tracking-tight"
                    }
                  >
                    {stat.value}
                  </div>
                </div>

                <div className="text-2xl">{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Card>
            <SectionHeader
              title="Recommended Next Actions"
              subtitle="Rule-based prompts generated from real app state."
            />

            {loading ? (
              <div className="mt-4 text-sm text-white/55">
                Loading recommendations…
              </div>
            ) : recommendations.length === 0 ? (
              <EmptyState
                icon="✅"
                title="No urgent next action"
                description="Your workspace looks healthy. Start a workflow or open Chat to keep building momentum."
                action={
                  <Button onClick={() => navigate("workflows")}>
                    Open Workflows
                  </Button>
                }
              />
            ) : (
              <div className="mt-4 space-y-3">
                {recommendations.map((recommendation) => (
                  <div
                    key={recommendation.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge>{recommendation.priority}</Badge>
                        <div className="font-medium">{recommendation.title}</div>
                      </div>

                      <p className="mt-2 max-w-2xl text-sm text-white/55">
                        {recommendation.description}
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        navigate(
                          recommendation.actionPage,
                          recommendation.actionParams,
                        )
                      }
                    >
                      {recommendation.actionLabel}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader
              title="Helpful Shortcuts"
              subtitle="Move directly into the operating layer."
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Shortcut
                label="Chief of Staff Chat"
                icon="💬"
                onClick={() => navigate("chief-chat")}
              />

              <Shortcut
                label="Launch Workflow"
                icon="🧩"
                onClick={() => navigate("workflows")}
              />

              <Shortcut
                label="Create Campaign"
                icon="📁"
                onClick={() => navigate("projects")}
              />

              <Shortcut
                label="Create Brand Profile"
                icon="🎙️"
                onClick={() => navigate("brand-voices")}
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <SectionHeader
              title="Campaign / Project Activity"
              subtitle="Recent outputs and workflow activity."
              link={{
                label: "View Projects",
                onClick: () => navigate("projects"),
              }}
            />

            {recentOutputs.length === 0 ? (
              <EmptyState
                icon="✨"
                title="No recent saved outputs"
                description="Generate campaign content or launch a workflow to populate this section."
                action={
                  <Button onClick={() => navigate("new-task")}>
                    Start a Task
                  </Button>
                }
              />
            ) : (
              <div className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">
                {recentOutputs.slice(0, 5).map((output) => {
                  const meta =
                    outputTypeLabels[
                      output.type as keyof typeof outputTypeLabels
                    ];

                  return (
                    <button
                      type="button"
                      key={output.id}
                      onClick={() =>
                        navigate("saved-outputs", { outputId: output.id })
                      }
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition flex items-center gap-3"
                    >
                      <div className="text-lg">{meta?.icon ?? "✨"}</div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {output.title}
                        </div>

                        <div className="truncate text-xs text-white/45">
                          {meta?.label ?? output.type} ·{" "}
                          {output.project?.name ?? "No project"} ·{" "}
                          {relativeTime(output.updatedAt)}
                        </div>
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
              title="Active Automations"
              subtitle="Recurring marketing jobs and their current status."
              link={{
                label: "Manage",
                onClick: () => navigate("automations"),
              }}
            />

            {commandCenter?.activeAutomations?.length ? (
              <div className="mt-4 space-y-3">
                {commandCenter.activeAutomations.map((automation) => (
                  <div
                    key={automation.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{automation.name}</div>

                        <div className="mt-1 text-xs text-white/45">
                          {automation.enabled ? "Enabled" : "Disabled"} · Next:{" "}
                          {formatMaybeDate(automation.nextRunAt)}
                        </div>
                      </div>

                      <Badge>{automation.lastStatus ?? "new"}</Badge>
                    </div>

                    <div className="mt-3 text-xs text-white/45">
                      Last run: {formatMaybeDate(automation.lastRunAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="⏱️"
                title="No automations yet"
                description="Create a recurring marketing automation once workflows and project context are ready."
                action={
                  <Button onClick={() => navigate("automations")}>
                    Open Automations
                  </Button>
                }
              />
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Shortcut({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition p-4 text-left flex items-center gap-3"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function SectionHeader({
  title,
  subtitle,
  link,
}: {
  title: string;
  subtitle?: string;
  link?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>

        {subtitle ? (
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        ) : null}
      </div>

      {link ? (
        <button
          type="button"
          onClick={link.onClick}
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          {link.label}
        </button>
      ) : null}
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) {
    return "just now";
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }

  if (diff < 604800) {
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return new Date(iso).toLocaleDateString();
}

function formatMaybeDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}
