import { useEffect, useRef } from "react";
import { mvpSpec, type SpecBlock } from "../data/mvpSpec";
import { cn } from "../utils/cn";

type Props = {
  activeSection: string;
  onVisibleChange: (id: string) => void;
};

export default function MvpView({ activeSection, onVisibleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`mvp-section-${activeSection}`);
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
          const id = visible.target.id.replace("mvp-section-", "");
          onVisibleChange(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    mvpSpec.forEach((s) => {
      const el = document.getElementById(`mvp-section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.1),_transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-10 pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-[11px] text-emerald-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MVP Spec · Phase 1 Contract
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            The smallest{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              sellable MVP
            </span>
            ,
            <br />
            shipped in 4–6 weeks.
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            A practical, buildable spec for the AI marketing assistant. Eight screens,
            four generators, one shared intake form. Everything else waits.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "Screens", value: "8" },
              { label: "Generators", value: "4" },
              { label: "DB Tables", value: "5" },
              { label: "Weeks to ship", value: "4–6" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-10 py-12 space-y-20">
        {mvpSpec.map((section) => (
          <section
            key={section.id}
            id={`mvp-section-${section.id}`}
            className="scroll-mt-8"
          >
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-emerald-300/60 font-mono text-xs">{section.number}</span>
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
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🚦</div>
            <h3 className="text-xl font-bold text-white mb-2">Ready for Prompt #3</h3>
            <p className="text-white/60 leading-relaxed">
              The MVP contract is locked. Suggested next prompts:
            </p>
            <ul className="mt-3 space-y-2 text-white/70 text-[14px]">
              <li>→ <span className="text-white">"Scaffold the Express backend with Prisma and Render config"</span></li>
              <li>→ <span className="text-white">"Build the working generator UI with mocked AI"</span></li>
              <li>→ <span className="text-white">"Write the 4 AI prompt files for the generators"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: SpecBlock }) {
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
              <span className="text-emerald-400 mt-1.5 shrink-0">•</span>
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
              <span className="shrink-0 w-6 h-6 rounded-md bg-white/5 border border-white/10 text-[11px] text-emerald-300 grid place-items-center font-mono mt-0.5">
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
    case "checklist":
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {block.items.map((item, i) => (
            <label
              key={i}
              className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition"
            >
              <span
                className={cn(
                  "mt-0.5 w-4 h-4 rounded border grid place-items-center text-[10px] shrink-0",
                  item.done
                    ? "bg-emerald-500 border-emerald-400 text-white"
                    : "border-white/20"
                )}
              >
                {item.done ? "✓" : ""}
              </span>
              <span className="flex-1 text-[14px] text-white/80">
                {item.label}
                {item.note && (
                  <span className="block text-white/40 text-[12px] mt-0.5">{item.note}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      );
    case "screen":
      return (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="font-semibold text-white text-[15px]">{block.name}</div>
            <div className="text-white/50 text-[13px] mt-0.5">{block.purpose}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <ScreenCol label="User inputs" items={block.inputs} icon="⌨️" />
            <ScreenCol label="What user sees" items={block.outputs} icon="👁️" />
            <ScreenCol label="Actions" items={block.actions} icon="🖱️" />
          </div>
        </div>
      );
    case "split":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
            <div className="font-semibold text-white text-[14px] mb-3">{block.left.title}</div>
            <ul className="space-y-2">
              {block.left.items.map((it, i) => (
                <li key={i} className="text-white/75 text-[13.5px] leading-relaxed flex gap-2">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 to-transparent p-5">
            <div className="font-semibold text-white text-[14px] mb-3">{block.right.title}</div>
            <ul className="space-y-2">
              {block.right.items.map((it, i) => (
                <li key={i} className="text-white/75 text-[13.5px] leading-relaxed flex gap-2">
                  <span className="text-rose-400 mt-1 shrink-0">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
  }
}

function ScreenCol({ label, items, icon }: { label: string; items: string[]; icon: string }) {
  return (
    <div className="p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-white/75 text-[12.5px] leading-relaxed">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
