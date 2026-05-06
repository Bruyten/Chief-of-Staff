import { useEffect, useRef } from "react";
import { architecture, type ArchBlock } from "../data/architecture";
import { cn } from "../utils/cn";

type Props = {
  activeSection: string;
  onVisibleChange: (id: string) => void;
};

export default function ArchitectureView({ activeSection, onVisibleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`arch-section-${activeSection}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id.replace("arch-section-", "");
          onVisibleChange(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    architecture.forEach((s) => {
      const el = document.getElementById(`arch-section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.1),_transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-10 pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-[11px] text-sky-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Technical Blueprint · Prompt #3
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            The complete{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
              technical blueprint
            </span>
            .
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            Stack, folders, tables, routes, env vars, pages, components, data
            flow, security, and deployment — every architectural decision made
            and explained. Built for GitHub → Render in one push.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "Stack layers", value: "11" },
              { label: "DB tables", value: "5" },
              { label: "API routes", value: "23" },
              { label: "Pages", value: "8" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-10 py-12 space-y-20">
        {architecture.map((section) => (
          <section
            key={section.id}
            id={`arch-section-${section.id}`}
            className="scroll-mt-8"
          >
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-sky-300/60 font-mono text-xs">{section.number}</span>
              <span className="text-3xl">{section.icon}</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">{section.title}</h2>
            </div>
            <p className="text-white/50 text-base ml-12 mb-7">{section.tagline}</p>
            <div className="space-y-5 ml-12">
              {section.blocks.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}
            </div>
          </section>
        ))}

        <div className="ml-12 mt-16 pt-10 border-t border-white/5">
          <div className="rounded-2xl bg-gradient-to-br from-sky-500/15 via-cyan-500/10 to-blue-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🏗️</div>
            <h3 className="text-xl font-bold text-white mb-2">Architecture locked. Ready to build.</h3>
            <p className="text-white/60 leading-relaxed">
              The blueprint is complete and consistent across all 3 prompts so far.
              Suggested next prompts:
            </p>
            <ul className="mt-3 space-y-2 text-white/70 text-[14px]">
              <li>→ <span className="text-white">"Scaffold the Express server with Prisma, Zod, and the auth routes"</span></li>
              <li>→ <span className="text-white">"Move the React app into /client and add the page router with mocked data"</span></li>
              <li>→ <span className="text-white">"Write the 4 prompt files plus the promptAssembler and aiClient with fake-AI mode"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: ArchBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-white/75 leading-relaxed text-[15px]">{block.text}</p>;
    case "h":
      return <h3 className="text-white font-semibold text-lg mt-4">{block.text}</h3>;
    case "list":
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-white/75 text-[15px] leading-relaxed">
              <span className="text-sky-400 mt-1.5 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ordered":
      return (
        <ol className="space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-white/75 text-[15px] leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-md bg-white/5 border border-white/10 text-[11px] text-sky-300 grid place-items-center font-mono mt-0.5">
                {i + 1}
              </span>
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
    case "code":
      return (
        <div className="rounded-xl bg-[#0a0b0f] border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{block.lang}</span>
          </div>
          <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-white/85 font-mono">
            <code>{block.code}</code>
          </pre>
        </div>
      );
    case "table":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-white/5">
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-white/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-white/70 align-top">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "tree":
      return (
        <div className="rounded-xl bg-[#0a0b0f] border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">project tree</span>
          </div>
          <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-white/85 font-mono">
            <span className="text-sky-300">{block.root}</span>
            {"\n"}
            {block.lines.join("\n")}
          </pre>
        </div>
      );
    case "stack":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80 w-[18%]">Layer</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80 w-[24%]">Pick</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80 w-[18%]">Alternative</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80">Why</th>
              </tr>
            </thead>
            <tbody>
              {block.items.map((it, i) => (
                <tr key={i} className="border-t border-white/5 align-top">
                  <td className="px-4 py-2.5 text-white/60 font-medium">{it.layer}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-sky-200 font-semibold">{it.pick}</span>
                  </td>
                  <td className="px-4 py-2.5 text-white/40">{it.alt}</td>
                  <td className="px-4 py-2.5 text-white/70">{it.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "envtable":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80">Key</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80">Example</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80">Where</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80">Note</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-white/5 align-top">
                  <td className="px-4 py-2.5">
                    <code className="text-sky-200 font-mono text-[12.5px]">{r.key}</code>
                    {r.secret && (
                      <span className="ml-2 text-[9px] uppercase tracking-wider text-rose-300 bg-rose-500/10 border border-rose-400/20 px-1.5 py-0.5 rounded">
                        secret
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-white/60 font-mono text-[12px]">{r.example}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
                        r.where === "server"
                          ? "text-amber-200 bg-amber-500/10 border-amber-400/20"
                          : "text-emerald-200 bg-emerald-500/10 border-emerald-400/20"
                      )}
                    >
                      {r.where}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white/70">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "routetable":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80 w-[10%]">Method</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80 w-[36%]">Path</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80 w-[10%]">Auth</th>
                <th className="text-left px-4 py-2.5 font-semibold text-white/80">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => {
                const colors: Record<string, string> = {
                  GET: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
                  POST: "text-sky-300 bg-sky-500/10 border-sky-400/20",
                  PATCH: "text-amber-300 bg-amber-500/10 border-amber-400/20",
                  DELETE: "text-rose-300 bg-rose-500/10 border-rose-400/20",
                };
                return (
                  <tr key={i} className="border-t border-white/5 align-top">
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border", colors[r.method])}>
                        {r.method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="text-white/85 font-mono text-[12.5px]">{r.path}</code>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.auth ? (
                        <span className="text-[10px] uppercase tracking-wider text-violet-200 bg-violet-500/10 border border-violet-400/20 px-1.5 py-0.5 rounded">
                          🔒 yes
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                          public
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-white/70">{r.purpose}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    case "flow":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {block.steps.map((step, i) => {
            const actorColors: Record<string, string> = {
              User: "from-emerald-500/15 border-emerald-400/30 text-emerald-200",
              Frontend: "from-sky-500/15 border-sky-400/30 text-sky-200",
              Express: "from-violet-500/15 border-violet-400/30 text-violet-200",
              Service: "from-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-200",
            };
            const color = actorColors[step.actor] ?? "from-white/10 border-white/20 text-white/70";
            return (
              <div key={i} className="flex gap-4 p-4 border-t border-white/5 first:border-t-0">
                <div className="shrink-0 w-7 h-7 rounded-md bg-white/5 border border-white/10 grid place-items-center text-[11px] font-mono text-white/60">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border bg-gradient-to-r", color)}>
                      {step.actor}
                    </span>
                    <span className="text-white text-[14px] font-medium">{step.action}</span>
                  </div>
                  {step.detail && (
                    <div className="text-white/50 text-[12.5px] leading-relaxed">{step.detail}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
  }
}
