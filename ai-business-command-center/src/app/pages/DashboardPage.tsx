import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState } from "../ui/Primitives";
import { outputTypeLabels } from "../mock/data";

export function DashboardPage() {
  const { user, projects, outputs, navigate } = useApp();
  const recent = outputs.slice(0, 5);

  const stats = [
    { label: "Projects", value: projects.length, icon: "📁" },
    { label: "Outputs", value: outputs.length, icon: "✨" },
    { label: "Credits Left", value: user.credits, icon: "⚡" },
    { label: "Plan", value: user.plan === "free" ? "Free" : "Pro", icon: "💎" },
  ];

  const quickGenerators = [
    { id: "tiktok_script", icon: "🎵", name: "TikTok Script" },
    { id: "instagram_caption", icon: "📸", name: "IG Caption" },
    { id: "email_welcome_sequence", icon: "📧", name: "Email Sequence" },
    { id: "product_description", icon: "🛍️", name: "Product Desc" },
    { id: "hook_generator", icon: "🪝", name: "10 Hooks" },
    { id: "trust_building_post", icon: "🤝", name: "Trust Post" },
  ];

  return (
    <AppShell
      title={`Hey ${user.name.split(" ")[0]} 👋`}
      subtitle="Here's what's happening in your workspace today."
      action={
        <Button variant="primary" size="md" onClick={() => navigate("new-task")}>
          ✨ New Task
        </Button>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="!p-4">
            <div className="flex items-start justify-between">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">{s.label}</div>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className="text-2xl md:text-[28px] font-bold text-white mt-2">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Quick generators */}
      <div className="mb-6">
        <SectionHeader
          title="Quick Generators"
          subtitle="Tap a template to start a new task."
          link={{ label: "All templates →", onClick: () => navigate("templates") }}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickGenerators.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate("new-task", { templateId: g.id })}
              className="text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-violet-400/30 transition p-3.5 group"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform origin-left">{g.icon}</div>
              <div className="text-white text-[12.5px] font-semibold leading-tight">{g.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column lower */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent outputs */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Recent Outputs"
            subtitle="Your last few generations."
            link={{ label: "View all →", onClick: () => navigate("saved-outputs") }}
          />
          {recent.length === 0 ? (
            <EmptyState
              title="No outputs yet"
              description="Run your first generation to see it here."
              action={<Button onClick={() => navigate("new-task")}>✨ Start a task</Button>}
            />
          ) : (
            <Card padded={false}>
              <div className="divide-y divide-white/5">
                {recent.map((o) => {
                  const meta = outputTypeLabels[o.type];
                  return (
                    <button
                      key={o.id}
                      onClick={() => navigate("saved-outputs", { outputId: o.id })}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/5 grid place-items-center text-base shrink-0">
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-[13.5px] font-medium truncate">{o.title}</div>
                        <div className="text-white/45 text-[11.5px] mt-0.5 flex items-center gap-1.5">
                          <span>{meta.label}</span>
                          <span className="opacity-30">·</span>
                          <span>{o.projectName}</span>
                          <span className="opacity-30">·</span>
                          <span>{relativeTime(o.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-white/30 text-sm">→</div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Projects + checklist */}
        <div className="space-y-5">
          <div>
            <SectionHeader
              title="Your Projects"
              link={{ label: "All →", onClick: () => navigate("projects") }}
            />
            <Card padded={false}>
              <div className="divide-y divide-white/5">
                {projects.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate("project-detail", { projectId: p.id })}
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 grid place-items-center text-base shrink-0">
                      {p.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-[13px] font-medium truncate">{p.name}</div>
                      <div className="text-white/40 text-[11px] truncate">{p.outputCount} outputs</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Setup checklist */}
          <Card className="!bg-gradient-to-br !from-violet-500/10 !to-fuchsia-500/5 !border-violet-400/20">
            <div className="text-[15px] font-semibold text-white">Setup checklist</div>
            <div className="text-[12px] text-white/50 mb-3">Finish to unlock more.</div>
            <div className="space-y-2">
              {[
                { done: true, label: "Create account" },
                { done: true, label: "Create your first project" },
                { done: true, label: "Generate your first output" },
                { done: false, label: "Add brand voice to a project" },
                { done: false, label: "Save 10 outputs to library" },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={
                      "w-4 h-4 rounded-full grid place-items-center text-[9px] font-bold shrink-0 " +
                      (step.done ? "bg-emerald-500 text-white" : "border border-white/15 text-white/30")
                    }
                  >
                    {step.done ? "✓" : ""}
                  </span>
                  <span className={step.done ? "text-white/40 line-through" : "text-white/85"}>{step.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
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
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-white text-[15px] font-semibold">{title}</h2>
        {subtitle && <div className="text-white/45 text-[12px] mt-0.5">{subtitle}</div>}
      </div>
      {link && (
        <button onClick={link.onClick} className="text-violet-300 hover:text-violet-200 text-[12px] font-medium">
          {link.label}
        </button>
      )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export { Badge }; // re-export to silence unused warning if not used
