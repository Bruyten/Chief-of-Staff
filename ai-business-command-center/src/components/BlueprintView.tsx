import { useEffect, useRef } from "react";
import { blueprint, type Block } from "../data/blueprint";
import { cn } from "../utils/cn";

type Props = {
  activeSection: string;
  onVisibleChange: (id: string) => void;
};

export default function BlueprintView({ activeSection, onVisibleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to active section when sidebar clicks change it.
  useEffect(() => {
    const el = document.getElementById(`section-${activeSection}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSection]);

  // Track which section is currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id.replace("section-", "");
          onVisibleChange(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    blueprint.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.1),_transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-10 pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Master Build Plan · v1.0
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            Your AI{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              Chief of Staff
            </span>
            ,
            <br />
            built one phase at a time.
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            A complete architectural blueprint for the AI-powered business command
            center — covering MVP, full vision, stack, database, API, prompts, user
            flow, roadmap, and risks. Designed for GitHub + Render deployment.
          </p>
          <div className="flex flex-wrap gap-2 mt-7">
            {["React + Vite", "Node + Express", "PostgreSQL", "Prisma", "OpenAI", "Render", "GitHub"].map((t) => (
              <span
                key={t}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-10 py-12 space-y-20">
        {blueprint.map((section) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className="scroll-mt-8"
          >
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-violet-300/60 font-mono text-xs">{section.number}</span>
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
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🎬</div>
            <h3 className="text-xl font-bold text-white mb-2">Ready for the next prompt</h3>
            <p className="text-white/60 leading-relaxed">
              This blueprint is your north star. Send your next prompt and we'll start
              building Phase 1 in code: scaffolding the Express backend, defining the
              Prisma schema, and wiring up auth — all configured for GitHub → Render
              deployment. When everything's done, the full project zips up and drops
              into your repo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: Block }) {
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
              <span className="text-violet-400 mt-1.5 shrink-0">•</span>
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
              <span className="shrink-0 w-6 h-6 rounded-md bg-white/5 border border-white/10 text-[11px] text-violet-300 grid place-items-center font-mono mt-0.5">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "callout": {
      const tones = {
        info: "from-indigo-500/10 to-blue-500/5 border-indigo-400/20 text-indigo-200",
        warn: "from-amber-500/10 to-orange-500/5 border-amber-400/20 text-amber-200",
        success: "from-emerald-500/10 to-teal-500/5 border-emerald-400/20 text-emerald-200",
      };
      const icons = { info: "💡", warn: "⚠️", success: "✅" };
      return (
        <div
          className={cn(
            "rounded-xl border bg-gradient-to-br p-4 flex gap-3",
            tones[block.tone]
          )}
        >
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
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              {block.lang}
            </span>
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
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-white/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-white/70 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "cards":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {block.cards.map((c, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {c.icon && <span className="text-lg">{c.icon}</span>}
                <div className="font-semibold text-white text-[14px]">{c.title}</div>
              </div>
              <div className="text-white/60 text-[13px] leading-relaxed">{c.text}</div>
            </div>
          ))}
        </div>
      );
  }
}
