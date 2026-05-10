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
    const [productFormOpen, setProductFormOpen] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    audience: "",
    painPoint: "",
    benefits: "",
    price: "",
    offerType: "digital_product",
    cta: "",
  });

  function updateProductField(field: keyof typeof productForm, value: string) {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddProduct() {
    if (!productForm.name.trim() || !productForm.description.trim()) {
      toast("Product name and description are required.", "danger");
      return;
    }

    try {
      setSavingProduct(true);

      await createProduct(project.id, {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        audience: productForm.audience.trim() || undefined,
        painPoint: productForm.painPoint.trim() || undefined,
        benefits: productForm.benefits.trim() || undefined,
        price: productForm.price.trim() || undefined,
        offerType: productForm.offerType.trim() || undefined,
        cta: productForm.cta.trim() || undefined,
      });

      setProductForm({
        name: "",
        description: "",
        audience: "",
        painPoint: "",
        benefits: "",
        price: "",
        offerType: "digital_product",
        cta: "",
      });

      setProductFormOpen(false);
      toast("Product added.", "success");
    } catch {
      toast("Could not add product.", "danger");
    } finally {
      setSavingProduct(false);
    }
  }

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
              action={<Button onClick={() => setProductFormOpen(true)}>✨ Add product</Button>}
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
                  {productFormOpen && (
            <Card className="border-emerald-400/20 bg-emerald-500/[0.03]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-white font-semibold">Add product</div>
                  <div className="text-white/45 text-[12px]">
                    Save product details so generators can auto-fill faster.
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setProductFormOpen(false)}>
                  Cancel
                </Button>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-white/55 text-[11px] uppercase tracking-wider">Product name</span>
                  <input
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                    value={productForm.name}
                    onChange={(e) => updateProductField("name", e.target.value)}
                    placeholder="The Simple Digital Path"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-white/55 text-[11px] uppercase tracking-wider">Description</span>
                  <textarea
                    className="min-h-24 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                    value={productForm.description}
                    onChange={(e) => updateProductField("description", e.target.value)}
                    placeholder="Beginner-friendly guide to digital marketing..."
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-white/55 text-[11px] uppercase tracking-wider">Audience</span>
                    <input
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                      value={productForm.audience}
                      onChange={(e) => updateProductField("audience", e.target.value)}
                      placeholder="Beginners, creators, side hustlers"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-white/55 text-[11px] uppercase tracking-wider">Pain point</span>
                    <input
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                      value={productForm.painPoint}
                      onChange={(e) => updateProductField("painPoint", e.target.value)}
                      placeholder="Overwhelmed and unsure where to start"
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-white/55 text-[11px] uppercase tracking-wider">Price / offer</span>
                    <input
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                      value={productForm.price}
                      onChange={(e) => updateProductField("price", e.target.value)}
                      placeholder="$1 ebook, free guide, $19 course"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-white/55 text-[11px] uppercase tracking-wider">CTA</span>
                    <input
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                      value={productForm.cta}
                      onChange={(e) => updateProductField("cta", e.target.value)}
                      placeholder="Tap the link in bio"
                    />
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-white/55 text-[11px] uppercase tracking-wider">Benefits</span>
                  <textarea
                    className="min-h-20 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                    value={productForm.benefits}
                    onChange={(e) => updateProductField("benefits", e.target.value)}
                    placeholder="Simple steps, beginner friendly, works from phone or laptop..."
                  />
                </label>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setProductFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProduct} disabled={savingProduct}>
                    {savingProduct ? "Saving..." : "Save product"}
                  </Button>
                </div>
              </div>
            </Card>
          )}
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
