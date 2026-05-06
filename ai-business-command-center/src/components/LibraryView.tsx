import { useEffect, useRef, useState } from "react";
import { librarySpec, type LibBlock } from "../data/library";
import { cn } from "../utils/cn";

type Props = {
  activeSection: string;
  onVisibleChange: (id: string) => void;
};

export default function LibraryView({ activeSection, onVisibleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`lib-section-${activeSection}`);
    if (el && containerRef.current) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) onVisibleChange(visible.target.id.replace("lib-section-", ""));
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    librarySpec.forEach((s) => {
      const el = document.getElementById(`lib-section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.1),_transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-10 pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/20 text-[11px] text-fuchsia-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            Library System · Prompt #9
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            Projects &{" "}
            <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-rose-300 bg-clip-text text-transparent">
              saved outputs
            </span>{" "}
            wired.
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            The complete persistence layer: 3 tables, 8 routes, 5 components,
            9 user-facing actions. Edit + delete + filter all live in the App
            tab right now.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "User actions", value: "9" },
              { label: "DB tables", value: "3" },
              { label: "API routes", value: "8" },
              { label: "Components", value: "5" },
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
        {librarySpec.map((section) => (
          <section key={section.id} id={`lib-section-${section.id}`} className="scroll-mt-8">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-fuchsia-300/60 font-mono text-xs">{section.number}</span>
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
          <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/15 via-pink-500/10 to-rose-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🎁</div>
            <h3 className="text-xl font-bold text-white mb-2">Library locked. The app is feature-complete.</h3>
            <p className="text-white/60 leading-relaxed">
              Plan ✓ MVP ✓ Architecture ✓ Prompts ✓ Templates ✓ Backend ✓ Wiring ✓ Library ✓.
              The MVP is functionally done. Suggested final prompts:
            </p>
            <ul className="mt-3 space-y-2 text-white/70 text-[14px]">
              <li>→ <span className="text-white">"Write render.yaml + restructure into /client + /server monorepo"</span></li>
              <li>→ <span className="text-white">"Add Stripe Checkout for Pro tier ($19/mo) + webhook to top up credits"</span></li>
              <li>→ <span className="text-white">"Generate the final README + zip the whole repo for download"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: LibBlock }) {
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
              <span className="text-fuchsia-400 mt-1.5 shrink-0">•</span>
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
              <span className="shrink-0 w-6 h-6 rounded-md bg-white/5 border border-white/10 text-[11px] text-fuchsia-300 grid place-items-center font-mono mt-0.5">
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
              <tr>{block.headers.map((h) => (<th key={h} className="text-left px-4 py-2.5 font-semibold text-white/80">{h}</th>))}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  {row.map((cell, j) => (<td key={j} className="px-4 py-2.5 text-white/70 align-top">{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "filecode":
      return <FileCodeBlock {...block} />;
    case "feature":
      return <FeatureBlock {...block} />;
  }
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
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
  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
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

function FeatureBlock({ title, what, ui, api, query }: { title: string; what: string; ui: string; api: string; query: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-fuchsia-300">▸</span>
          <div className="text-white font-semibold text-[14px]">{title}</div>
        </div>
        <div className="text-white/55 text-[12.5px] mt-0.5">{what}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
        <FeatureCol icon="🖥️" label="UI" text={ui} />
        <FeatureCol icon="🛰️" label="API" text={api} mono />
        <FeatureCol icon="🗄️" label="Query" text={query} mono />
      </div>
    </div>
  );
}

function FeatureCol({ icon, label, text, mono }: { icon: string; label: string; text: string; mono?: boolean }) {
  return (
    <div className="p-3.5">
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </div>
      <div className={cn("text-white/80 text-[12.5px] leading-relaxed", mono && "font-mono text-[11.5px] text-fuchsia-200")}>
        {text}
      </div>
    </div>
  );
}
