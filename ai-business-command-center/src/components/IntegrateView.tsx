import { useEffect, useRef, useState } from "react";
import { integrateSpec, type IntegrateBlock } from "../data/integrate";
import { cn } from "../utils/cn";

type Props = {
  activeSection: string;
  onVisibleChange: (id: string) => void;
};

export default function IntegrateView({ activeSection, onVisibleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`int-section-${activeSection}`);
    if (el && containerRef.current) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) onVisibleChange(visible.target.id.replace("int-section-", ""));
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    integrateSpec.forEach((s) => {
      const el = document.getElementById(`int-section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onVisibleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.1),_transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-10 pt-16 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/20 text-[11px] text-yellow-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            AI Integration · Prompt #8
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            Frontend{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              ↔ backend ↔ AI
            </span>{" "}
            wired.
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            The React app now talks to the real Express server through one
            typed apiClient. Flip the toggle on the login screen to "🟢 Live API",
            run the server, and every action hits production-style code.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "API client lines", value: "~180" },
              { label: "Endpoint helpers", value: "12" },
              { label: "Defense layers", value: "9" },
              { label: "Files updated", value: "5" },
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
        {integrateSpec.map((section) => (
          <section key={section.id} id={`int-section-${section.id}`} className="scroll-mt-8">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-yellow-300/60 font-mono text-xs">{section.number}</span>
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
          <div className="rounded-2xl bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🚦</div>
            <h3 className="text-xl font-bold text-white mb-2">Live wires connected.</h3>
            <p className="text-white/60 leading-relaxed">
              Try the App tab → sign out → flip "🟢 Live API" → boot the server → sign in.
              Suggested next prompts:
            </p>
            <ul className="mt-3 space-y-2 text-white/70 text-[14px]">
              <li>→ <span className="text-white">"Write render.yaml + restructure into /client + /server monorepo for one-click Render deploy"</span></li>
              <li>→ <span className="text-white">"Add Stripe Checkout for Pro tier ($19/mo)"</span></li>
              <li>→ <span className="text-white">"Package the whole repo as a downloadable .zip with README"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: IntegrateBlock }) {
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
              <span className="text-yellow-400 mt-1.5 shrink-0">•</span>
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
              <span className="shrink-0 w-6 h-6 rounded-md bg-white/5 border border-white/10 text-[11px] text-yellow-300 grid place-items-center font-mono mt-0.5">
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
    case "reqresp":
      return <ReqRespBlock {...block} />;
    case "flow":
      return (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {block.steps.map((step, i) => {
            const colors: Record<string, string> = {
              User: "from-emerald-500/15 border-emerald-400/30 text-emerald-200",
              Frontend: "from-sky-500/15 border-sky-400/30 text-sky-200",
              Express: "from-violet-500/15 border-violet-400/30 text-violet-200",
              Service: "from-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-200",
              AI: "from-orange-500/15 border-orange-400/30 text-orange-200",
            };
            const color = colors[step.actor] ?? "from-white/10 border-white/20 text-white/70";
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
                  {step.detail && <div className="text-white/50 text-[12.5px] leading-relaxed font-mono">{step.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>
      );
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
    <div className="rounded-xl bg-[#0a0b0f] border border-yellow-400/20 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 border-b border-white/5 bg-gradient-to-r from-yellow-500/[0.06] to-transparent hover:from-yellow-500/[0.1] transition flex items-center gap-3">
        <div className="text-yellow-300 text-base">📄</div>
        <div className="flex-1 min-w-0">
          <code className="text-yellow-200 font-mono text-[12.5px] block truncate">{path}</code>
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

function ReqRespBlock({ method, endpoint, request, response }: { method: string; endpoint: string; request: string; response: string }) {
  const colors: Record<string, string> = {
    GET: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
    POST: "text-sky-300 bg-sky-500/10 border-sky-400/20",
    PATCH: "text-amber-300 bg-amber-500/10 border-amber-400/20",
    DELETE: "text-rose-300 bg-rose-500/10 border-rose-400/20",
  };
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
        <span className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border", colors[method])}>{method}</span>
        <code className="text-white font-mono text-[13px]">{endpoint}</code>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
        <div>
          <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-white/40 font-semibold bg-white/[0.02]">Request</div>
          <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed text-white/85 font-mono"><code>{request}</code></pre>
        </div>
        <div>
          <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-emerald-300 font-semibold bg-emerald-500/[0.04]">Response</div>
          <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed text-white/85 font-mono"><code>{response}</code></pre>
        </div>
      </div>
    </div>
  );
}
