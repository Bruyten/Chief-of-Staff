import { useMemo, useState } from "react";
import { templates, templateCategories, type Template } from "../data/templates";
import { cn } from "../utils/cn";

type Props = {
  activeTemplateId: string;
  onTemplateChange: (id: string) => void;
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  "Short-form video": { bg: "bg-orange-500/10", text: "text-orange-200", border: "border-orange-400/20" },
  "Social copy":      { bg: "bg-pink-500/10",   text: "text-pink-200",   border: "border-pink-400/20" },
  "Sales copy":       { bg: "bg-emerald-500/10",text: "text-emerald-200",border: "border-emerald-400/20" },
  "Email":            { bg: "bg-sky-500/10",    text: "text-sky-200",    border: "border-sky-400/20" },
  "Strategy":         { bg: "bg-violet-500/10", text: "text-violet-200", border: "border-violet-400/20" },
  "Engagement":       { bg: "bg-amber-500/10",  text: "text-amber-200",  border: "border-amber-400/20" },
};

export default function TemplatesView({ activeTemplateId, onTemplateChange }: Props) {
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(
    () => (category === "All" ? templates : templates.filter((t) => t.category === category)),
    [category]
  );

  const active = templates.find((t) => t.id === activeTemplateId) ?? templates[0];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,146,60,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(244,114,182,0.1),_transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-10 pt-16 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-400/20 text-[11px] text-orange-200 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Starter Template Library · Prompt #5
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            15{" "}
            <span className="bg-gradient-to-r from-orange-300 via-amber-300 to-pink-300 bg-clip-text text-transparent">
              copy-ready templates
            </span>
            ,
            <br />
            built for beginners.
          </h1>
          <p className="text-white/60 text-lg mt-5 max-w-2xl leading-relaxed">
            Every template includes inputs, the AI prompt, the output format,
            CTA examples, and a real example output. Practical, beginner-friendly,
            no hype. Drop directly into the platform.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: "Templates", value: "15" },
              { label: "Categories", value: "6" },
              { label: "CTA examples", value: "60+" },
              { label: "Example outputs", value: "15" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 backdrop-blur bg-[#06070a]/85 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-10 py-3 flex items-center gap-2 overflow-x-auto">
          <FilterChip label="All" active={category === "All"} count={templates.length} onClick={() => setCategory("All")} />
          {templateCategories.map((c) => {
            const count = templates.filter((t) => t.category === c).length;
            return (
              <FilterChip
                key={c}
                label={c}
                active={category === c}
                count={count}
                onClick={() => setCategory(c)}
                color={categoryColors[c]}
              />
            );
          })}
        </div>
      </div>

      {/* Gallery grid */}
      <div className="max-w-5xl mx-auto px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              isActive={activeTemplateId === t.id}
              onClick={() => onTemplateChange(t.id)}
            />
          ))}
        </div>

        {/* Active template detail */}
        <TemplateDetail template={active} />

        <div className="mt-16 pt-10 border-t border-white/5">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/15 via-pink-500/10 to-amber-500/15 border border-white/10 p-8">
            <div className="text-2xl mb-2">🧰</div>
            <h3 className="text-xl font-bold text-white mb-2">Templates locked. Ready to wire up.</h3>
            <p className="text-white/60 leading-relaxed">
              All 15 templates are ready to drop into <code className="text-orange-200 font-mono text-[13px]">/server/prompts/skills/</code>.
              Suggested next prompts:
            </p>
            <ul className="mt-3 space-y-2 text-white/70 text-[14px]">
              <li>→ <span className="text-white">"Scaffold the /server folder with Express, Prisma, and the prompt assembler — load these 15 templates"</span></li>
              <li>→ <span className="text-white">"Build the working Generator UI in /client with the template selector and intake form"</span></li>
              <li>→ <span className="text-white">"Write the auth flow (signup, login, JWT cookie) and connect it to the dashboard"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  count,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
  color?: { bg: string; text: string; border: string };
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium transition",
        active
          ? color
            ? `${color.bg} ${color.text} ${color.border}`
            : "bg-white text-black border-white"
          : "bg-white/[0.02] text-white/60 border-white/10 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {label}
      <span className={cn("text-[10px] font-mono", active ? "opacity-80" : "opacity-50")}>
        {count}
      </span>
    </button>
  );
}

