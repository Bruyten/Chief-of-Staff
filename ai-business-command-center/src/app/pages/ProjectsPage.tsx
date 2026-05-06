import { useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState, Input, Modal } from "../ui/Primitives";

export function ProjectsPage() {
  const { projects, navigate, createProject, toast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [emoji, setEmoji] = useState("✨");

  const [creating, setCreating] = useState(false);
  const onCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const p = await createProject({ name, niche, emoji });
      setName("");
      setNiche("");
      setEmoji("✨");
      setModalOpen(false);
      toast("Project created");
      navigate("project-detail", { projectId: p.id });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create project", "danger");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell
      title="Projects"
      subtitle="A project is one business or product line."
      action={
        <Button onClick={() => setModalOpen(true)} size="md">
          + New Project
        </Button>
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Projects help you organize products and outputs by business or audience."
          action={<Button onClick={() => setModalOpen(true)}>+ Create your first project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate("project-detail", { projectId: p.id })}
              className="text-left"
            >
              <Card className="hover:bg-white/[0.05] hover:border-white/20 transition cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 grid place-items-center text-xl">
                    {p.emoji}
                  </div>
                  <Badge tone="violet">{p.niche}</Badge>
                </div>
                <div className="text-white font-semibold text-[15px]">{p.name}</div>
                {p.brandVoice && (
                  <div className="text-white/50 text-[12px] mt-1.5 line-clamp-2 leading-relaxed">
                    {p.brandVoice}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5 text-[11px] text-white/45">
                  <span>📦 {p.productCount} products</span>
                  <span className="opacity-30">·</span>
                  <span>✨ {p.outputCount} outputs</span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate}>Create project</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <div className="block text-[12px] font-medium text-white/70 mb-1.5">Emoji</div>
            <div className="flex gap-1.5 flex-wrap">
              {["✨", "🧴", "💚", "🚀", "📚", "🎨", "🍃", "💎", "🔥", "🎯", "🛍️"].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={
                    "w-9 h-9 rounded-lg border text-lg grid place-items-center transition " +
                    (e === emoji ? "bg-white/10 border-white/30" : "bg-white/[0.02] border-white/10 hover:bg-white/5")
                  }
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Glow Skincare"
            autoFocus
          />
          <Input
            label="Niche / category"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. Beauty / DTC"
          />
        </div>
      </Modal>
    </AppShell>
  );
}
