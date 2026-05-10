import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Button, Card, CopyButton, Input, SaveButton, Select, Spinner, Textarea } from "../ui/Primitives";
import { Markdown } from "../ui/Markdown";
import { templates } from "../../data/templates";
import { type OutputType } from "../mock/data";

const offerTypeOptions = [
  { value: "digital_product", label: "Digital product" },
  { value: "course", label: "Course" },
  { value: "subscription", label: "Subscription" },
  { value: "affiliate", label: "Affiliate" },
  { value: "service", label: "Service" },
  { value: "coaching", label: "Coaching" },
  { value: "physical", label: "Physical product" },
];

export function NewTaskPage() {
  const { params, projects, navigate, draft, setDraft, saveOutput, runGeneration, mode, toast } = useApp();

  const initialTemplateId =
    (params.templateId as OutputType) || (draft.templateId as OutputType) || "tiktok_script";
  const [templateId, setTemplateId] = useState<OutputType>(initialTemplateId);
  const activeTemplate = useMemo(() => templates.find((t) => t.id === templateId), [templateId]);

  // Form state — populated from defaults on template change
  const [form, setForm] = useState<Record<string, string>>(() => buildInitialForm(initialTemplateId));
  const [projectId, setProjectId] = useState<string>(draft.projectId || projects[0]?.id || "");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(draft.content);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(templateId));
  }, [templateId]);

  // Sync template change in URL when user picks new template
  const onTemplateChange = (id: OutputType) => {
    setTemplateId(id);
    setOutput(null);
    setSaved(false);
  };

  const onGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setGenerating(true);
    setSaved(false);
    setOutput(null);
    let result = "";
    try {
      if (mode === "live") {
        result = await runGeneration(templateId, projectId, form);
      } else {
        // Mock mode — canned example after a short fake delay
        await new Promise((r) => setTimeout(r, 1400));
        result = activeTemplate?.exampleOutput ?? "_(no output)_";
      }
      setOutput(result);
      setDraft({
        templateId,
        content: result,
        title: `${activeTemplate?.name} — ${form.product_name || "Untitled"}`,
        projectId,
      });
    } catch {
      // runGeneration already toasted the error
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    if (!output || !activeTemplate) return;
    const project = projects.find((p) => p.id === projectId);
    try {
      await saveOutput({
        projectId,
        projectName: project?.name ?? "—",
        type: templateId,
        title: `${activeTemplate.name} — ${form.product_name || "Untitled"}`,
        content: output,
      });
      setSaved(true);
      toast("Saved to library");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "danger");
    }
  };

  return (
    <AppShell
      title="New Task"
      subtitle="Pick a template, fill the form, generate."
      action={
        <Button variant="ghost" size="md" onClick={() => navigate("dashboard")}>
          ← Back
        </Button>
      }
    >
      {/* Template selector — horizontal scroll on mobile, grid on desktop */}
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-2">
          Template
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:gap-2 md:overflow-visible">
          {templates.map((t) => {
            const active = t.id === templateId;
            return (
              <button
                key={t.id}
                onClick={() => onTemplateChange(t.id as OutputType)}
                className={
                  "shrink-0 md:shrink min-w-[140px] md:min-w-0 text-left rounded-xl border px-3 py-2.5 transition " +
                  (active
                    ? "bg-white/10 border-white/30 ring-1 ring-violet-400/30"
                    : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20")
                }
              >
                <div className="text-lg mb-1">{t.icon}</div>
                <div className="text-white text-[12px] font-semibold leading-tight line-clamp-2">{t.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{activeTemplate?.icon}</span>
                <h2 className="text-white text-[15px] font-semibold">{activeTemplate?.name}</h2>
              </div>
              <p className="text-white/50 text-[12px] leading-relaxed">{activeTemplate?.whatItDoes}</p>
            </div>
            <form onSubmit={onGenerate} className="px-5 py-4 space-y-3.5">
              <Select
                label="Project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={projects.map((p) => ({ value: p.id, label: `${p.emoji} ${p.name}` }))}
              />
              {activeTemplate?.inputFields.map((field) => {
                const value = form[field.name] ?? "";
                const onChange = (v: string) => setForm({ ...form, [field.name]: v });
                if (field.name === "offer_type") {
                  return (
                    <Select
                      key={field.name}
                      label={prettyFieldName(field.name)}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      options={offerTypeOptions}
                    />
                  );
                }
                if (field.name === "product_description" || field.name === "personal_moment_or_number") {
                  return (
                    <Textarea
                      key={field.name}
                      label={prettyFieldName(field.name)}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={field.example}
                      hint={field.help}
                      required={field.required}
                      rows={3}
                    />
                  );
                }
                return (
                  <Input
                    key={field.name}
                    label={prettyFieldName(field.name)}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.example}
                    hint={field.help}
                    required={field.required}
                  />
                );
              })}
              <Button type="submit" loading={generating} size="lg" className="w-full mt-1">
                {generating ? "Generating…" : "✨ Generate"}
              </Button>
              <div className="text-[11px] text-white/35 text-center">Uses 1 credit · ~2-5 sec</div>
            </form>
          </Card>
        </div>

        {/* Output viewer */}
        <div className="lg:col-span-3">
          <Card padded={false} className="overflow-hidden lg:sticky lg:top-4">
            <div className="px-5 pt-4 pb-3 border-b border-white/5 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                  AI Output
                </div>
                <div className="text-white text-[14px] font-semibold mt-0.5">
                  {output ? form.product_name || activeTemplate?.name : "Output preview"}
                </div>
              </div>
              {output && !generating && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => onGenerate()}>
                    🔄 Regenerate
                  </Button>
                  <CopyButton text={output} />
                  <SaveButton onSave={onSave} saved={saved} />
                </div>
              )}
            </div>
            <div className="p-5 min-h-[400px]">
              {generating ? (
                <GenerationLoader />
              ) : output ? (
                <Markdown content={output} />
              ) : (
                <OutputEmpty templateName={activeTemplate?.name ?? ""} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function buildInitialForm(templateId: string): Record<string, string> {
  const t = templates.find((tt) => tt.id === templateId);
  if (!t) return {};
  const out: Record<string, string> = {};
  t.inputFields.forEach((f) => {
    out[f.name] = "";
  });
  return out;
}

function prettyFieldName(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function GenerationLoader() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <Spinner size={18} />
        <div className="text-white/70 text-[13.5px]">Chief of Staff is writing…</div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-3/4" />
        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-full" />
        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-5/6" />
        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-2/3" />
      </div>
      <div className="space-y-2 pt-3">
        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-1/2" />
        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-4/5" />
        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-3/5" />
      </div>
    </div>
  );
}

function OutputEmpty({ templateName }: { templateName: string }) {
  return (
    <div className="h-full grid place-items-center text-center py-10 px-4">
      <div>
        <div className="text-4xl mb-3">✨</div>
        <div className="text-white/85 font-semibold">Ready to generate</div>
        <div className="text-white/45 text-[13px] mt-1.5 max-w-sm">
          Fill in the form and click Generate. Your {templateName.toLowerCase()} will appear here.
        </div>
      </div>
    </div>
  );
}