function TemplateCard({
  template,
  isActive,
  onClick,
}: {
  template: Template;
  isActive: boolean;
  onClick: () => void;
}) {
  const c = categoryColors[template.category];
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border bg-gradient-to-br from-white/[0.03] to-transparent p-4 transition group",
        isActive
          ? "border-white/30 bg-white/[0.06] ring-1 ring-white/10"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{template.icon}</div>
        <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-semibold", c.bg, c.text, c.border)}>
          {template.category}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-white/30 font-mono text-[11px]">{template.number}</span>
        <h3 className="text-white font-semibold text-[14px] leading-tight">{template.name}</h3>
      </div>
      <p className="text-white/50 text-[12.5px] leading-relaxed mt-2 line-clamp-3">
        {template.whatItDoes}
      </p>
      <div className="mt-3 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-wider">
        <span>{template.inputFields.length} inputs</span>
        <span>{isActive ? "viewing ↓" : "view detail →"}</span>
      </div>
    </button>
  );
}

function TemplateDetail({ template }: { template: Template }) {
  const c = categoryColors[template.category];
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/30 font-mono text-[12px]">{template.number}</span>
              <span className={cn("text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-semibold", c.bg, c.text, c.border)}>
                {template.category}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{template.icon}</span>
              <h2 className="text-2xl font-bold text-white tracking-tight">{template.name}</h2>
            </div>
            <p className="text-white/70 text-[14.5px] mt-3 leading-relaxed max-w-2xl">
              {template.whatItDoes}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 flex gap-3">
          <span className="text-base shrink-0">💡</span>
          <div>
            <div className="text-amber-200 text-[11px] uppercase tracking-widest font-semibold mb-1">
              Beginner tip
            </div>
            <div className="text-white/80 text-[13.5px] leading-relaxed">
              {template.beginnerFriendlyNote}
            </div>
          </div>
        </div>
      </div>

      {/* Required input fields */}
      <DetailSection title="Required Input Fields" subtitle="What the user enters in the form">
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-white/80">Field</th>
                <th className="text-left px-3 py-2 font-semibold text-white/80">Required</th>
                <th className="text-left px-3 py-2 font-semibold text-white/80">Example</th>
              </tr>
            </thead>
            <tbody>
              {template.inputFields.map((f) => (
                <tr key={f.name} className="border-t border-white/5 align-top">
                  <td className="px-3 py-2">
                    <code className="text-orange-200 font-mono text-[12.5px]">{f.name}</code>
                    {f.help && <div className="text-white/40 text-[11.5px] mt-1">{f.help}</div>}
                  </td>
                  <td className="px-3 py-2">
                    {f.required ? (
                      <span className="text-[10px] uppercase tracking-wider text-rose-200 bg-rose-500/10 border border-rose-400/20 px-1.5 py-0.5 rounded">
                        required
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                        optional
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-white/65 italic">{f.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailSection>

      {/* AI Prompt */}
      <DetailSection title="AI Prompt" subtitle={`Drops into /server/prompts/skills/${template.id}.md`}>
        <CopyableCode code={template.aiPrompt} lang="md" />
      </DetailSection>

      {/* Output format */}
      <DetailSection title="Output Format" subtitle="The exact Markdown shape the AI returns">
        <CopyableCode code={template.outputFormat} lang="md" />
      </DetailSection>

      {/* CTA examples */}
      <DetailSection title="Best CTA Examples" subtitle="Pre-written calls-to-action ranked by use case">
        <div className="rounded-lg border border-white/10 divide-y divide-white/5">
          {template.ctaExamples.map((cta, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                {cta.label}
              </span>
              <span className="text-white/85 text-[13.5px] leading-relaxed flex-1">"{cta.cta}"</span>
            </div>
          ))}
        </div>
      </DetailSection>

      {/* Example output */}
      <DetailSection
        title="Example Output"
        subtitle="What the AI generates with the example inputs above"
      >
        <div className="rounded-lg border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-semibold">
              ✨ AI output preview
            </span>
            <CopyButton code={template.exampleOutput} />
          </div>
          <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-white/85 whitespace-pre-wrap font-sans">
            {template.exampleOutput}
          </pre>
        </div>
      </DetailSection>
    </div>
  );
}

function DetailSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-5 border-b border-white/5 last:border-b-0">
      <div className="mb-3">
        <h3 className="text-white font-semibold text-[15px]">{title}</h3>
        {subtitle && <div className="text-white/40 text-[12px] mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
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
    <button
      onClick={onCopy}
      className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-white/20 transition"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

function CopyableCode({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-lg bg-[#0a0b0f] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{lang}</span>
        <CopyButton code={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-white/85 font-mono whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}
