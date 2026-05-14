import { useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState, Input, Modal, Textarea } from "../ui/Primitives";
import {
  brandVoices,
  friendlyError,
  type BrandVoiceProfile,
} from "../lib/apiClient";
import { mockBrandVoiceProfiles } from "../mock/data";

type BrandVoiceForm = {
  brandName: string;
  businessType: string;
  targetAudience: string;
  primaryOffer: string;
  toneOfVoice: string;
  valueProposition: string;
  preferredCtas: string;
  bannedPhrases: string;
  differentiators: string;
  notes: string;
};

const EMPTY_FORM: BrandVoiceForm = {
  brandName: "",
  businessType: "",
  targetAudience: "",
  primaryOffer: "",
  toneOfVoice: "",
  valueProposition: "",
  preferredCtas: "",
  bannedPhrases: "",
  differentiators: "",
  notes: "",
};

export function BrandVoicesPage() {
  const { mode, toast, navigate } = useApp();
  const [profiles, setProfiles] = useState<BrandVoiceProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BrandVoiceProfile | null>(null);
  const [form, setForm] = useState<BrandVoiceForm>(EMPTY_FORM);

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [profiles]
  );

  useEffect(() => {
    if (mode === "mock") {
      setProfiles(
        mockBrandVoiceProfiles.map((profile) => ({
          ...profile,
          businessType: profile.businessType ?? null,
          targetAudience: profile.targetAudience ?? null,
          primaryOffer: profile.primaryOffer ?? null,
          toneOfVoice: profile.toneOfVoice ?? null,
          valueProposition: profile.valueProposition ?? null,
          preferredCtas: profile.preferredCtas ?? null,
          bannedPhrases: profile.bannedPhrases ?? null,
          differentiators: profile.differentiators ?? null,
          notes: profile.notes ?? null,
        }))
      );
      return;
    }

    void loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function loadProfiles() {
    setLoading(true);
    try {
      const response = await brandVoices.list();
      setProfiles(response.profiles);
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingProfile(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(profile: BrandVoiceProfile) {
    setEditingProfile(profile);
    setForm({
      brandName: profile.brandName ?? "",
      businessType: profile.businessType ?? "",
      targetAudience: profile.targetAudience ?? "",
      primaryOffer: profile.primaryOffer ?? "",
      toneOfVoice: profile.toneOfVoice ?? "",
      valueProposition: profile.valueProposition ?? "",
      preferredCtas: profile.preferredCtas ?? "",
      bannedPhrases: profile.bannedPhrases ?? "",
      differentiators: profile.differentiators ?? "",
      notes: profile.notes ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProfile(null);
    setForm(EMPTY_FORM);
  }

  async function saveProfile() {
    if (!form.brandName.trim() || saving) return;

    setSaving(true);

    try {
      if (mode === "mock") {
        const timestamp = new Date().toISOString();

        if (editingProfile) {
          setProfiles((current) =>
            current.map((profile) =>
              profile.id === editingProfile.id
                ? {
                    ...profile,
                    ...normalizeForm(form),
                    updatedAt: timestamp,
                  }
                : profile
            )
          );
          toast("Brand Voice Profile updated");
        } else {
          const newProfile: BrandVoiceProfile = {
            id: `bv_${Date.now()}`,
            userId: "u_demo",
            ...normalizeForm(form),
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          setProfiles((current) => [newProfile, ...current]);
          toast("Brand Voice Profile created");
        }

        closeModal();
        return;
      }

      if (editingProfile) {
        const response = await brandVoices.update(editingProfile.id, normalizeForm(form));
        setProfiles((current) =>
          current.map((profile) => (profile.id === editingProfile.id ? response.profile : profile))
        );
        toast("Brand Voice Profile updated");
      } else {
        const response = await brandVoices.create({
          brandName: form.brandName.trim(),
          ...normalizeForm(form),
        });
        setProfiles((current) => [response.profile, ...current]);
        toast("Brand Voice Profile created");
      }

      closeModal();
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile(profile: BrandVoiceProfile) {
    const confirmed = window.confirm(`Delete "${profile.brandName}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      if (mode === "live") {
        await brandVoices.delete(profile.id);
      }

      setProfiles((current) => current.filter((entry) => entry.id !== profile.id));
      toast("Brand Voice Profile deleted", "info");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  return (
    <AppShell
      title="Brand Voice Profiles"
      subtitle="Reusable messaging context for Chat, Workflows, Campaigns, Automations, and future Video Studio briefs."
      action={<Button onClick={openCreate}>+ New Brand Profile</Button>}
    >
      <div className="space-y-6">
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Insight
              icon="🎙️"
              title="Consistency"
              description="Lock in tone, positioning, CTAs, and differentiators once."
            />
            <Insight
              icon="🧠"
              title="Better AI context"
              description="Profiles help every future AI layer sound less generic."
            />
            <Insight
              icon="🗂️"
              title="Project-ready"
              description="Campaign Workspaces can attach a profile for reuse."
            />
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="text-sm text-white/55">Loading Brand Voice Profiles…</div>
          </Card>
        ) : sortedProfiles.length === 0 ? (
          <Card>
            <EmptyState
              icon="🎙️"
              title="No Brand Voice Profiles yet"
              description="Create one reusable profile to improve consistency across the new Chief of Staff operating layer."
              action={<Button onClick={openCreate}>+ Create Brand Profile</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {sortedProfiles.map((profile) => (
              <Card key={profile.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">{profile.brandName}</h2>
                      {profile.businessType ? <Badge>{profile.businessType}</Badge> : null}
                    </div>

                    <p className="mt-3 text-sm text-white/60">
                      {profile.valueProposition || "No value proposition added yet."}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" onClick={() => openEdit(profile)}>
                      Edit
                    </Button>
                    <Button variant="secondary" onClick={() => void deleteProfile(profile)}>
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <ProfileField label="Target Audience" value={profile.targetAudience} />
                  <ProfileField label="Primary Offer" value={profile.primaryOffer} />
                  <ProfileField label="Tone" value={profile.toneOfVoice} />
                  <ProfileField label="Preferred CTAs" value={profile.preferredCtas} />
                  <ProfileField label="Avoid" value={profile.bannedPhrases} />
                  <ProfileField label="Differentiators" value={profile.differentiators} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate("projects", { brandVoiceProfileId: profile.id })}
                  >
                    Use in Campaign
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("chief-chat", { brandVoiceProfileId: profile.id })}
                  >
                    Open Chat with Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingProfile ? "Edit Brand Voice Profile" : "New Brand Voice Profile"}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void saveProfile()}>
              {editingProfile ? "Save Changes" : "Create Profile"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Brand name"
            value={form.brandName}
            onChange={(event) => setForm((current) => ({ ...current, brandName: event.target.value }))}
            placeholder="e.g. Glow Skincare"
            autoFocus
          />

          <Input
            label="Business type / industry"
            value={form.businessType}
            onChange={(event) => setForm((current) => ({ ...current, businessType: event.target.value }))}
            placeholder="e.g. Beauty / DTC"
          />

          <Textarea
            label="Target audience"
            rows={3}
            value={form.targetAudience}
            onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))}
            placeholder="Who are you speaking to?"
          />

          <Textarea
            label="Primary offer"
            rows={3}
            value={form.primaryOffer}
            onChange={(event) => setForm((current) => ({ ...current, primaryOffer: event.target.value }))}
            placeholder="What are you selling or promoting?"
          />

          <Textarea
            label="Tone of voice"
            rows={3}
            value={form.toneOfVoice}
            onChange={(event) => setForm((current) => ({ ...current, toneOfVoice: event.target.value }))}
            placeholder="Helpful, direct, premium, warm, no-hype..."
          />

          <Textarea
            label="Value proposition"
            rows={3}
            value={form.valueProposition}
            onChange={(event) => setForm((current) => ({ ...current, valueProposition: event.target.value }))}
            placeholder="Why should someone choose this brand?"
          />

          <Textarea
            label="Preferred CTAs"
            rows={2}
            value={form.preferredCtas}
            onChange={(event) => setForm((current) => ({ ...current, preferredCtas: event.target.value }))}
            placeholder="Book a call, start free, tap the link in bio..."
          />

          <Textarea
            label="Banned phrases / words to avoid"
            rows={2}
            value={form.bannedPhrases}
            onChange={(event) => setForm((current) => ({ ...current, bannedPhrases: event.target.value }))}
            placeholder="Words or claims the assistant should avoid."
          />

          <Textarea
            label="Differentiators"
            rows={3}
            value={form.differentiators}
            onChange={(event) => setForm((current) => ({ ...current, differentiators: event.target.value }))}
            placeholder="What makes the offer or brand meaningfully different?"
          />

          <Textarea
            label="Optional notes"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Extra details future AI prompts should know."
          />
        </div>
      </Modal>
    </AppShell>
  );
}

function normalizeForm(form: BrandVoiceForm) {
  return {
    brandName: form.brandName.trim(),
    businessType: form.businessType.trim() || null,
    targetAudience: form.targetAudience.trim() || null,
    primaryOffer: form.primaryOffer.trim() || null,
    toneOfVoice: form.toneOfVoice.trim() || null,
    valueProposition: form.valueProposition.trim() || null,
    preferredCtas: form.preferredCtas.trim() || null,
    bannedPhrases: form.bannedPhrases.trim() || null,
    differentiators: form.differentiators.trim() || null,
    notes: form.notes.trim() || null,
  };
}

function Insight({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-2xl">{icon}</div>
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-white/55">{description}</p>
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">{label}</div>
      <div className="mt-2 text-sm text-white/70">{value || "—"}</div>
    </div>
  );
}
