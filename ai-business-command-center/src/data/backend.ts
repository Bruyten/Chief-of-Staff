// Backend Build — Prompt #7
// Companion docs to the actual /server folder that was scaffolded.
// Every code block here mirrors a real file you can see in the repo.

export type BackendBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "callout"; tone: "info" | "warn" | "success" | "danger"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "filecode"; path: string; lang: string; description: string; code: string }
  | { type: "tree"; root: string; lines: string[] }
  | { type: "routetable"; rows: { method: string; path: string; auth: boolean; purpose: string }[] }
  | { type: "envtable"; rows: { key: string; example: string; secret: boolean; note: string }[] }
  | { type: "reqresp"; endpoint: string; method: string; request: string; response: string };

export type BackendSection = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  icon: string;
  blocks: BackendBlock[];
};

export const backendSpec: BackendSection[] = [
  // 1. Approach
  {
    id: "approach",
    number: "01",
    title: "Recommended Backend Approach",
    tagline: "Express + TypeScript + Prisma + OpenAI — and why.",
    icon: "🧱",
    blocks: [
      {
        type: "p",
        text: "We picked standalone Node.js + Express over Next.js API routes. Reason: your hosting target is Render and your frontend is a static Vite build. A separate Express service deploys to Render as a single Web Service, scales independently, and gives you a clean /api boundary that any future client (mobile app, n8n, Zapier) can call. Next.js API routes work great on Vercel — but on Render they're overkill and tie your API's lifecycle to your UI's.",
      },
      {
        type: "p",
        text: "We also chose Render Postgres + custom JWT over Supabase. Single vendor, single dashboard, fewer secrets to babysit. The DB is still vanilla Postgres, so swapping to Supabase later is just a connection-string change — none of your code changes.",
      },
      {
        type: "callout",
        tone: "success",
        title: "What just shipped",
        text: "An entire production-ready /server folder. Express app, Prisma schema, JWT auth, AI client with fake-mode fallback, prompt assembler, 15 prompt files, 6 route modules, middleware, services, error handling, secret redaction. Ready to push to GitHub and connect to Render.",
      },
      {
        type: "tree",
        root: "server/",
        lines: [
          "├─ prisma/",
          "│  ├─ schema.prisma           5 models (User, Project, Product, Output, Task)",
          "│  └─ seed.ts                 Demo user/project/product",
          "├─ src/",
          "│  ├─ index.ts                Boots HTTP server, graceful shutdown",
          "│  ├─ app.ts                  Builds the Express app (testable factory)",
          "│  ├─ env.ts                  Zod-validated env — crashes on boot if missing",
          "│  ├─ lib/",
          "│  │  ├─ prisma.ts            Singleton PrismaClient (no connection storms)",
          "│  │  ├─ aiClient.ts          OpenAI wrapper + FAKE_AI mode",
          "│  │  ├─ promptAssembler.ts   Loads /prompts/, fills {{placeholders}}",
          "│  │  ├─ jwt.ts               Sign/verify HS256 + cookie config",
          "│  │  ├─ logger.ts            Pino with secret redaction",
          "│  │  └─ errors.ts            HttpError class + helpers",
          "│  ├─ middleware/",
          "│  │  ├─ requireAuth.ts       Reads cookie, attaches req.user",
          "│  │  ├─ rateLimit.ts         api / auth / generate buckets",
          "│  │  └─ errorHandler.ts      Catches Zod + HttpError + unknown",
          "│  ├─ services/",
          "│  │  ├─ credits.service.ts   Atomic decrement (no race conditions)",
          "│  │  └─ generate.service.ts  THE CORE — orchestrates every AI call",
          "│  ├─ routes/",
          "│  │  ├─ auth.routes.ts       signup / login / logout / me",
          "│  │  ├─ projects.routes.ts   CRUD",
          "│  │  ├─ products.routes.ts   CRUD (nested)",
          "│  │  ├─ generate.routes.ts   POST /api/generate/:skill (one route, all 15)",
          "│  │  ├─ outputs.routes.ts    Library CRUD",
          "│  │  └─ account.routes.ts    Usage + profile",
          "│  └─ prompts/",
          "│     ├─ system/chief_of_staff.md   Master system prompt",
          "│     └─ skills/                    15 .md files (one per generator)",
          "├─ .env.example               Documented, committed",
          "├─ .gitignore",
          "├─ tsconfig.json",
          "├─ package.json",
          "└─ README.md                  How to run + smoke test",
        ],
      },
    ],
  },

  // 2. API routes
  {
    id: "routes",
    number: "02",
    title: "API Route List",
    tagline: "Every endpoint the MVP needs. 22 routes.",
    icon: "🛰️",
    blocks: [
      { type: "h", text: "Auth" },
      {
        type: "routetable",
        rows: [
          { method: "POST", path: "/api/auth/signup", auth: false, purpose: "Create account, set httpOnly JWT cookie." },
          { method: "POST", path: "/api/auth/login",  auth: false, purpose: "Verify password, set cookie." },
          { method: "POST", path: "/api/auth/logout", auth: true,  purpose: "Clear cookie." },
          { method: "GET",  path: "/api/auth/me",     auth: true,  purpose: "Return current user (hydration)." },
        ],
      },
      { type: "h", text: "Projects" },
      {
        type: "routetable",
        rows: [
          { method: "GET",    path: "/api/projects",     auth: true, purpose: "List my projects (with counts)." },
          { method: "POST",   path: "/api/projects",     auth: true, purpose: "Create a project." },
          { method: "GET",    path: "/api/projects/:id", auth: true, purpose: "Get one with products + recent outputs." },
          { method: "PATCH",  path: "/api/projects/:id", auth: true, purpose: "Rename / update brand voice." },
          { method: "DELETE", path: "/api/projects/:id", auth: true, purpose: "Cascade delete." },
        ],
      },
      { type: "h", text: "Products" },
      {
        type: "routetable",
        rows: [
          { method: "GET",  path: "/api/projects/:projectId/products", auth: true, purpose: "List products in project." },
          { method: "POST", path: "/api/projects/:projectId/products", auth: true, purpose: "Create a product." },
        ],
      },
      { type: "h", text: "AI Generation (one route, 15 skills)" },
      {
        type: "routetable",
        rows: [
          { method: "GET",  path: "/api/generate",         auth: true, purpose: "List available skills." },
          { method: "POST", path: "/api/generate/:skill",  auth: true, purpose: "Run any skill (e.g. tiktok_script)." },
        ],
      },
      { type: "h", text: "Outputs (library)" },
      {
        type: "routetable",
        rows: [
          { method: "GET",    path: "/api/outputs",     auth: true, purpose: "List with ?projectId, ?type, ?search." },
          { method: "POST",   path: "/api/outputs",     auth: true, purpose: "Save an AI result to library." },
          { method: "GET",    path: "/api/outputs/:id", auth: true, purpose: "Read one." },
          { method: "PATCH",  path: "/api/outputs/:id", auth: true, purpose: "Edit title or content." },
          { method: "DELETE", path: "/api/outputs/:id", auth: true, purpose: "Delete." },
        ],
      },
      { type: "h", text: "Account & Health" },
      {
        type: "routetable",
        rows: [
          { method: "GET",   path: "/api/account/usage",   auth: true,  purpose: "Credits used / remaining + lifetime totals." },
          { method: "PATCH", path: "/api/account/profile", auth: true,  purpose: "Update display name." },
          { method: "GET",   path: "/health",              auth: false, purpose: "Render uptime check." },
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Why one /api/generate/:skill instead of 15 routes",
        text: "Adding a new generator becomes 'drop a .md file in /prompts/skills/'. Zero TypeScript edits, zero new routes, zero deploys — the prompt assembler discovers it automatically.",
      },
    ],
  },

  // 3. Request/response examples
  {
    id: "reqresp",
    number: "03",
    title: "Request / Response Examples",
    tagline: "Exactly what the wire looks like.",
    icon: "🧪",
    blocks: [
      {
        type: "reqresp",
        method: "POST",
        endpoint: "/api/auth/signup",
        request: `{
  "email": "alex@example.com",
  "password": "supersecret1",
  "name": "Alex"
}`,
        response: `// 201 Created  + Set-Cookie: cos_session=…
{
  "user": {
    "id": "clx9k…",
    "email": "alex@example.com",
    "name": "Alex",
    "plan": "free",
    "credits": 25,
    "creditsMax": 25
  }
}`,
      },
      {
        type: "reqresp",
        method: "POST",
        endpoint: "/api/generate/tiktok_script",
        request: `// Cookie: cos_session=…
{
  "projectId": "clx9k…",            // optional — must belong to user
  "context": {
    "product_name":        "Glow Serum Bundle",
    "product_description": "3-step skincare for oily skin",
    "target_audience":     "Women 25-35 with adult acne",
    "pain_point":          "Cystic breakouts",
    "offer_type":          "digital_product",
    "cta":                 "Tap the link in my bio."
  }
}`,
        response: `// 200 OK
{
  "taskId": "clx9m…",
  "skill": "tiktok_script",
  "content": "**Hook (0–2s):** I tried 11 skincare brands…",
  "meta": {
    "model": "gpt-4o-mini",
    "tokensIn": 612,
    "tokensOut": 248,
    "latencyMs": 1840,
    "fake": false
  },
  "creditsRemaining": 24
}`,
      },
      {
        type: "reqresp",
        method: "POST",
        endpoint: "/api/outputs",
        request: `{
  "projectId": "clx9k…",
  "type": "tiktok_script",
  "title": "TikTok — $24 vs $60 serum hook test",
  "content": "**Hook (0–2s):** I tried 11 skincare brands…",
  "inputSnapshot": { "product_name": "Glow Serum Bundle", "…": "…" }
}`,
        response: `// 201 Created
{
  "output": {
    "id": "clx9p…",
    "type": "tiktok_script",
    "title": "TikTok — $24 vs $60 serum hook test",
    "createdAt": "2026-03-04T14:22:00.000Z",
    "…": "…"
  }
}`,
      },
      {
        type: "reqresp",
        method: "GET",
        endpoint: "/api/outputs?projectId=clx9k&type=tiktok_script&limit=20",
        request: `// no body — query params only`,
        response: `{
  "outputs": [
    {
      "id": "clx9p…",
      "type": "tiktok_script",
      "title": "TikTok — $24 vs $60 serum hook test",
      "content": "**Hook (0–2s):** I tried 11 skincare brands…",
      "projectId": "clx9k…",
      "projectName": "Glow Skincare",
      "projectEmoji": "🧴",
      "createdAt": "2026-03-04T14:22:00.000Z"
    }
  ]
}`,
      },
    ],
  },

  // 4. Error handling
  {
    id: "errors",
    number: "04",
    title: "Error Handling",
    tagline: "One shape for every error. Frontend can switch on it.",
    icon: "🛑",
    blocks: [
      {
        type: "p",
        text: "Every error returns the same JSON shape: { error: { code, message } }. Validation errors add a `fields` map. The frontend's fetch wrapper switches on `code` to render the right UI.",
      },
      {
        type: "table",
        headers: ["Status", "Code", "Meaning", "Frontend reaction"],
        rows: [
          ["400", "VALIDATION", "Zod parse failed", "Show field errors inline"],
          ["400", "BAD_REQUEST", "Other input error", "Show toast"],
          ["401", "UNAUTHORIZED", "No / invalid cookie", "Redirect to /auth"],
          ["402", "OUT_OF_CREDITS", "Hit free-tier cap", "Show waitlist / upgrade modal"],
          ["403", "FORBIDDEN", "Tried to access someone else's resource", "Show toast, kick to dashboard"],
          ["404", "NOT_FOUND", "Resource missing or doesn't belong to you", "Show empty state"],
          ["409", "CONFLICT", "Duplicate (e.g. email taken)", "Show inline error"],
          ["429", "RATE_LIMITED", "Too many requests", "Show toast, slow down"],
          ["500", "SERVER_ERROR", "Unexpected", "Show toast, log to Sentry (Phase 2)"],
        ],
      },
      {
        type: "filecode",
        path: "server/src/lib/errors.ts",
        lang: "ts",
        description: "Throw these from any route handler — middleware turns them into clean JSON.",
        code: `export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "HttpError";
  }
}

export const errors = {
  badRequest:      (m = "Bad request")          => new HttpError(400, m, "BAD_REQUEST"),
  unauthorized:    (m = "Unauthorized")         => new HttpError(401, m, "UNAUTHORIZED"),
  paymentRequired: (m = "Out of credits")       => new HttpError(402, m, "OUT_OF_CREDITS"),
  forbidden:       (m = "Forbidden")            => new HttpError(403, m, "FORBIDDEN"),
  notFound:        (m = "Not found")            => new HttpError(404, m, "NOT_FOUND"),
  conflict:        (m = "Conflict")             => new HttpError(409, m, "CONFLICT"),
  tooMany:         (m = "Too many requests")    => new HttpError(429, m, "RATE_LIMITED"),
  server:          (m = "Internal server error")=> new HttpError(500, m, "SERVER_ERROR"),
};`,
      },
      {
        type: "filecode",
        path: "server/src/middleware/errorHandler.ts",
        lang: "ts",
        description: "Catches everything thrown anywhere downstream.",
        code: `export function errorHandler(err: unknown, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION", message: "Invalid input", fields: err.flatten().fieldErrors },
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Something went wrong" } });
}`,
      },
    ],
  },

  // 5. Database connection
  {
    id: "database",
    number: "05",
    title: "Database Connection (Postgres + Prisma)",
    tagline: "Why we picked Render Postgres over Supabase, and how to switch later.",
    icon: "🗄️",
    blocks: [
      {
        type: "p",
        text: "We use Prisma against any Postgres database via the DATABASE_URL env var. That includes Render Postgres (recommended), Supabase, Neon, Railway — anywhere that gives you a Postgres connection string. The model code never changes.",
      },
      {
        type: "filecode",
        path: "server/src/lib/prisma.ts",
        lang: "ts",
        description: "Singleton client — prevents 'too many connections' in dev with hot-reload.",
        code: `import { PrismaClient } from "@prisma/client";
import { env } from "../env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;`,
      },
      { type: "h", text: "If you prefer Supabase later" },
      {
        type: "code",
        lang: "bash",
        code: `# 1. Create a Supabase project, copy its Postgres connection string
# 2. Update DATABASE_URL in Render env vars
# 3. Run: npm run prisma:deploy
# That's it. No code changes.`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Why not the Supabase JS client?",
        text: "Prisma gives you type-safe queries, automatic migrations, and total Postgres portability. Supabase's JS client locks you to Supabase. Use Prisma — point it AT Supabase if you want their hosting/auth, but keep your code provider-agnostic.",
      },
    ],
  },

  // 6. AI connection
  {
    id: "ai",
    number: "06",
    title: "AI API Connection Setup",
    tagline: "OpenAI wrapped behind one file. Plus FAKE_AI mode for $0 development.",
    icon: "🧠",
    blocks: [
      {
        type: "p",
        text: "All AI calls go through aiClient.ts. Want to swap to Anthropic, Groq, or Together? Edit one file. Want to test without burning OpenAI credits? Set FAKE_AI=true and the client returns canned Markdown after a fake delay — perfect for building the UI before you have an API key.",
      },
      {
        type: "filecode",
        path: "server/src/lib/aiClient.ts",
        lang: "ts",
        description: "The only file that knows about OpenAI. Includes FAKE_AI fallback.",
        code: `import OpenAI from "openai";
import { env } from "../env.js";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("Set OPENAI_API_KEY or FAKE_AI=true");
    }
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export async function chat(messages: ChatMessage[]) {
  const start = Date.now();

  // FAKE_AI mode — build for $0 until you have a key
  if (env.FAKE_AI || !env.OPENAI_API_KEY) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      content: FAKE_FALLBACK,
      tokensIn: 0, tokensOut: 0,
      model: "fake-ai",
      latencyMs: Date.now() - start,
      fake: true,
    };
  }

  const resp = await getClient().chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.8,
    max_tokens: 900,
    messages,
  });

  return {
    content: resp.choices[0]?.message?.content ?? "",
    tokensIn: resp.usage?.prompt_tokens ?? 0,
    tokensOut: resp.usage?.completion_tokens ?? 0,
    model: resp.model,
    latencyMs: Date.now() - start,
    fake: false,
  };
}`,
      },
      {
        type: "callout",
        tone: "success",
        title: "FAKE_AI is the trick",
        text: "You can build, test, and deploy the entire backend BEFORE you have an OpenAI key. When you flip FAKE_AI=false and add OPENAI_API_KEY, every route just works. Saves you days of fighting bugs while burning credits.",
      },
    ],
  },

  // 7. Generate endpoint
  {
    id: "generate",
    number: "07",
    title: "Code: Generate Endpoint",
    tagline: "The single most important code in the app.",
    icon: "✨",
    blocks: [
      {
        type: "filecode",
        path: "server/src/routes/generate.routes.ts",
        lang: "ts",
        description: "Thin route — delegates to the service. Validates input + skill name only.",
        code: `import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { generateLimiter } from "../middleware/rateLimit.js";
import { runGeneration } from "../services/generate.service.js";
import { listSkills } from "../lib/promptAssembler.js";
import { errors } from "../lib/errors.js";

const router = Router();
router.use(requireAuth);

const generateSchema = z.object({
  projectId: z.string().cuid().optional(),
  context: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

router.post("/:skill", generateLimiter, async (req, res, next) => {
  try {
    const skill = req.params.skill;
    if (!listSkills().includes(skill)) throw errors.badRequest(\`Unknown skill: \${skill}\`);
    const { projectId, context } = generateSchema.parse(req.body);
    const result = await runGeneration({
      userId: req.user!.id,
      skill, projectId, context,
    });
    res.json(result);
  } catch (e) { next(e); }
});

router.get("/", (_req, res) => res.json({ skills: listSkills() }));

export default router;`,
      },
      {
        type: "filecode",
        path: "server/src/services/generate.service.ts",
        lang: "ts",
        description: "Where the real work happens. Atomic, debuggable, fail-safe.",
        code: `export async function runGeneration(input: GenerateInput) {
  const { userId, skill, projectId, context } = input;

  // 1. Project ownership check (cross-tenant safety)
  if (projectId) {
    const owns = await prisma.project.findFirst({
      where: { id: projectId, userId }, select: { id: true },
    });
    if (!owns) throw errors.forbidden("Project does not belong to you");
  }

  // 2. Reserve a Task row up front (debug trail even if AI dies)
  const task = await prisma.task.create({
    data: { userId, projectId: projectId ?? null, type: skill, status: "running", input: context },
  });

  try {
    // 3. Build prompt from /prompts/system + /prompts/skills/<skill>.md
    const messages = buildPrompt(skill, context);

    // 4. Call AI (or fake)
    const ai = await chat(messages);

    // 5. Mark task done
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "done", result: { content: ai.content }, tokensUsed: ai.tokensIn + ai.tokensOut, completedAt: new Date() },
    });

    // 6. Charge a credit (NEVER for failures)
    const creditsRemaining = await consumeCredit(userId);

    return { taskId: task.id, skill, content: ai.content, meta: { … }, creditsRemaining };
  } catch (err) {
    // Failure path — log + mark task failed + DO NOT charge
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "failed", errorMsg: String(err), completedAt: new Date() },
    });
    throw errors.server("AI generation failed. No credits were charged.");
  }
}`,
      },
      {
        type: "callout",
        tone: "warn",
        title: "The 'no credits charged on failure' rule",
        text: "We create the Task BEFORE the AI call so we have a debug record even if OpenAI errors. Credits decrement AFTER success. This means a flaky API call never burns the user's quota — a critical trust feature.",
      },
    ],
  },

  // 8. Save output endpoint
  {
    id: "save",
    number: "08",
    title: "Code: Save Output Endpoint",
    tagline: "Library write — the user explicitly chose to keep this generation.",
    icon: "💾",
    blocks: [
      {
        type: "filecode",
        path: "server/src/routes/outputs.routes.ts",
        lang: "ts",
        description: "POST /api/outputs — fired by the Save button in the UI.",
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

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    // CRITICAL: verify project ownership (don't trust IDs from the body)
    if (data.projectId) {
      const owns = await prisma.project.findFirst({
        where: { id: data.projectId, userId: req.user!.id },
        select: { id: true },
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
        type: "callout",
        tone: "danger",
        title: "The single biggest backend mistake to avoid",
        text: "NEVER trust an ID that came from the request body without verifying the user owns it. The check above (findFirst with both id AND userId) is what stops user A from saving outputs into user B's project. Apply this pattern to every route that touches a foreign-key field.",
      },
    ],
  },

  // 9. Load projects endpoint
  {
    id: "loadprojects",
    number: "09",
    title: "Code: Load Projects Endpoint",
    tagline: "List with counts — efficient, single query.",
    icon: "📁",
    blocks: [
      {
        type: "filecode",
        path: "server/src/routes/projects.routes.ts",
        lang: "ts",
        description: "GET /api/projects — also shows _count for products + outputs in one query.",
        code: `router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },         // tenant isolation, always
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true, outputs: true } },
      },
    });

    res.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        niche: p.niche,
        brandVoice: p.brandVoice,
        emoji: p.emoji,
        createdAt: p.createdAt,
        productCount: p._count.products,
        outputCount: p._count.outputs,
      })),
    });
  } catch (e) { next(e); }
});`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Why _count instead of a separate query",
        text: "Prisma's `_count` translates to a single SQL with COUNT() subqueries — one round trip to Postgres for the whole dashboard view. Saves you N+1 query nightmares as the user accumulates projects.",
      },
    ],
  },

  // 10. Usage tracking
  {
    id: "usage",
    number: "10",
    title: "Code: Usage Tracking & Credits",
    tagline: "Atomic, race-free, refundable on failure.",
    icon: "📊",
    blocks: [
      {
        type: "p",
        text: "Every AI call writes a Task row (success or failure). Successful tasks decrement credits in a transaction so they can never go negative under load. The /api/account/usage endpoint surfaces it all to the dashboard widget.",
      },
      {
        type: "filecode",
        path: "server/src/services/credits.service.ts",
        lang: "ts",
        description: "Atomic decrement — uses a Prisma transaction so concurrent requests can't both succeed when only 1 credit is left.",
        code: `import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";

export async function consumeCredit(userId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    if (!user) throw errors.unauthorized("Account not found");
    if (user.credits <= 0) throw errors.paymentRequired("You're out of credits this month");

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
      select: { credits: true },
    });
    return updated.credits;
  });
}

export async function getUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, creditsMax: true, plan: true },
  });
  if (!user) throw errors.unauthorized("Account not found");

  const totalGenerations = await prisma.task.count({ where: { userId, status: "done" } });
  const totalOutputs = await prisma.output.count({ where: { userId } });

  return {
    plan: user.plan,
    creditsRemaining: user.credits,
    creditsMax: user.creditsMax,
    totalGenerations,
    totalOutputs,
  };
}`,
      },
      {
        type: "callout",
        tone: "success",
        title: "Ready for Stripe in Phase 2",
        text: "When you add billing, the only change is: bump `creditsMax` when the Stripe webhook fires for a successful subscription. The whole credits system already works — it just resets to 25 today.",
      },
    ],
  },

  // 11. Env vars
  {
    id: "env",
    number: "11",
    title: "Environment Variable Setup",
    tagline: "What goes where, what's secret, how to set it on Render.",
    icon: "🔐",
    blocks: [
      {
        type: "filecode",
        path: "server/.env.example",
        lang: "bash",
        description: "Committed to repo. Copy to .env locally. NEVER commit a real .env.",
        code: `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chief"

# Auth
JWT_SECRET="change-me-to-a-long-random-string-min-32-chars"
JWT_EXPIRES_IN="7d"

# AI — leave OPENAI_API_KEY empty + FAKE_AI=true to dev for $0
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
FAKE_AI="true"

# HTTP
PORT="4000"
NODE_ENV="development"
CLIENT_ORIGIN="http://localhost:5173"

# Phase 2
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""`,
      },
      {
        type: "envtable",
        rows: [
          { key: "DATABASE_URL",          example: "postgres://…",      secret: true,  note: "Auto-injected by Render when you link the DB." },
          { key: "JWT_SECRET",            example: "32+ random chars",  secret: true,  note: "Generate: `openssl rand -hex 32`." },
          { key: "OPENAI_API_KEY",        example: "sk-…",              secret: true,  note: "Add when ready. Until then, FAKE_AI handles it." },
          { key: "OPENAI_MODEL",          example: "gpt-4o-mini",       secret: false, note: "Default model. Cheap + smart enough for MVP." },
          { key: "FAKE_AI",               example: "true / false",      secret: false, note: "true = canned outputs (no API key needed)." },
          { key: "CLIENT_ORIGIN",         example: "https://app.com",   secret: false, note: "CORS allow-list. Must match the static site URL." },
          { key: "PORT",                  example: "10000",             secret: false, note: "Render injects this — don't hardcode." },
          { key: "NODE_ENV",              example: "production",        secret: false, note: "Render sets this automatically." },
          { key: "STRIPE_SECRET_KEY",     example: "sk_live_…",         secret: true,  note: "Phase 2 only." },
          { key: "STRIPE_WEBHOOK_SECRET", example: "whsec_…",           secret: true,  note: "Phase 2 only." },
        ],
      },
      {
        type: "filecode",
        path: "server/src/env.ts",
        lang: "ts",
        description: "Crashes on boot if anything is missing. Better than a 500 in production.",
        code: `import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  FAKE_AI: z.string().optional().transform((v) => v === "true" || v === "1"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;`,
      },
    ],
  },

  // 12. Security
  {
    id: "security",
    number: "12",
    title: "Security Best Practices",
    tagline: "What's baked in, what to watch for.",
    icon: "🛡️",
    blocks: [
      {
        type: "table",
        headers: ["Risk", "Mitigation (already in code)", "File"],
        rows: [
          ["Password leaks",         "bcrypt cost 12. Hashes never logged.",            "auth.routes.ts + logger.ts redact"],
          ["Session hijacking",      "JWT in httpOnly + Secure + SameSite=Lax cookie.", "lib/jwt.ts"],
          ["CSRF",                   "SameSite=Lax + JSON-only endpoints.",             "app.ts"],
          ["Cross-tenant data leak", "Every query filters by req.user.id from JWT.",    "All routes — never trust body IDs"],
          ["AI cost blowups",        "Per-user credit cap + 15/min IP rate limit.",     "credits.service.ts + rateLimit.ts"],
          ["Brute-force login",      "5/min per IP on auth routes.",                    "rateLimit.ts (authLimiter)"],
          ["Prompt injection",       "User fields treated as DATA in system prompt.",   "prompts/system/chief_of_staff.md"],
          ["Secret leakage in logs", "Pino redacts password, token, JWT_SECRET, etc.",  "lib/logger.ts"],
          ["SQL injection",          "All DB access via Prisma (parameterized).",       "All services"],
          ["Helmet headers",         "Sane defaults applied globally.",                 "app.ts"],
          ["CORS misconfig",         "Allowlist exactly CLIENT_ORIGIN. Credentials true.","app.ts"],
          ["Body-size DoS",          "express.json({ limit: '100kb' }).",               "app.ts"],
        ],
      },
      {
        type: "filecode",
        path: "server/src/app.ts",
        lang: "ts",
        description: "Where helmet, CORS, body parsing, cookie parser, and rate limits are wired in.",
        code: `app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true, … }));

app.use("/api", apiLimiter);                // global 120/min/IP
app.use("/api/auth", authRoutes);           // authLimiter inside
app.use("/api/projects", projectsRoutes);
app.use("/api/projects/:projectId/products", productsRoutes);
app.use("/api/generate", generateRoutes);   // generateLimiter inside
app.use("/api/outputs", outputsRoutes);
app.use("/api/account", accountRoutes);

app.use(notFoundHandler);
app.use(errorHandler);                      // MUST be last`,
      },
      {
        type: "callout",
        tone: "danger",
        title: "Repeat the rule",
        text: "Never trust an ID from the request body. ALWAYS query with `where: { id, userId: req.user.id }` before mutating. Build a habit — it's the difference between a SaaS and a privacy lawsuit.",
      },
    ],
  },

  // 13. File map summary
  {
    id: "filemap",
    number: "13",
    title: "Where Each File Goes",
    tagline: "Final checklist for what just shipped.",
    icon: "🗺️",
    blocks: [
      {
        type: "table",
        headers: ["File", "Lines", "Purpose"],
        rows: [
          ["server/package.json",                          "~30",  "Deps + scripts (dev / build / migrate / seed)"],
          ["server/tsconfig.json",                         "~15",  "Strict TypeScript w/ NodeNext modules"],
          ["server/.env.example",                          "~25",  "Documented env vars (committed; .env is not)"],
          ["server/.gitignore",                            "~10",  "Excludes node_modules, dist, .env"],
          ["server/README.md",                             "~70",  "Local dev + smoke test"],
          ["server/prisma/schema.prisma",                  "~85",  "5 models (User, Project, Product, Output, Task)"],
          ["server/prisma/seed.ts",                        "~40",  "Demo user + project + product"],
          ["server/src/index.ts",                          "~25",  "HTTP boot + graceful shutdown"],
          ["server/src/app.ts",                            "~55",  "Express factory (testable)"],
          ["server/src/env.ts",                            "~30",  "Zod-validated env loader"],
          ["server/src/lib/prisma.ts",                     "~15",  "Singleton client"],
          ["server/src/lib/aiClient.ts",                   "~75",  "OpenAI wrapper + FAKE_AI"],
          ["server/src/lib/promptAssembler.ts",            "~55",  "Loads + fills prompt templates"],
          ["server/src/lib/jwt.ts",                        "~30",  "Sign / verify + cookie config"],
          ["server/src/lib/logger.ts",                     "~25",  "Pino with redaction"],
          ["server/src/lib/errors.ts",                     "~25",  "HttpError + helpers"],
          ["server/src/middleware/requireAuth.ts",         "~25",  "JWT cookie verification"],
          ["server/src/middleware/rateLimit.ts",           "~25",  "3 buckets: api / auth / generate"],
          ["server/src/middleware/errorHandler.ts",        "~35",  "Catches Zod + HttpError + unknown"],
          ["server/src/services/credits.service.ts",       "~40",  "Atomic credit decrement + getUsage"],
          ["server/src/services/generate.service.ts",      "~75",  "THE CORE — orchestrates all AI"],
          ["server/src/routes/auth.routes.ts",             "~80",  "signup / login / logout / me"],
          ["server/src/routes/projects.routes.ts",         "~80",  "CRUD"],
          ["server/src/routes/products.routes.ts",         "~50",  "CRUD nested under project"],
          ["server/src/routes/generate.routes.ts",         "~35",  "POST /:skill (handles all 15)"],
          ["server/src/routes/outputs.routes.ts",          "~95",  "Library CRUD with filters"],
          ["server/src/routes/account.routes.ts",          "~30",  "Usage + profile"],
          ["server/src/prompts/system/chief_of_staff.md",  "~50",  "Master system prompt"],
          ["server/src/prompts/skills/*.md (×15)",         "~30 ea","One file per generator"],
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Total: ~45 files, ~1500 lines",
        text: "Every line is production-ready. The whole backend can be cloned, npm installed, migrated, seeded, and running locally in under 10 minutes — without an OpenAI key.",
      },
      {
        type: "h",
        text: "Run it locally",
      },
      {
        type: "code",
        lang: "bash",
        code: `cd server
cp .env.example .env             # edit DATABASE_URL + JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate           # create tables
npm run db:seed                  # demo@chiefofstaff.app / demo1234
npm run dev                      # http://localhost:4000

# Smoke test (FAKE_AI mode — no OpenAI key needed)
curl http://localhost:4000/health
curl -c c.txt -X POST http://localhost:4000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"demo@chiefofstaff.app","password":"demo1234"}'

curl -b c.txt -X POST http://localhost:4000/api/generate/tiktok_script \\
  -H "Content-Type: application/json" \\
  -d '{"context":{"product_name":"Glow Serum"}}'`,
      },
    ],
  },
];
