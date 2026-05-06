// Library System — Prompt #9
// The full project + saved-output system: DB, queries, routes, React, state.
// Every code block here mirrors a real file in the repo.

export type LibBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "callout"; tone: "info" | "warn" | "success" | "danger"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "filecode"; path: string; lang: string; description: string; code: string }
  | { type: "feature"; title: string; what: string; ui: string; api: string; query: string };

export type LibSection = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  icon: string;
  blocks: LibBlock[];
};

export const librarySpec: LibSection[] = [
  // 0. Overview
  {
    id: "overview",
    number: "00",
    title: "What This System Does",
    tagline: "Everything a user can do with projects and saved outputs — end to end.",
    icon: "📚",
    blocks: [
      {
        type: "p",
        text: "This prompt locks in the persistence layer of the app: the user creates a project, adds product info, generates outputs, saves them, then later finds, edits, copies, or deletes them. Every action below has database, API, and UI code behind it — all already shipped in the repo.",
      },
      {
        type: "feature",
        title: "Create a project",
        what: "Group all assets for one business or product line.",
        ui: "Projects page → 'New Project' button → modal with emoji + name + niche.",
        api: "POST /api/projects",
        query: "prisma.project.create({ data })",
      },
      {
        type: "feature",
        title: "Add product info",
        what: "Store the inputs that pre-fill every generator form.",
        ui: "Project Detail page → 'Add Product' → form with name, audience, pain, price.",
        api: "POST /api/projects/:projectId/products",
        query: "prisma.product.create({ data })",
      },
      {
        type: "feature",
        title: "Generate marketing output",
        what: "Run any of the 15 AI templates against a product's data.",
        ui: "New Task page → template selector → form → Generate button.",
        api: "POST /api/generate/:skill",
        query: "tasks.create + chat() + tasks.update + credits.decrement",
      },
      {
        type: "feature",
        title: "Save output under a project",
        what: "Persist the AI result to the user's library, scoped to a project.",
        ui: "New Task page → '💾 Save to Library' button after generation.",
        api: "POST /api/outputs",
        query: "prisma.output.create({ data })",
      },
      {
        type: "feature",
        title: "View saved outputs (with filters)",
        what: "Search by title, filter by project + type, count badges everywhere.",
        ui: "Saved Outputs page → search box, project dropdown, type dropdown, active filter chips.",
        api: "GET /api/outputs?search=&projectId=&type=",
        query: "prisma.output.findMany({ where, orderBy, include })",
      },
      {
        type: "feature",
        title: "Edit output title or content",
        what: "Inline edit mode with a Markdown textarea; preview returns on save.",
        ui: "Output detail modal → '✏️ Edit' → save changes button (disabled when not dirty).",
        api: "PATCH /api/outputs/:id",
        query: "prisma.output.update({ where, data })",
      },
      {
        type: "feature",
        title: "Copy output",
        what: "One-click copy of the Markdown, with visual confirmation.",
        ui: "Detail modal + every output card → CopyButton → '✓ Copied' for 1.5s.",
        api: "(no API call — clipboard only)",
        query: "navigator.clipboard.writeText(content)",
      },
      {
        type: "feature",
        title: "Delete output",
        what: "Two-step confirm to prevent accidents.",
        ui: "Detail modal → '🗑️ Delete' → 'Are you sure?' → 'Yes, delete forever'.",
        api: "DELETE /api/outputs/:id",
        query: "prisma.output.delete({ where })",
      },
      {
        type: "feature",
        title: "Filter outputs by type",
        what: "Drop a type and instantly see only TikTok scripts (or emails, etc.).",
        ui: "Saved Outputs page → type dropdown shows '🎵 TikTok Script (12)' style counts.",
        api: "GET /api/outputs?type=tiktok_script",
        query: "prisma.output.findMany({ where: { type } })",
      },
      {
        type: "callout",
        tone: "success",
        title: "All 9 features are live right now",
        text: "Open the App tab → flip to '🟢 Live API' (or stay in mock mode), generate something, save it, then go to Saved Outputs to filter, edit, copy, and delete. Every action you take fires a real fetch to /api/outputs in live mode.",
      },
    ],
  },

  // 1. Database structure
  {
    id: "schema",
    number: "01",
    title: "Database Structure",
    tagline: "Three tables you need: projects, products, outputs.",
    icon: "🗄️",
    blocks: [
      {
        type: "p",
        text: "The data model is intentionally small. A user owns many projects. A project owns many products and many outputs. An output optionally belongs to a product (so it stays linked even if the product gets renamed). Every relation cascades sensibly — delete a project, you delete its products too. Delete a product but keep its outputs by setting productId to null.",
      },
      {
        type: "filecode",
        path: "server/prisma/schema.prisma (relevant slice)",
        lang: "prisma",
        description: "The 3 tables that make the library work.",
        code: `model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  niche       String?
  brandVoice  String?
  emoji       String?  @default("✨")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  products Product[]
  outputs  Output[]

  @@index([userId])
}

model Product {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  description String
  audience    String?
  painPoint   String?
  benefits    String?
  price       String?
  offerType   String?
  cta         String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  outputs Output[]

  @@index([projectId])
}

model Output {
  id            String   @id @default(cuid())
  userId        String
  projectId     String?
  productId     String?
  type          String                 // tiktok_script | email_sequence | …
  title         String
  content       String                 // Markdown
  inputSnapshot Json                   // copy of intake form for re-runs
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([projectId])
}`,
      },
      {
        type: "table",
        headers: ["Decision", "Reason"],
        rows: [
          ["projectId is OPTIONAL on Output", "Lets users generate ad-hoc without committing to a project. They can assign one later."],
          ["onDelete: Cascade for User → Project", "Account deletion wipes all data — clean GDPR story."],
          ["onDelete: SetNull for Project → Output", "Deleting a project keeps its outputs (rare but useful for migration)."],
          ["inputSnapshot stored as JSON", "User can hit 'Regenerate' weeks later with the exact original form data."],
          ["@@index([userId, createdAt])", "Composite index — every query filters by user + sorts by date. One disk seek."],
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Why this is future-proof",
        text: "Adding things later: brand voice profiles? Add a column to Project. Tags on outputs? Add a String[] field. Versioned edits? Add a parentId pointing to an earlier Output. The schema gives you room without forcing you to over-build today.",
      },
    ],
  },

  // 2. Supabase / Postgres queries
  {
    id: "queries",
    number: "02",
    title: "Database Queries (Prisma)",
    tagline: "Type-safe queries that work against any Postgres — Render, Supabase, Neon.",
    icon: "🔍",
    blocks: [
      {
        type: "p",
        text: "We use Prisma ORM, not the Supabase JS client. Reason: Prisma stays portable. The same code works against Render Postgres, Supabase Postgres, Neon, or any other Postgres host — only the DATABASE_URL env var changes. Everything below maps to one or two lines of real SQL.",
      },
      {
        type: "h",
        text: "List all projects for the current user (with counts)",
      },
      {
        type: "code",
        lang: "ts",
        code: `await prisma.project.findMany({
  where: { userId: req.user!.id },        // tenant isolation, ALWAYS
  orderBy: { createdAt: "desc" },
  include: {
    _count: { select: { products: true, outputs: true } },
  },
});
// SQL: SELECT … LEFT JOIN with COUNT() — single round trip.`,
      },
      {
        type: "h",
        text: "Save a new output (with project ownership check)",
      },
      {
        type: "code",
        lang: "ts",
        code: `// 1. Verify the projectId belongs to the user (cross-tenant safety)
if (data.projectId) {
  const owns = await prisma.project.findFirst({
    where: { id: data.projectId, userId: req.user!.id },
    select: { id: true },
  });
  if (!owns) throw errors.forbidden("Project does not belong to you");
}

// 2. Insert
const output = await prisma.output.create({
  data: { ...data, userId: req.user!.id },
});`,
      },
      {
        type: "h",
        text: "List outputs with optional filters",
      },
      {
        type: "code",
        lang: "ts",
        code: `const { projectId, type, search, limit } = req.query;

const outputs = await prisma.output.findMany({
  where: {
    userId: req.user!.id,                              // tenant isolation
    ...(projectId ? { projectId } : {}),
    ...(type ? { type } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
  },
  orderBy: { createdAt: "desc" },
  take: limit,
  include: { project: { select: { name: true, emoji: true } } },
});`,
      },
      {
        type: "h",
        text: "Edit an output (with ownership check)",
      },
      {
        type: "code",
        lang: "ts",
        code: `// 1. Confirm the user owns this output BEFORE updating
const owns = await prisma.output.findFirst({
  where: { id: req.params.id, userId: req.user!.id },
  select: { id: true },
});
if (!owns) throw errors.notFound("Output not found");

// 2. Update only the fields they sent
await prisma.output.update({
  where: { id: owns.id },
  data: { title?, content? },
});`,
      },
      {
        type: "h",
        text: "Delete an output (same ownership pattern)",
      },
      {
        type: "code",
        lang: "ts",
        code: `const owns = await prisma.output.findFirst({
  where: { id: req.params.id, userId: req.user!.id },
  select: { id: true },
});
if (!owns) throw errors.notFound("Output not found");

await prisma.output.delete({ where: { id: owns.id } });`,
      },
      {
        type: "callout",
        tone: "danger",
        title: "The ONE rule that stops the worst bug",
        text: "Every query that touches a row by id MUST also filter by userId. Never trust an ID from the request body or URL. The pattern above (findFirst with both id AND userId) is the wall between user A and user B's data. Apply it everywhere.",
      },
      {
        type: "h",
        text: "Equivalent in Supabase JS (if you ever switch)",
      },
      {
        type: "code",
        lang: "ts",
        code: `// Same query in Supabase JS — just for reference. Prisma is cleaner.
const { data, error } = await supabase
  .from("outputs")
  .select("*, project:projects(name, emoji)")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(50);`,
      },
    ],
  },

  // 3. API routes
  {
    id: "routes",
    number: "03",
    title: "API Routes",
    tagline: "Eight endpoints. The whole library system in one router file.",
    icon: "🛰️",
    blocks: [
      {
        type: "table",
        headers: ["Method", "Path", "What it does"],
        rows: [
          ["POST",   "/api/projects",                              "Create project"],
          ["GET",    "/api/projects",                              "List my projects"],
          ["GET",    "/api/projects/:id",                          "Get one (with products + outputs)"],
          ["DELETE", "/api/projects/:id",                          "Delete project (cascades products)"],
          ["POST",   "/api/projects/:projectId/products",          "Add product to project"],
          ["GET",    "/api/outputs?projectId=&type=&search=",      "List outputs (filterable)"],
          ["POST",   "/api/outputs",                               "Save a new output"],
          ["PATCH",  "/api/outputs/:id",                           "Edit title or content"],
          ["DELETE", "/api/outputs/:id",                           "Delete output"],
        ],
      },
      {
        type: "filecode",
        path: "server/src/routes/outputs.routes.ts",
        lang: "ts",
        description: "The complete library router. Reads, writes, edits, deletes — all 5 actions in one file.",
        code: `import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { errors } from "../lib/errors.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  projectId:     z.string().cuid().optional(),
  productId:     z.string().cuid().optional(),
  type:          z.string().min(1),
  title:         z.string().min(1).max(200),
  content:       z.string().min(1),
  inputSnapshot: z.record(z.unknown()).default({}),
});

const querySchema = z.object({
  projectId: z.string().optional(),
  type:      z.string().optional(),
  search:    z.string().optional(),
  limit:     z.coerce.number().int().min(1).max(100).default(50),
});

// LIST with filters
router.get("/", async (req, res, next) => {
  try {
    const { projectId, type, search, limit } = querySchema.parse(req.query);
    const outputs = await prisma.output.findMany({
      where: {
        userId: req.user!.id,
        ...(projectId ? { projectId } : {}),
        ...(type      ? { type }      : {}),
        ...(search    ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { project: { select: { name: true, emoji: true } } },
    });
    res.json({ outputs: outputs.map((o) => ({
      id: o.id, type: o.type, title: o.title, content: o.content,
      projectId: o.projectId, projectName: o.project?.name ?? null, projectEmoji: o.project?.emoji ?? null,
      createdAt: o.createdAt,
    })) });
  } catch (e) { next(e); }
});

// CREATE
router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (data.projectId) {
      const owns = await prisma.project.findFirst({
        where: { id: data.projectId, userId: req.user!.id }, select: { id: true },
      });
      if (!owns) throw errors.forbidden("Project does not belong to you");
    }
    const output = await prisma.output.create({ data: { ...data, userId: req.user!.id } });
    res.status(201).json({ output });
  } catch (e) { next(e); }
});

// EDIT
router.patch("/:id", async (req, res, next) => {
  try {
    const data = z.object({
      title:   z.string().min(1).max(200).optional(),
      content: z.string().min(1).optional(),
    }).parse(req.body);
    const owns = await prisma.output.findFirst({
      where: { id: req.params.id, userId: req.user!.id }, select: { id: true },
    });
    if (!owns) throw errors.notFound("Output not found");
    const updated = await prisma.output.update({ where: { id: owns.id }, data });
    res.json({ output: updated });
  } catch (e) { next(e); }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const owns = await prisma.output.findFirst({
      where: { id: req.params.id, userId: req.user!.id }, select: { id: true },
    });
    if (!owns) throw errors.notFound("Output not found");
    await prisma.output.delete({ where: { id: owns.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;`,
      },
    ],
  },

  // 4. React components
  {
    id: "components",
    number: "04",
    title: "React Components",
    tagline: "Five components do all the heavy lifting.",
    icon: "🧩",
    blocks: [
      {
        type: "table",
        headers: ["Component", "File", "Job"],
        rows: [
          ["SavedOutputsPage",   "src/app/pages/SavedOutputsPage.tsx",   "Container — filters, grid, modal"],
          ["OutputCard",         "(same file)",                          "Each grid tile — icon, title, preview, date"],
          ["OutputDetailModal",  "(same file)",                          "Read / edit / copy / delete inside one modal"],
          ["FilterTag",          "(same file)",                          "Active filter pills with × clear button"],
          ["Markdown",           "src/app/ui/Markdown.tsx",              "Renders the AI's Markdown back to formatted UI"],
          ["CopyButton",         "src/app/ui/Primitives.tsx",            "1-click copy with '✓ Copied' feedback"],
          ["Modal / Input / Textarea / Badge", "src/app/ui/Primitives.tsx", "Layout primitives — reused everywhere"],
        ],
      },
      {
        type: "filecode",
        path: "src/app/pages/SavedOutputsPage.tsx (the page container)",
        lang: "tsx",
        description: "The shell that holds filters + grid + modal. State stays local except saved outputs (in AppContext).",
        code: `export function SavedOutputsPage() {
  const { params, outputs, projects, navigate, deleteOutput, updateOutput, toast } = useApp();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(params.outputId ?? null);

  // Open the modal directly if we navigated in with ?outputId=…
  useEffect(() => { if (params.outputId) setOpenId(params.outputId); }, [params.outputId]);

  // CLIENT-SIDE filtering — fast on lists < 1000. Server-side kicks in via API params later.
  const filtered = useMemo(() => outputs.filter((o) => {
    if (search && !o.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (projectFilter !== "all" && o.projectId !== projectFilter) return false;
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    return true;
  }), [outputs, search, projectFilter, typeFilter]);

  // Live counts shown in the type dropdown ('🎵 TikTok Script (12)')
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    outputs.forEach((o) => { m[o.type] = (m[o.type] ?? 0) + 1; });
    return m;
  }, [outputs]);

  return (
    <AppShell title="Saved Outputs" subtitle={\`\${outputs.length} total · \${filtered.length} shown\`}
              action={<Button size="md" onClick={() => navigate("new-task")}>✨ New Task</Button>}>
      <FilterBar … />
      {filtered.length === 0
        ? <EmptyState … />
        : <Grid>{filtered.map((o) => <OutputCard key={o.id} output={o} onClick={() => setOpenId(o.id)} />)}</Grid>}
      <OutputDetailModal output={opened} onClose={…} onSave={…} onDelete={…} />
    </AppShell>
  );
}`,
      },
      {
        type: "filecode",
        path: "src/app/pages/SavedOutputsPage.tsx (the detail modal)",
        lang: "tsx",
        description: "Two-state modal: read mode shows rendered Markdown + Copy/Edit/Delete; edit mode shows two textareas + Save.",
        code: `function OutputDetailModal({ output, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(output?.title ?? "");
  const [content, setContent] = useState(output?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset edit state whenever a different output is opened
  useEffect(() => {
    setTitle(output?.title ?? "");
    setContent(output?.content ?? "");
    setEditing(false);
    setConfirmDelete(false);
  }, [output?.id]);

  if (!output) return null;
  const dirty = title !== output.title || content !== output.content;

  return (
    <Modal open onClose={onClose} title={editing ? "Edit output" : output.title} size="lg" footer={
      editing ? (
        <>
          <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
          <Button loading={saving} disabled={!dirty || !title.trim() || !content.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                // Only send the fields that actually changed
                await onSave({
                  ...(title   !== output.title   ? { title }   : {}),
                  ...(content !== output.content ? { content } : {}),
                });
                setEditing(false);
              } finally { setSaving(false); }
            }}>
            Save changes
          </Button>
        </>
      ) : confirmDelete ? (
        <>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep it</Button>
          <Button variant="danger" onClick={onDelete}>Yes, delete forever</Button>
        </>
      ) : (
        <>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>🗑️ Delete</Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>✏️ Edit</Button>
          <CopyButton text={output.content} label="Copy Markdown" />
          <Button onClick={onClose}>Close</Button>
        </>
      )
    }>
      {/* Badges + char count */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge tone="violet">{outputTypeLabels[output.type]?.label}</Badge>
        <Badge tone="info">{output.projectName}</Badge>
        <Badge tone="neutral">{new Date(output.createdAt).toLocaleString()}</Badge>
        <span className="text-[11px] text-white/30 ml-auto">{output.content.length} chars</span>
      </div>

      {confirmDelete && <DangerBanner />}

      {editing ? (
        <div className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} hint={\`\${title.length}/200\`} />
          <Textarea label="Content (Markdown)" value={content} onChange={(e) => setContent(e.target.value)} rows={16} className="font-mono text-[12.5px]" />
        </div>
      ) : (
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
          <Markdown content={output.content} />
        </div>
      )}
    </Modal>
  );
}`,
      },
      {
        type: "callout",
        tone: "success",
        title: "Why one modal does read AND edit",
        text: "A separate edit page would force a router transition + lose context. One modal with a state toggle keeps the user 'in their library' the whole time. The Save button stays disabled until something actually changes (the `dirty` check) — so users can't accidentally save no-op patches.",
      },
    ],
  },

  // 5. State management
  {
    id: "state",
    number: "05",
    title: "State Management Approach",
    tagline: "React Context for shared data, useState for local UI. No Redux. No Zustand.",
    icon: "🧠",
    blocks: [
      {
        type: "p",
        text: "For an MVP this size, React Context + useState beats any state library. The rule: anything that changes when an API call returns lives in AppContext. Anything that's just for one screen (filter text, modal open/close, edit-mode toggle) stays as local useState. Zero boilerplate, zero learning curve.",
      },
      {
        type: "table",
        headers: ["Lives in AppContext (global)", "Lives as useState (local)"],
        rows: [
          ["user, projects, outputs, products", "search input value"],
          ["isAuthed, mode, draft", "projectFilter, typeFilter"],
          ["toasts", "modal open/close (openId)"],
          ["loadingData", "edit mode toggle"],
          ["saveOutput / updateOutput / deleteOutput", "form field values mid-edit"],
          ["createProject, runGeneration", "saving spinner state"],
        ],
      },
      {
        type: "filecode",
        path: "src/app/AppContext.tsx (the library mutation slice)",
        lang: "ts",
        description: "Three async mutations. Each one updates server first (in live mode), then mirrors the change locally so the UI re-renders instantly.",
        code: `const saveOutput = useCallback(async (data) => {
  if (mode === "mock") {
    const o = { ...data, id: \`o_\${Date.now()}\`, userId: user.id, createdAt: new Date().toISOString() };
    setOutputs((prev) => [o, ...prev]);
    return o;
  }
  const { output } = await outputsApi.create({
    projectId: data.projectId || undefined,
    type: data.type, title: data.title, content: data.content,
  });
  const mapped = toMockOutput(output);
  mapped.projectName = data.projectName;
  setOutputs((prev) => [mapped, ...prev]);   // optimistic-ish update
  return mapped;
}, [mode, user.id]);

const updateOutput = useCallback(async (id, patch) => {
  if (mode === "live") await outputsApi.update(id, patch);
  setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
}, [mode]);

const deleteOutput = useCallback(async (id) => {
  if (mode === "live") await outputsApi.delete(id);
  setOutputs((prev) => prev.filter((o) => o.id !== id));
}, [mode]);`,
      },
      {
        type: "callout",
        tone: "info",
        title: "When to graduate to a real query library",
        text: "When you have > 200 outputs per user and want pagination + infinite scroll + cache invalidation, swap setOutputs() for TanStack Query. Until then, keeping the array in Context is faster to build, easier to debug, and ships in 1 file.",
      },
    ],
  },

  // 6. Full code: end-to-end flow
  {
    id: "fullflow",
    number: "06",
    title: "Full Code — Save Flow End-to-End",
    tagline: "User clicks 💾 Save. Trace it through every file.",
    icon: "🔁",
    blocks: [
      {
        type: "filecode",
        path: "1. src/app/pages/NewTaskPage.tsx (the click handler)",
        lang: "tsx",
        description: "The save button calls saveOutput() with form data + AI output.",
        code: `const onSave = async () => {
  if (!output || !activeTemplate) return;
  const project = projects.find((p) => p.id === projectId);
  try {
    await saveOutput({
      projectId,
      projectName: project?.name ?? "—",
      type: templateId,
      title: \`\${activeTemplate.name} — \${form.product_name || "Untitled"}\`,
      content: output,
    });
    setSaved(true);
    toast("Saved to library");
  } catch (e) {
    toast(e instanceof Error ? e.message : "Could not save", "danger");
  }
};`,
      },
      {
        type: "filecode",
        path: "2. src/app/AppContext.tsx (delegates to apiClient)",
        lang: "ts",
        description: "Live mode: real API call. Mock mode: pure local insert. Both append to the in-memory array.",
        code: `const saveOutput = useCallback(async (data) => {
  if (mode === "mock") {
    const o = { ...data, id: \`o_\${Date.now()}\`, userId: user.id, createdAt: new Date().toISOString() };
    setOutputs((prev) => [o, ...prev]);
    return o;
  }
  const { output } = await outputsApi.create({
    projectId: data.projectId || undefined,
    type: data.type, title: data.title, content: data.content,
  });
  const mapped = toMockOutput(output);
  mapped.projectName = data.projectName;
  setOutputs((prev) => [mapped, ...prev]);
  return mapped;
}, [mode, user.id]);`,
      },
      {
        type: "filecode",
        path: "3. src/app/lib/apiClient.ts (the typed fetch helper)",
        lang: "ts",
        description: "Single file owns the URL + cookie + JSON. The whole frontend goes through it.",
        code: `export const outputs = {
  list:   (params) => api(\`/api/outputs?\${new URLSearchParams(params)}\`),
  create: (data)   => api("/api/outputs",        { method: "POST",   body: data }),
  update: (id, d)  => api(\`/api/outputs/\${id}\`, { method: "PATCH",  body: d }),
  delete: (id)     => api(\`/api/outputs/\${id}\`, { method: "DELETE" }),
};

async function api(path, opts = {}) {
  const res = await fetch(\`\${BASE_URL}\${path}\`, {
    method: opts.method ?? "GET",
    credentials: "include",                                  // sends JWT cookie
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  // … error normalization → throw ApiException
  return res.json();
}`,
      },
      {
        type: "filecode",
        path: "4. server/src/routes/outputs.routes.ts (Express receives)",
        lang: "ts",
        description: "Validates with Zod, verifies project ownership, inserts.",
        code: `router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);                      // Zod
    if (data.projectId) {
      const owns = await prisma.project.findFirst({
        where: { id: data.projectId, userId: req.user!.id }, select: { id: true },
      });
      if (!owns) throw errors.forbidden("Project does not belong to you");
    }
    const output = await prisma.output.create({
      data: { ...data, userId: req.user!.id },
    });
    res.status(201).json({ output });
  } catch (e) { next(e); }
});`,
      },
      {
        type: "filecode",
        path: "5. server/src/lib/prisma.ts (the DB write)",
        lang: "ts",
        description: "Translates to a single parameterized INSERT INTO outputs (…) RETURNING * statement.",
        code: `// Just the singleton — no library code needed for the actual write
import { PrismaClient } from "@prisma/client";
export const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;`,
      },
      {
        type: "callout",
        tone: "success",
        title: "5 files. ~50 lines of meaningful code.",
        text: "That's the whole save pipeline. No global stores, no event buses, no over-engineering. Each file has one job. When the save button breaks, you know exactly where to look.",
      },
    ],
  },

  // 7. Error handling
  {
    id: "errors",
    number: "07",
    title: "Error Handling",
    tagline: "Every failure ends with a useful UI hint, not a stack trace.",
    icon: "🛑",
    blocks: [
      {
        type: "p",
        text: "The library system has 4 layers where things can go wrong. Each layer hands off a clean message to the next, ending in a toast + (when applicable) a banner inside the modal.",
      },
      {
        type: "table",
        headers: ["Failure", "Where caught", "User sees"],
        rows: [
          ["Validation (empty title)",   "Zod in /api/outputs (400)", "Toast: 'Please check the highlighted fields.'"],
          ["Cross-tenant attempt",       "ownership check → throw forbidden", "Toast: 'You don't have access to that.'"],
          ["Project deleted mid-edit",   "ownership findFirst returns null → notFound", "Toast: 'We couldn't find that.'"],
          ["Server down / network",      "fetch throws → ApiException NETWORK", "Toast: 'Can't reach the server.'"],
          ["Out of credits during gen",  "credits.service throws 402",            "Toast + waitlist hint"],
          ["Unknown server crash",       "errorHandler middleware → 500 SERVER_ERROR", "Toast: 'Something went wrong.'"],
        ],
      },
      {
        type: "filecode",
        path: "src/app/lib/apiClient.ts (the friendlyError mapper)",
        lang: "ts",
        description: "Single function turns any ApiException into a sentence the user can act on.",
        code: `export function friendlyError(e: unknown): string {
  if (e instanceof ApiException) {
    switch (e.code) {
      case "NETWORK":         return "Can't reach the server. Is it running?";
      case "VALIDATION":      return "Please check the highlighted fields.";
      case "UNAUTHORIZED":    return "Your session expired. Please sign in again.";
      case "OUT_OF_CREDITS":  return "You're out of credits this month.";
      case "RATE_LIMITED":    return "Slow down — too many requests.";
      case "FORBIDDEN":       return "You don't have access to that.";
      case "NOT_FOUND":       return "We couldn't find that.";
      case "CONFLICT":        return e.message;
      default:                return e.message || "Something went wrong.";
    }
  }
  return "Unexpected error.";
}`,
      },
      {
        type: "filecode",
        path: "src/app/pages/SavedOutputsPage.tsx (the modal save handler)",
        lang: "tsx",
        description: "Try/catch + toast inside the modal. Loading spinner stays put through the round trip.",
        code: `<Button
  loading={saving}
  disabled={!dirty || !title.trim() || !content.trim()}
  onClick={async () => {
    setSaving(true);
    try {
      // Send only the changed fields — server PATCH is partial
      await onSave({
        ...(title   !== output.title   ? { title }   : {}),
        ...(content !== output.content ? { content } : {}),
      });
      setEditing(false);
    } finally {
      setSaving(false);                          // ALWAYS reset, even on error
    }
  }}
>
  Save changes
</Button>`,
      },
      {
        type: "callout",
        tone: "info",
        title: "The 'finally setSaving(false)' rule",
        text: "Always reset loading state in a finally block — never just in the success path. If the API throws, the spinner needs to stop or the user thinks the app is frozen. This one habit prevents 90% of 'why is the button still spinning?' bugs.",
      },
    ],
  },

  // 8. File placement
  {
    id: "files",
    number: "08",
    title: "Where Each File Goes",
    tagline: "Beginner-friendly map of every file involved in the library system.",
    icon: "🗺️",
    blocks: [
      {
        type: "table",
        headers: ["File", "Type", "What it owns"],
        rows: [
          ["server/prisma/schema.prisma",                 "DB schema",      "Project / Product / Output models"],
          ["server/src/routes/outputs.routes.ts",         "API",            "GET / POST / PATCH / DELETE /api/outputs"],
          ["server/src/routes/projects.routes.ts",        "API",            "Project CRUD"],
          ["server/src/routes/products.routes.ts",        "API",            "Product CRUD nested under project"],
          ["src/app/lib/apiClient.ts",                    "Frontend lib",   "outputs.create/update/delete/list helpers"],
          ["src/app/AppContext.tsx",                      "State",          "saveOutput, updateOutput, deleteOutput, createProject"],
          ["src/app/pages/SavedOutputsPage.tsx",          "Page",           "Container, OutputCard, OutputDetailModal, FilterTag"],
          ["src/app/pages/ProjectsPage.tsx",              "Page",           "Project list + 'New Project' modal"],
          ["src/app/pages/ProjectDetailPage.tsx",         "Page",           "Single project view with products + scoped outputs"],
          ["src/app/pages/NewTaskPage.tsx",               "Page",           "Generation form + Save button (writes to library)"],
          ["src/app/ui/Primitives.tsx",                   "UI primitives",  "Modal, Input, Textarea, Button, Badge, CopyButton"],
          ["src/app/ui/Markdown.tsx",                     "UI primitive",   "Renders saved output content"],
        ],
      },
      {
        type: "h",
        text: "If you're starting fresh, build in this order",
      },
      {
        type: "ordered",
        items: [
          "Define schema.prisma (3 models). Run prisma migrate.",
          "Build outputs.routes.ts (POST + GET first; PATCH + DELETE next).",
          "Build apiClient.ts outputs helper.",
          "Add saveOutput() to AppContext.",
          "Wire the Save button on NewTaskPage.",
          "Build SavedOutputsPage with grid + filters (read-only).",
          "Add OutputDetailModal in read mode (Copy + Close).",
          "Add Delete with confirm step.",
          "Add Edit mode (title + content textareas + dirty check).",
          "Polish: empty states, active filter chips, count badges.",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Future-proof checkpoints already baked in",
        text: "1) inputSnapshot stored on every output → enables 'Regenerate from history' later. 2) productId on Output is optional + SetNull → safe to delete products without losing assets. 3) Composite (userId, createdAt) index → ready for 100k+ rows. 4) apiClient.outputs.list takes filter params → ready to swap client-side filtering for server-side pagination.",
      },
      {
        type: "h",
        text: "Try the whole flow now",
      },
      {
        type: "code",
        lang: "bash",
        code: `# 1. App tab → sign out → flip to "🟢 Live API" → sign in
# 2. Click "+ New Project" → name it → confirm
# 3. Click "✨ New Task" → pick a template → fill form → Generate
# 4. Click "💾 Save to Library" → toast confirms
# 5. Sidebar → "📚 Saved Outputs"
# 6. Type in search box → instant filter
# 7. Pick a project from dropdown → instant filter
# 8. Pick a type → see counts inline → instant filter
# 9. Click a card → modal opens with rendered Markdown
# 10. ✏️ Edit → change title → "Save changes" enables → save
# 11. 🗑️ Delete → confirm step → gone
# 12. 📋 Copy Markdown → paste anywhere`,
      },
    ],
  },
];
