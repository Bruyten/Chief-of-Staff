import { useEffect, useRef, useState } from "react";
import { agentSpec, type AgentBlock } from "../data/agent";
import { cn } from "../utils/cn";

type Props = { activeSection: string; onVisibleChange: (id: string) => void };

export default function AgentView({ activeSection, onVisibleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`agent-section-${activeSection}`);
    if (el && containerRef.current) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) onVisibleChange(visible.target.id.replace("agent-section-", ""));
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    agentSpec.forEach((s) => {
      const el = document.getElementById(`agent-section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(217,70,239,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.1),_transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-10 pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/20 text-[11px] text-fuchsia-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            AI Agent System · Prompt #12
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            From generator{" "}
            <span className="bg-gradient-to-r from-fuchsia-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              to agent
            </span>
            .
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            One goal in. Eight outputs out. Four human checkpoints in between.
            The complete architecture for the agent layer — and the discipline
            to keep it shippable.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "New tables", value: "3" },
              { label: "Step states", value: "8" },
              { label: "Agent prompts", value: "2" },
              { label: "MVP weeks", value: "4–6" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-10 py-12 space-y-20">
        {agentSpec.map((section) => (
          <section key={section.id} id={`agent-section-${section.id}`} className="scroll-mt-8">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-fuchsia-300/60 font-mono text-xs">{section.number}</span>
              <span className="text-3xl">{section.icon}</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">{section.title}</h2>
            </div>
            <p className="text-white/50 text-base ml-12 mb-7">{section.tagline}</p>
            <div className="space-y-5 ml-12">
              {section.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
            </div>
          </section>
        ))}

        <div className="ml-12 mt-16 pt-10 border-t border-white/5">
          <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/15 via-purple-500/10 to-indigo-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🎬</div>
            <h3 className="text-xl font-bold text-white mb-2">12 prompts shipped. The full plan exists.</h3>
            <p className="text-white/60 leading-relaxed">
              You now have: full vision (Plan), shipping spec (MVP), tech blueprint (Arch),
              AI brain (Prompts), 15 templates (Tpl), real backend (API), live wiring (Wire),
              library CRUD (Lib), Stripe billing (Pay), 11-integration roadmap (Int), and now
              the agent system (Agent). The MVP works in the App tab right now.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              Ready when you are for the deployment + zip step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: AgentBlock }) {
  switch (block.type) {
    case "p":      return <p className="text-white/75 leading-relaxed text-[15px]">{block.text}</p>;
    case "h":      return <h3 className="text-white font-semibold text-lg mt-4">{block.text}</h3>;
    case "list":   return (
      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-white/75 text-[15px] leading-relaxed">
            <span className="text-fuchsia-400 mt-1.5 shrink-0">•</span><span>{item}</span>
          </li>
        ))}
      </ul>
    );
    case "ordered": return (
      <ol className="space-y-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-white/75 text-[15px] leading-relaxed">
            <span className="shrink-0 w-6 h-6 rounded-md bg-white/5 border border-white/10 text-[11px] text-fuchsia-300 grid place-items-center font-mono mt-0.5">{i + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
    case "callout": {
      const tones = {
        info: "from-indigo-500/10 to-blue-500/5 border-indigo-400/20",
        warn: "from-amber-500/10 to-orange-500/5 border-amber-400/20",
        success: "from-emerald-500/10 to-teal-500/5 border-emerald-400/20",
        danger: "from-rose-500/10 to-red-500/5 border-rose-400/20",
      };
      const icons = { info: "💡", warn: "⚠️", success: "✅", danger: "🛑" };
      return (
        <div className={cn("rounded-xl border bg-gradient-to-br p-4 flex gap-3", tones[block.tone])}>
          <span className="text-xl shrink-0">{icons[block.tone]}</span>
          <div>
            <div className="font-semibold text-white text-sm mb-1">{block.title}</div>
            <div className="text-white/70 text-[14px] leading-relaxed">{block.text}</div>
          </div>
        </div>
      );
    }
    case "code": return <CodeBlock lang={block.lang} code={block.code} />;
    case "table": return (
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-white/5">
            <tr>{block.headers.map((h) => <th key={h} className="text-left px-4 py-2.5 font-semibold text-white/80">{h}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className="border-t border-white/5">
                {row.map((cell, j) => <td key={j} className="px-4 py-2.5 text-white/70 align-top">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    case "filecode": return <FileCodeBlock {...block} />;
    case "statusgrid": return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {block.statuses.map((s) => {
          const tones: Record<string, string> = {
            neutral: "bg-white/[0.04] text-white/70 border-white/15",
            info:    "bg-sky-500/10 text-sky-200 border-sky-400/30",
            warn:    "bg-amber-500/10 text-amber-200 border-amber-400/30",
            success: "bg-emerald-500/10 text-emerald-200 border-emerald-400/30",
            danger:  "bg-rose-500/10 text-rose-200 border-rose-400/30",
          };
          return (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-mono font-semibold", tones[s.tone])}>
                  {s.label}
                </span>
              </div>
              <div className="text-white/80 text-[13px] leading-relaxed mb-2">{s.description}</div>
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <span>← {s.from.length ? s.from.join(", ") : "(start)"}</span>
                <span>→ {s.to.length ? s.to.join(", ") : "(terminal)"}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
    case "compare":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] text-[12px] uppercase tracking-widest text-white/50">
            {block.label}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="p-4 bg-rose-500/[0.04]">
              <div className="text-[10px] uppercase tracking-widest text-rose-300 font-semibold mb-2">❌ Before / Risky</div>
              <div className="text-white/85 text-[13.5px] leading-relaxed">{block.bad}</div>
            </div>
            <div className="p-4 bg-emerald-500/[0.04]">
              <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold mb-2">✅ After / Right</div>
              <div className="text-white/90 text-[13.5px] leading-relaxed">{block.good}</div>
            </div>
          </div>
        </div>
      );
    case "steps":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] text-white text-[14px] font-semibold">{block.title}</div>
          {block.steps.map((step, i) => (
            <div key={i} className="px-4 py-3 border-t border-white/5 first:border-t-0 flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 grid place-items-center text-[11px] font-mono text-white/60">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-[13.5px] font-medium">{step.name}</div>
                <div className="text-white/45 text-[11.5px] mt-0.5">{step.note}</div>
              </div>
              <code className="text-fuchsia-200 font-mono text-[11.5px]">{step.skill}</code>
              {step.needsApproval && <span className="text-[9px] uppercase tracking-wider text-amber-200 bg-amber-500/10 border border-amber-400/20 px-1.5 py-0.5 rounded">approval</span>}
            </div>
          ))}
        </div>
      );
  }
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div className="rounded-xl bg-[#0a0b0f] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{lang}</span>
          <button onClick={onCopy} className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-white/20 transition">{copied ? "copied" : "copy"}</button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-white/85 font-mono"><code>{code}</code></pre>
    </div>
  );
}

function FileCodeBlock({ path, lang, description, code }: { path: string; lang: string; description: string; code: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const onCopy = async (e: React.MouseEvent) => { e.stopPropagation(); try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  const lineCount = code.split("\n").length;
  return (
    <div className="rounded-xl bg-[#0a0b0f] border border-fuchsia-400/20 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 border-b border-white/5 bg-gradient-to-r from-fuchsia-500/[0.06] to-transparent hover:from-fuchsia-500/[0.1] transition flex items-center gap-3">
        <div className="text-fuchsia-300 text-base">📄</div>
        <div className="flex-1 min-w-0">
          <code className="text-fuchsia-200 font-mono text-[12.5px] block truncate">{path}</code>
          <div className="text-white/50 text-[12px] mt-0.5">{description}</div>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{lineCount} lines</span>
        <button onClick={onCopy} className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-white/20 transition">{copied ? "copied" : "copy"}</button>
        <span className={cn("text-white/40 transition", open ? "rotate-90" : "")}>›</span>
      </button>
      {open && (
        <div className="bg-[#08090c]">
          <div className="flex items-center justify-end px-4 py-1.5 border-b border-white/5 bg-white/[0.02]">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{lang}</span>
          </div>
          <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-white/85 font-mono max-h-[600px]"><code>{code}</code></pre>
        </div>
      )}
    </div>
  );
}
