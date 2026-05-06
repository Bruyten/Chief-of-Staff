import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, CopyButton, EmptyState, Input, Modal, Select, Textarea } from "../ui/Primitives";
import { Markdown } from "../ui/Markdown";
import { outputTypeLabels, type MockOutput } from "../mock/data";

export function SavedOutputsPage() {
  const { params, outputs, projects, navigate, deleteOutput, updateOutput, toast } = useApp();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(params.outputId ?? null);

  useEffect(() => {
    if (params.outputId) setOpenId(params.outputId);
  }, [params.outputId]);

  const filtered = useMemo(() => {
    return outputs.filter((o) => {
      if (search && !o.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (projectFilter !== "all" && o.projectId !== projectFilter) return false;
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      return true;
    });
  }, [outputs, search, projectFilter, typeFilter]);

  const opened = outputs.find((o) => o.id === openId) ?? null;

  // Counts for the type-filter chips
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    outputs.forEach((o) => {
      m[o.type] = (m[o.type] ?? 0) + 1;
    });
    return m;
  }, [outputs]);

  return (
    <AppShell
      title="Saved Outputs"
      subtitle={`${outputs.length} total · ${filtered.length} shown`}
      action={
        <Button size="md" onClick={() => navigate("new-task")}>
          ✨ New Task
        </Button>
      }
    >
      {/* Filter bar */}
      <Card className="mb-4 !p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <Input placeholder="🔍 Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={[
              { value: "all", label: `All projects (${outputs.length})` },
              ...projects.map((p) => ({
                value: p.id,
                label: `${p.emoji} ${p.name} (${outputs.filter((o) => o.projectId === p.id).length})`,
              })),
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: "all", label: `All types (${outputs.length})` },
              ...Object.entries(outputTypeLabels)
                .filter(([v]) => (typeCounts[v] ?? 0) > 0)
                .map(([v, m]) => ({
                  value: v,
                  label: `${m.icon} ${m.label} (${typeCounts[v]})`,
                })),
            ]}
          />
        </div>
        {(search || projectFilter !== "all" || typeFilter !== "all") && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[11px] text-white/40 uppercase tracking-wider">Filters:</span>
            {search && <FilterTag label={`"${search}"`} onClear={() => setSearch("")} />}
            {projectFilter !== "all" && (
              <FilterTag
                label={projects.find((p) => p.id === projectFilter)?.name ?? "Project"}
                onClear={() => setProjectFilter("all")}
              />
            )}
            {typeFilter !== "all" && (
              <FilterTag
                label={outputTypeLabels[typeFilter as keyof typeof outputTypeLabels]?.label ?? typeFilter}
                onClear={() => setTypeFilter("all")}
              />
            )}
            <button
              onClick={() => {
                setSearch("");
                setProjectFilter("all");
                setTypeFilter("all");
              }}
              className="text-[11px] text-white/50 hover:text-white underline ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📚"
          title={outputs.length === 0 ? "No saved outputs yet" : "No outputs match your filters"}
          description={
            outputs.length === 0
              ? "Run a generation and click Save to build your library."
              : "Try clearing the filters above."
          }
          action={
            outputs.length === 0 ? (
              <Button onClick={() => navigate("new-task")}>✨ Start a task</Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setProjectFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((o) => (
            <OutputCard key={o.id} output={o} onClick={() => setOpenId(o.id)} />
          ))}
        </div>
      )}

      <OutputDetailModal
        output={opened}
        onClose={() => setOpenId(null)}
        onSave={async (patch) => {
          if (!opened) return;
          try {
            await updateOutput(opened.id, patch);
            toast("Output updated");
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not update", "danger");
          }
        }}
        onDelete={async () => {
          if (!opened) return;
          try {
            await deleteOutput(opened.id);
            toast("Output deleted", "info");
            setOpenId(null);
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not delete", "danger");
          }
        }}
      />
    </AppShell>
  );
}

function FilterTag({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] bg-violet-500/15 border border-violet-400/30 text-violet-200 px-2 py-0.5 rounded-full">
      {label}
      <button onClick={onClear} className="hover:text-white" aria-label="Clear filter">
        ×
      </button>
    </span>
  );
}

function OutputCard({ output, onClick }: { output: MockOutput; onClick: () => void }) {
  const meta = outputTypeLabels[output.type];
  return (
    <button onClick={onClick} className="text-left">
      <Card className="hover:bg-white/[0.05] hover:border-white/20 transition h-full !p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/5 grid place-items-center text-base">
            {meta.icon}
          </div>
          <Badge tone="neutral">{meta.label}</Badge>
        </div>
        <div className="text-white text-[13.5px] font-semibold leading-tight line-clamp-2">{output.title}</div>
        <div className="text-white/45 text-[11.5px] mt-1.5">{output.projectName}</div>
        <div className="mt-3 pt-3 border-t border-white/5 text-white/55 text-[12px] line-clamp-3 leading-relaxed flex-1">
          {stripMarkdown(output.content).slice(0, 120)}…
        </div>
        <div className="mt-3 text-[10px] text-white/30 uppercase tracking-wider">
          {new Date(output.createdAt).toLocaleDateString()}
        </div>
      </Card>
    </button>
  );
}

function OutputDetailModal({
  output,
  onClose,
  onSave,
  onDelete,
}: {
  output: MockOutput | null;
  onClose: () => void;
  onSave: (patch: { title?: string; content?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(output?.title ?? "");
  const [content, setContent] = useState(output?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset state whenever a different output opens
  useEffect(() => {
    setTitle(output?.title ?? "");
    setContent(output?.content ?? "");
    setEditing(false);
    setConfirmDelete(false);
  }, [output?.id]);

  if (!output) return null;
  const dirty = title !== output.title || content !== output.content;

  return (
    <Modal
      open={!!output}
      onClose={onClose}
      title={editing ? "Edit output" : output.title}
      size="lg"
      footer={
        editing ? (
          <>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={!dirty || !title.trim() || !content.trim()}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave({
                    ...(title !== output.title ? { title } : {}),
                    ...(content !== output.content ? { content } : {}),
                  });
                  setEditing(false);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save changes
            </Button>
          </>
        ) : confirmDelete ? (
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Yes, delete forever
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              🗑️ Delete
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              ✏️ Edit
            </Button>
            <CopyButton text={output.content} label="Copy Markdown" />
            <Button onClick={onClose}>Close</Button>
          </>
        )
      }
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge tone="violet">
          {outputTypeLabels[output.type]?.icon} {outputTypeLabels[output.type]?.label ?? output.type}
        </Badge>
        <Badge tone="info">{output.projectName}</Badge>
        <Badge tone="neutral">{new Date(output.createdAt).toLocaleString()}</Badge>
        <span className="text-[11px] text-white/30 ml-auto">{output.content.length} chars</span>
      </div>

      {confirmDelete && (
        <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-rose-200 text-[13px]">
          ⚠️ This will permanently delete this output. This can't be undone.
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Output title"
            maxLength={200}
            hint={`${title.length}/200`}
          />
          <Textarea
            label="Content (Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="The Markdown body…"
            rows={16}
            className="font-mono text-[12.5px]"
          />
          <div className="text-[11px] text-white/40">
            💡 Use **bold**, *italic*, ## headings, - bullets. The library renders it back as formatted output.
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
          <Markdown content={output.content} />
        </div>
      )}
    </Modal>
  );
}

function stripMarkdown(s: string): string {
  return s.replace(/[*_`#>-]/g, "").replace(/\n+/g, " ").trim();
}
