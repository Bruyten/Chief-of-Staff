import { useEffect, useRef, useState } from "react";
import { promptArchitecture, type PromptBlock } from "../data/prompts";
import { cn } from "../utils/cn";

type Props = {
  activeSection: string;
  onVisibleChange: (id: string) => void;
};

export default function PromptsView({ activeSection, onVisibleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`prompt-section-${activeSection}`);
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
          const id = visible.target.id.replace("prompt-section-", "");
          onVisibleChange(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    promptArchitecture.forEach((s) => {
      const el = document.getElementById(`prompt-section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(251,146,60,0.1),_transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-10 pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-400/20 text-[11px] text-pink-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            AI Prompt Architecture · Prompt #4
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            The{" "}
            <span className="bg-gradient-to-r from-pink-300 via-rose-300 to-orange-300 bg-clip-text text-transparent">
              brain
            </span>
            {" "}of the platform.
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            One master system prompt. One reusable skill template. Eleven
            individual prompt files. Every rule designed to make the AI feel
            like a calm marketing strategist — never a generic chatbot.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "System prompt", value: "1" },
              { label: "Skill prompts", value: "11" },
              { label: "Hook patterns", value: "6" },
              { label: "Banned words", value: "13" },
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
        {promptArchitecture.map((section) => (
          <section
            key={section.id}
            id={`prompt-section-${section.id}`}
            className="scroll-mt-8"
          >
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-pink-300/60 font-mono text-xs">{section.number}</span>
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
          <div className="rounded-2xl bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-orange-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2">Prompt brain shipped.</h3>
            <p className="text-white/60 leading-relaxed">
              Every prompt above is ready to drop into <code className="text-pink-200 font-mono text-[13px]">/server/prompts/</code> in
              the next phase. Suggested next prompts:
            </p>
            <ul className="mt-3 space-y-2 text-white/70 text-[14px]">
              <li>→ <span className="text-white">"Scaffold the /server folder with Express, Prisma, and the prompt assembler"</span></li>
              <li>→ <span className="text-white">"Restructure the project into the /client + /server monorepo and write render.yaml"</span></li>
              <li>→ <span className="text-white">"Build the working Generator UI in /client with mocked AI output"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: PromptBlock }) {
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
              <span className="text-pink-400 mt-1.5 shrink-0">•</span>
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
              <span className="shrink-0 w-6 h-6 rounded-md bg-white/5 border border-white/10 text-[11px] text-pink-300 grid place-items-center font-mono mt-0.5">
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
      return <CodeBlock lang={block.lang} code={block.code} />;
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
    case "promptfile":
      return (
        <PromptFileBlock
          path={block.path}
          lang={block.lang}
          description={block.description}
          code={block.code}
        />
      );
    case "rules":
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] font-semibold text-white text-[14px]">
            {block.title}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-widest text-emerald-300 font-semibold mb-2">
                ✅ Do
              </div>
              <ul className="space-y-1.5">
                {block.doRules.map((r, i) => (
                  <li key={i} className="text-white/75 text-[13px] leading-relaxed flex gap-2">
                    <span className="text-emerald-400 mt-1 shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-widest text-rose-300 font-semibold mb-2">
                ❌ Don't
              </div>
              <ul className="space-y-1.5">
                {block.dontRules.map((r, i) => (
                  <li key={i} className="text-white/75 text-[13px] leading-relaxed flex gap-2">
                    <span className="text-rose-400 mt-1 shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
              <div className="text-[10px] uppercase tracking-widest text-rose-300 font-semibold mb-2">
                ❌ Generic AI slop
              </div>
              <div className="text-white/80 text-[14px] leading-relaxed italic">
                "{block.bad}"
              </div>
            </div>
            <div className="p-4 bg-emerald-500/[0.04]">
              <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold mb-2">
                ✅ Real marketer
              </div>
              <div className="text-white/90 text-[14px] leading-relaxed">
                "{block.good}"
              </div>
            </div>
          </div>
        </div>
      );
  }
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
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
          <button
            onClick={onCopy}
            className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-white/20 transition"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-white/85 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function PromptFileBlock({
  path,
  lang,
  description,
  code,
}: {
  path: string;
  lang: string;
  description: string;
  code: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  const lineCount = code.split("\n").length;

  return (
    <div className="rounded-xl bg-[#0a0b0f] border border-pink-400/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 border-b border-white/5 bg-gradient-to-r from-pink-500/[0.06] to-transparent hover:from-pink-500/[0.1] transition flex items-center gap-3"
      >
        <div className="text-pink-300 text-base">📄</div>
        <div className="flex-1 min-w-0">
          <code className="text-pink-200 font-mono text-[12.5px] block truncate">{path}</code>
          <div className="text-white/50 text-[12px] mt-0.5">{description}</div>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
          {lineCount} lines
        </span>
        <button
          onClick={onCopy}
          className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-white/20 transition"
        >
          {copied ? "copied" : "copy"}
        </button>
        <span className={cn("text-white/40 transition", open ? "rotate-90" : "")}>›</span>
      </button>
      {open && (
        <div className="bg-[#08090c]">
          <div className="flex items-center justify-end px-4 py-1.5 border-b border-white/5 bg-white/[0.02]">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{lang}</span>
          </div>
          <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-white/85 font-mono max-h-[600px]">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
