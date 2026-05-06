import { useMemo, useState } from "react";
import { INTEGRATIONS, RANKED, ROADMAP_PHASES, priorityScore, type Integration, type IntegrationId } from "../data/integrations";
import { cn } from "../utils/cn";

type Props = {
  activeId: IntegrationId | "overview";
  onChange: (id: IntegrationId | "overview") => void;
};

const categoryColors: Record<string, string> = {
  Payments:     "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  Productivity: "bg-sky-500/10    text-sky-200    border-sky-400/20",
  Social:       "bg-pink-500/10   text-pink-200   border-pink-400/20",
  Design:       "bg-violet-500/10 text-violet-200 border-violet-400/20",
  Automation:   "bg-amber-500/10  text-amber-200  border-amber-400/20",
};

export default function IntegrationsView({ activeId, onChange }: Props) {
  const [filter, setFilter] = useState<"all" | "ranked" | "phase">("ranked");

  const sorted = useMemo(() => {
    if (filter === "ranked") return RANKED;
    if (filter === "phase") return [...INTEGRATIONS].sort((a, b) => a.phase - b.phase || a.recommendedOrder - b.recommendedOrder);
    return INTEGRATIONS;
  }, [filter]);

  const active = INTEGRATIONS.find((i) => i.id === activeId) ?? RANKED[0];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.1),_transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-10 pt-16 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-[11px] text-teal-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Integrations Roadmap · Prompt #11
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            From AI writer to{" "}
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              command center
            </span>
            .
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            11 integrations ranked by value vs effort. Each one moves Chief of
            Staff one step closer to the place users run their whole digital
            business from.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "Integrations", value: "11" },
              { label: "Phases", value: "4" },
              { label: "Already shipped", value: "1" },
              { label: "MVP path", value: "Stripe → Zapier → Gmail" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xl md:text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase roadmap */}
      <div className="max-w-5xl mx-auto px-10 py-10">
        <SectionTitle eyebrow="01" title="The Roadmap" subtitle="4 phases, ranked by leverage. Each is shippable on its own." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {ROADMAP_PHASES.map((phase) => (
            <div
              key={phase.phase}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-0.5">
                    {phase.timeline}
                  </div>
                  <div className="text-white text-[15px] font-bold flex items-center gap-2">
                    <span className="text-2xl">{phase.icon}</span>
                    {phase.label}
                  </div>
                </div>
              </div>
              <div className="text-white/60 text-[13px] leading-relaxed mb-3">{phase.goal}</div>
              <div className="flex flex-wrap gap-1.5">
                {phase.integrations.map((id) => {
                  const i = INTEGRATIONS.find((x) => x.id === id)!;
                  return (
                    <button
                      key={id}
                      onClick={() => onChange(id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition text-[12px] text-white/80"
                    >
                      <span>{i.icon}</span>
                      <span>{i.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Priority matrix */}
        <SectionTitle eyebrow="02" title="Priority Matrix" subtitle="Value × Trust − Effort. Higher = build sooner. Click any card to dive in." />

        {/* Filter chips */}
        <div className="flex gap-2 mb-3">
          {[
            { id: "ranked", label: "Sort: by priority" },
            { id: "phase",  label: "Sort: by phase" },
            { id: "all",    label: "Sort: original" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={cn(
                "text-[11px] font-medium px-3 py-1.5 rounded-full border transition",
                filter === f.id
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.02] text-white/60 border-white/10 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Integration cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {sorted.map((i) => (
            <IntegrationCard key={i.id} integration={i} active={active.id === i.id} onClick={() => onChange(i.id)} />
          ))}
        </div>

        {/* Active integration detail */}
        <SectionTitle eyebrow="03" title="Detail" subtitle="Everything you need to scope and build the active integration." />
        <IntegrationDetail integration={active} />

        {/* Final CTA */}
        <div className="mt-16 pt-10 border-t border-white/5">
          <div className="rounded-2xl bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-indigo-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="text-xl font-bold text-white mb-2">11 prompts down. The MVP is sellable. The roadmap is locked.</h3>
            <p className="text-white/60 leading-relaxed">
              You've now got the complete plan, working code (frontend + backend),
              real Stripe billing, and a clear integration path from here.
              Suggested final prompts:
            </p>
            <ul className="mt-3 space-y-2 text-white/70 text-[14px]">
              <li>→ <span className="text-white">"Write render.yaml + restructure into /client + /server monorepo"</span></li>
              <li>→ <span className="text-white">"Generate the final root README with quickstart + architecture overview"</span></li>
              <li>→ <span className="text-white">"Package the whole repo as a downloadable .zip"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Section header ----------
function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-3">
        <span className="text-teal-300/60 font-mono text-xs">{eyebrow}</span>
        <h2 className="text-white text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="text-white/50 text-[13px] mt-1 ml-7">{subtitle}</p>}
    </div>
  );
}

// ---------- Card ----------
function IntegrationCard({ integration, active, onClick }: { integration: Integration; active: boolean; onClick: () => void }) {
  const c = categoryColors[integration.category];
  const score = priorityScore(integration);
  const shipped = integration.id === "stripe";
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border bg-gradient-to-br from-white/[0.03] to-transparent p-4 transition",
        active ? "border-white/30 bg-white/[0.06] ring-1 ring-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{integration.icon}</div>
        <div className="flex items-center gap-1.5">
          {shipped && <span className="text-[9px] uppercase tracking-widest text-emerald-200 bg-emerald-500/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">✓ shipped</span>}
          <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-semibold", c)}>
            {integration.category}
          </span>
        </div>
      </div>
      <div className="text-white font-semibold text-[14px]">{integration.name}</div>
      <p className="text-white/55 text-[12.5px] mt-1.5 line-clamp-2 leading-relaxed">{integration.oneLiner}</p>

      {/* Score bars */}
      <div className="mt-3 space-y-1">
        <ScoreBar label="Value"  value={integration.valueScore}  color="emerald" />
        <ScoreBar label="Effort" value={integration.effortScore} color="rose" inverted />
        <ScoreBar label="Trust"  value={integration.trustScore}  color="sky" />
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-wider">
        <span className="text-white/40">Priority {score}</span>
        <span className="text-white/40">Phase {integration.phase} · #{integration.recommendedOrder}</span>
      </div>
    </button>
  );
}

function ScoreBar({ label, value, color, inverted }: { label: string; value: number; color: "emerald" | "rose" | "sky"; inverted?: boolean }) {
  const colors = {
    emerald: "from-emerald-500 to-teal-500",
    rose:    "from-rose-500 to-orange-500",
    sky:     "from-sky-500 to-indigo-500",
  };
  // For "effort", a low bar is good — show length of effort, not "good"
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 uppercase tracking-wider w-11 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={cn("h-full bg-gradient-to-r transition-all", colors[color])} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-[10px] text-white/40 font-mono w-6 text-right">
        {inverted ? `${value}/5` : `${value}/5`}
      </span>
    </div>
  );
}

// ---------- Detail panel ----------
function IntegrationDetail({ integration }: { integration: Integration }) {
  const c = categoryColors[integration.category];
  const score = priorityScore(integration);
  const shipped = integration.id === "stripe";

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{integration.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white text-2xl font-bold">{integration.name}</h3>
              <span className={cn("text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-semibold", c)}>
                {integration.category}
              </span>
              {shipped && <span className="text-[10px] uppercase tracking-widest text-emerald-200 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded">✓ shipped</span>}
            </div>
            <div className="text-white/60 text-[15px] mt-1">{integration.oneLiner}</div>
          </div>
        </div>

        {/* Score row */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-5">
          <Stat label="Value"      value={`${integration.valueScore}/5`} tone="emerald" />
          <Stat label="Effort"     value={`${integration.effortScore}/5`} tone="rose" />
          <Stat label="Trust"      value={`${integration.trustScore}/5`} tone="sky" />
          <Stat label="Priority"   value={String(score)}                  tone="violet" />
          <Stat label="Phase"      value={`Ph ${integration.phase} · #${integration.recommendedOrder}`} tone="neutral" />
        </div>
      </div>

      <div className="divide-y divide-white/5">
        <DetailRow icon="💎" label="What value it adds" text={integration.value} />
        <DetailRow icon="🛠️" label="How hard it is"     text={integration.difficulty} />
        <DetailRow icon="🔑" label="API access requirements" text={integration.apiAccess} />
        <DetailRow icon="🛂" label="OAuth requirements"  text={integration.oauth} />
        <DetailRow icon="⚠️" label="Risks & limitations" text={integration.risks} tone="warn" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 border-t border-white/5">
        <VersionBlock title="MVP version" subtitle="Ship this first" text={integration.mvpVersion} tone="emerald" />
        <VersionBlock title="Advanced version" subtitle="When users ask for more" text={integration.advancedVersion} tone="violet" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" | "sky" | "violet" | "neutral" }) {
  const tones = {
    emerald: "text-emerald-200 border-emerald-400/20 bg-emerald-500/[0.06]",
    rose:    "text-rose-200    border-rose-400/20    bg-rose-500/[0.06]",
    sky:     "text-sky-200     border-sky-400/20     bg-sky-500/[0.06]",
    violet:  "text-violet-200  border-violet-400/20  bg-violet-500/[0.06]",
    neutral: "text-white/70    border-white/10       bg-white/[0.04]",
  };
  return (
    <div className={cn("rounded-lg border px-3 py-2", tones[tone])}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="text-base font-bold mt-0.5">{value}</div>
    </div>
  );
}

function DetailRow({ icon, label, text, tone }: { icon: string; label: string; text: string; tone?: "warn" }) {
  return (
    <div className="px-6 py-4 flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/5 grid place-items-center text-base">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-[11px] uppercase tracking-widest font-semibold mb-1", tone === "warn" ? "text-amber-300" : "text-white/40")}>
          {label}
        </div>
        <div className="text-white/80 text-[14px] leading-relaxed">{text}</div>
      </div>
    </div>
  );
}

function VersionBlock({ title, subtitle, text, tone }: { title: string; subtitle: string; text: string; tone: "emerald" | "violet" }) {
  const tones = {
    emerald: "from-emerald-500/[0.06] border-l-emerald-400/40",
    violet:  "from-violet-500/[0.06]  border-l-violet-400/40",
  };
  const labelColors = {
    emerald: "text-emerald-300",
    violet:  "text-violet-300",
  };
  return (
    <div className={cn("p-5 bg-gradient-to-r border-l-2", tones[tone])}>
      <div className={cn("text-[10px] uppercase tracking-widest font-semibold", labelColors[tone])}>{subtitle}</div>
      <div className="text-white text-[15px] font-semibold mt-0.5 mb-2">{title}</div>
      <div className="text-white/75 text-[13.5px] leading-relaxed">{text}</div>
    </div>
  );
}
