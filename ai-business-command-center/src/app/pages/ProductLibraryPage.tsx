import { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Textarea,
} from "../ui/Primitives";
import {
  friendlyError,
  productLibrary,
  type ProductLibraryItem,
} from "../lib/apiClient";

type FormState = {
  name: string;
  productType: ProductLibraryItem["productType"];
  revenueLane: Exclude<ProductLibraryItem["revenueLane"], null>;
  description: string;
  targetAudience: string;
  painPoints: string;
  benefits: string;
  keywords: string;
  tags: string;
  offer: string;
  cta: string;
  priceRange: string;
  productUrl: string;
  coverImageUrl: string;
  promotionPriority: number;
  status: ProductLibraryItem["status"];
};

const EMPTY_FORM: FormState = {
  name: "",
  productType: "ebook",
  revenueLane: "digital_products",
  description: "",
  targetAudience: "",
  painPoints: "",
  benefits: "",
  keywords: "",
  tags: "",
  offer: "",
  cta: "",
  priceRange: "",
  productUrl: "",
  coverImageUrl: "",
  promotionPriority: 3,
  status: "active",
};

export function ProductLibraryPage() {
  const { mode, toast } = useApp();

  const [items, setItems] = useState<ProductLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (mode === "mock") {
      setItems([]);
      return;
    }

    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function loadItems() {
    setLoading(true);

    try {
      const response = await productLibrary.list();
      setItems(response.items);
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  async function createItem() {
    if (!form.name.trim() || saving) {
      return;
    }

    setSaving(true);

    try {
      if (mode === "mock") {
        const now = new Date().toISOString();

        const item: ProductLibraryItem = {
          id: `library_${Date.now()}`,
          userId: "mock",
          ...form,
          description: form.description || null,
          targetAudience: form.targetAudience || null,
          painPoints: form.painPoints || null,
          benefits: form.benefits || null,
          keywords: form.keywords || null,
          tags: form.tags || null,
          offer: form.offer || null,
          cta: form.cta || null,
          priceRange: form.priceRange || null,
          productUrl: form.productUrl || null,
          coverImageUrl: form.coverImageUrl || null,
          createdAt: now,
          updatedAt: now,
        };

        setItems((current) => [item, ...current]);
        setModalOpen(false);
        toast("Mock product added");
        return;
      }

      const response = await productLibrary.create(form);
      setItems((current) => [response.item, ...current]);
      setModalOpen(false);
      toast("Product added to library");
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: ProductLibraryItem) {
    const confirmed = window.confirm(`Delete "${item.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      if (mode === "live") {
        await productLibrary.delete(item.id);
      }

      setItems((current) =>
        current.filter((entry) => entry.id !== item.id),
      );

      toast("Product removed", "info");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  return (
    <AppShell
      title="Product Library"
      eyebrow="Revenue Inventory"
      actions={<Button onClick={openCreate}>+ Add Product</Button>}
    >
      <Card>
        <h2 className="text-xl font-semibold text-white">
          Product Library
        </h2>
        <p className="mt-2 text-sm text-white/65">
          Store the ebooks, courses, SaaS offers, templates, affiliate items,
          and future product ideas the app should use when deciding what to
          promote or what gaps exist in the market.
        </p>
      </Card>

      {loading ? (
        <Card>
          <div className="text-sm text-white/65">
            Loading product library…
          </div>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="No products in the library yet"
          body="Add a few real products first. The Product Opportunity Engine will use them to recommend what to promote and what new products may be worth creating."
          action={<Button onClick={openCreate}>+ Add First Product</Button>}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    {item.name}
                  </h2>
                  <Badge tone="violet">{item.productType}</Badge>
                  <Badge tone="emerald">{item.status}</Badge>
                </div>

                <p className="text-sm text-white/65">
                  {item.description || "No description added yet."}
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <Info
                    label="Revenue Lane"
                    value={item.revenueLane || "—"}
                  />
                  <Info
                    label="Priority"
                    value={String(item.promotionPriority)}
                  />
                  <Info
                    label="Audience"
                    value={item.targetAudience || "—"}
                  />
                  <Info
                    label="CTA"
                    value={item.cta || "—"}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => void deleteItem(item)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Product to Library"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void createItem()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Add Product"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Product Name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="e.g. The Simple Digital Path"
            autoFocus
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Product Type"
              value={form.productType}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  productType: value as ProductLibraryItem["productType"],
                }))
              }
              options={[
                "ebook",
                "template",
                "course",
                "program",
                "saas",
                "affiliate_product",
                "lead_magnet",
                "service",
                "other",
              ]}
            />

            <Select
              label="Revenue Lane"
              value={form.revenueLane}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  revenueLane:
                    value as Exclude<ProductLibraryItem["revenueLane"], null>,
                }))
              }
              options={[
                "digital_products",
                "courses_programs",
                "saas",
                "tiktok_affiliate",
                "amazon_affiliate",
                "lead_generation",
                "other",
              ]}
            />
          </div>

          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <Textarea
            label="Target Audience"
            value={form.targetAudience}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                targetAudience: event.target.value,
              }))
            }
          />

          <Textarea
            label="Pain Points"
            value={form.painPoints}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                painPoints: event.target.value,
              }))
            }
          />

          <Textarea
            label="Benefits"
            value={form.benefits}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                benefits: event.target.value,
              }))
            }
          />

          <Input
            label="Keywords"
            value={form.keywords}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                keywords: event.target.value,
              }))
            }
            placeholder="Comma-separated keywords"
          />

          <Input
            label="Tags"
            value={form.tags}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tags: event.target.value,
              }))
            }
          />

          <Textarea
            label="Offer"
            value={form.offer}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                offer: event.target.value,
              }))
            }
          />

          <Input
            label="CTA"
            value={form.cta}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                cta: event.target.value,
              }))
            }
            placeholder="e.g. Download the free guide"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Price Range"
              value={form.priceRange}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priceRange: event.target.value,
                }))
              }
            />

            <Input
              label="Promotion Priority 1–5"
              type="number"
              value={String(form.promotionPriority)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  promotionPriority: Number(event.target.value || 3),
                }))
              }
            />
          </div>

          <Input
            label="Product URL"
            value={form.productUrl}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                productUrl: event.target.value,
              }))
            }
          />

          <Input
            label="Cover Image URL"
            value={form.coverImageUrl}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                coverImageUrl: event.target.value,
              }))
            }
          />
        </div>
      </Modal>
    </AppShell>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="space-y-2">
      <div className="text-sm font-medium text-white/75">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-2 text-sm text-white/70">{value}</div>
    </div>
  );
}
