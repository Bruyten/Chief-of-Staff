import { useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState } from "../ui/Primitives";
import { outputTypeLabels } from "../mock/data";

export function ProjectDetailPage() {
  const { params, projects, products, outputs, navigate, createProduct, toast } = useApp();
  const project = projects.find((p) => p.id === params.projectId);

  if (!project) {
    return (
      <AppShell title="Project not found">
        <EmptyState
          title="Project not found"
          description="This project may have been deleted."
          action={<Button onClick={() => navigate("projects")}>← Back to projects</Button>}
        />
      </AppShell>
    );
  }

  const projectProducts = products.filter((p) => p.projectId === project.id);
  const projectOutputs = outputs.filter((o) => o.projectId === project.id);

  return (
    <AppShell
      title={`${project.emoji} ${project.name}`}
      subtitle={project.niche}
      action={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="md" onClick={() => navigate("projects")}>
            ← Back
          </Button>
          <Button size="md" onClick={() => navigate("new-task")}>
            ✨ New Task
          </Button>
        </div>
      }
    >
      {project.brandVoice && (
        <Card className="mb-5 !bg-violet-500/[0.05] !border-violet-400/15">
          <div className="text-[10px] uppercase tracking-widest text-violet-300 font-semibold mb-1">
            🎙️ Brand voice
          </div>
          <div className="text-white/80 text-[13.5px] leading-relaxed">{project.brandVoice}</div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Products */}
        <div>
          <SectionHeader title="Products" subtitle={`${projectProducts.length} in this project`} />
          {projectProducts.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products yet"
              description="Add products to make generation faster — fields auto-fill."
              action={<Button>+ Add product</Button>}
            />
          ) : (
            <div className="space-y-2.5">
              {projectProducts.map((pr) => (
                <Card key={pr.id} className="hover:bg-white/[0.05] transition">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="text-white font-semibold text-[14px]">{pr.name}</div>
                    <Badge tone="info">{pr.price}</Badge>
                  </div>
                  <div className="text-white/55 text-[12.5px] leading-relaxed line-clamp-2">{pr.description}</div>
                  <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-3 text-[11.5px]">
                    <div>
                      <div className="text-white/35 uppercase tracking-wider text-[10px] mb-0.5">Audience</div>
                      <div className="text-white/75 line-clamp-1">{pr.audience}</div>
                    </div>
                    <div>
                      <div className="text-white/35 uppercase tracking-wider text-[10px] mb-0.5">Pain</div>
                      <div className="text-white/75 line-clamp-1">{pr.painPoint}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Outputs */}
        <div>
          <SectionHeader title="Outputs" subtitle={`${projectOutputs.length} saved`} />
          {projectOutputs.length === 0 ? (
            <EmptyState
              icon="✨"
              title="No outputs yet"
              description="Run a generator with this project selected."
              action={<Button onClick={() => navigate("new-task")}>✨ Start a task</Button>}
            />
          ) : (
            <Card padded={false}>
              <div className="divide-y divide-white/5">
                {projectOutputs.map((o) => {
                  const meta = outputTypeLabels[o.type];
                  return (
                    <button
                      key={o.id}
                      onClick={() => navigate("saved-outputs", { outputId: o.id })}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition flex items-center gap-3"
                    >
                      <div className="text-base shrink-0">{meta.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-[13px] font-medium truncate">{o.title}</div>
                        <div className="text-white/40 text-[11px]">{meta.label}</div>
                      </div>
                      <div className="text-white/30 text-sm">→</div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-white text-[15px] font-semibold">{title}</h2>
      {subtitle && <div className="text-white/45 text-[12px] mt-0.5">{subtitle}</div>}
    </div>
  );
}
