import { useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Button, Card } from "../ui/Primitives";
import { templates, templateCategories } from "../../data/templates";
import { type OutputType } from "../mock/data";
import { cn } from "../../utils/cn";

const categoryColors: Record<string, string> = {
  "Short-form video": "bg-orange-500/10 text-orange-200 border-orange-400/20",
  "Social copy":      "bg-pink-500/10 text-pink-200 border-pink-400/20",
  "Sales copy":       "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  "Email":            "bg-sky-500/10 text-sky-200 border-sky-400/20",
  "Strategy":         "bg-violet-500/10 text-violet-200 border-violet-400/20",
  "Engagement":       "bg-amber-500/10 text-amber-200 border-amber-400/20",
};

export function TemplatesGalleryPage() {
  const { navigate } = useApp();
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(
    () => (category === "All" ? templates : templates.filter((t) => t.category === category)),
    [category]
  );

  return (
    <AppShell
      title="Templates"
      subtitle="15 ready-to-go marketing generators."
    >
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <FilterChip label="All" active={category === "All"} onClick={() => setCategory("All")} count={templates.length} />
        {templateCategories.map((c) => (
          <FilterChip
            key={c}
            label={c}
            active={category === c}
            onClick={() => setCategory(c)}
            count={templates.filter((t) => t.category === c).length}
            color={categoryColors[c]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:bg-white/[0.05] hover:border-white/20 transition flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div className="text-2xl">{t.icon}</div>
              <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-semibold", categoryColors[t.category])}>
                {t.category}
              </span>
            </div>
            <div className="text-white font-semibold text-[14px]">{t.name}</div>
            <div className="text-white/55 text-[12.5px] leading-relaxed mt-2 line-clamp-3 flex-1">
              {t.whatItDoes}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => navigate("new-task", { templateId: t.id as OutputType })}
              >
                ✨ Use template
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  count,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium transition",
        active
          ? color ?? "bg-white text-black border-white"
          : "bg-white/[0.02] text-white/60 border-white/10 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {label}
      <span className="text-[10px] font-mono opacity-60">{count}</span>
    </button>
  );
}
