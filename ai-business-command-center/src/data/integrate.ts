// AI Integration — Prompt #8
// Walks through every layer of the frontend ↔ backend ↔ AI API connection
// with copy-ready code. Companion docs to actual files now live in the repo.

export type IntegrateBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "callout"; tone: "info" | "warn" | "success" | "danger"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "filecode"; path: string; lang: string; description: string; code: string }
  | { type: "reqresp"; method: string; endpoint: string; request: string; response: string }
  | { type: "flow"; steps: { actor: string; action: string; detail?: string }[] };

export type IntegrateSection = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  icon: string;
  blocks: IntegrateBlock[];
};

export const integrateSpec: IntegrateSection[] = [
  // 0. Overview / what just shipped
  {
    id: "overview",
    number: "00",
    title: "What Just Connected",
    tagline: "The frontend now talks to the real backend. Live mode is on.",
    icon: "🔌",
    blocks: [
      {
        type: "p",
        text: "Until this prompt the React app ran entirely on hardcoded mock data. Now it has an apiClient.ts that talks to the Express server, and a 'mock vs live' toggle on the login screen. Flip to Live API, run the server (cd server && npm run dev), sign in with demo@chiefofstaff.app / demo1234, and every action — login, project create, generation, save, delete — hits the real backend.",
      },
      {
        type: "flow",
        steps: [
          { actor: "User",     action: "Fills the form, clicks Generate",                            detail: "src/app/pages/NewTaskPage.tsx" },
          { actor: "Frontend", action: "runGeneration() in AppContext picks live mode",              detail: "src/app/AppContext.tsx" },
          { actor: "Frontend", action: "apiClient.generate.run() POSTs to /api/generate/<skill>",    detail: "src/app/lib/apiClient.ts" },
          { actor: "Express",  action: "requireAuth verifies JWT cookie",                            detail: "server/src/middleware/requireAuth.ts" },
          { actor: "Express",  action: "Zod parses body, route delegates to runGeneration()",        detail: "server/src/routes/generate.routes.ts" },
          { actor: "Service",  action: "Creates Task row, builds prompt, calls AI, decrements credits", detail: "server/src/services/generate.service.ts" },
          { actor: "AI",       action: "OpenAI returns Markdown (or FAKE_AI returns canned output)", detail: "server/src/lib/aiClient.ts" },
          { actor: "Frontend", action: "Markdown renders in the OutputViewer",                       detail: "src/app/ui/Markdown.tsx" },
          { actor: "User",     action: "Clicks Save → POST /api/outputs → saved",                    detail: "src/app/AppContext.tsx → apiClient.outputs.create" },
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Try it now",
        text: "1) cd server && cp .env.example .env (edit DATABASE_URL + JWT_SECRET) && npm i && npm run prisma:migrate && npm run db:seed && npm run dev. 2) In the App tab, sign out, flip the toggle to '🟢 Live API', sign in with demo@chiefofstaff.app / demo1234. 3) Generate something. The Network tab will show real /api/generate/... calls.",
      },
    ],
  },

  // 1. AI client setup
  {
    id: "aiclient",
    number: "01",
    title: "AI Client Setup",
    tagline: "One file. One job. Swap providers without touching anything else.",
    icon: "🧠",
    blocks: [
      {
        type: "p",
        text: "Every AI call in the entire backend goes through aiClient.ts. That's the rule. Want to switch from OpenAI to Anthropic, Groq, or Mistral? You edit this one file. Want to test for free? Set FAKE_AI=true and the client returns canned Markdown after a short delay.",
      },
      {
        type: "filecode",
        path: "server/src/lib/aiClient.ts",
        lang: "ts",
        description: "The only file in the repo that knows about OpenAI's SDK.",
        code: `import OpenAI from "openai";
import { env } from "../env.js";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiResponse = {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  latencyMs: number;
  fake: boolean;
};

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("Set OPENAI_API_KEY or FAKE_AI=true");
    }
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export async function chat(messages: ChatMessage[]): Promise<AiResponse> {
  const start = Date.now();

  // FAKE_AI mode — build the entire app for $0
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
    model: env.OPENAI_MODEL,            // gpt-4o-mini by default
    temperature: 0.8,
    max_tokens: 900,
    messages,
  });

  return {
    content:    resp.choices[0]?.message?.content ?? "",
    tokensIn:   resp.usage?.prompt_tokens ?? 0,
    tokensOut:  resp.usage?.completion_tokens ?? 0,
    model:      resp.model,
    latencyMs:  Date.now() - start,
    fake:       false,
  };
}`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Why a 'getClient' lazy loader",
        text: "We don't construct the OpenAI client at boot — only on first use. That means the server starts even when no API key is set, which lets FAKE_AI mode work cleanly and lets you debug startup issues without burning credits.",
      },
    ],
  },

  // 2. Prompt builder
  {
    id: "promptbuilder",
    number: "02",
    title: "Prompt Builder Function",
    tagline: "Loads system + skill prompts from disk, fills {{placeholders}}, returns ChatMessages.",
    icon: "🧩",
    blocks: [
      {
        type: "p",
        text: "Prompts live as Markdown files in /server/src/prompts/. The system prompt is loaded once at boot. Each skill prompt is loaded on first use and cached. Both have {{placeholders}} that get filled from the request context at runtime.",
      },
      {
        type: "filecode",
        path: "server/src/lib/promptAssembler.ts",
        lang: "ts",
        description: "The bridge between the user's form data and the AI client.",
        code: `import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ChatMessage } from "./aiClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.resolve(__dirname, "../prompts");

let cachedSystem: string | null = null;
function loadSystemPrompt(): string {
  if (cachedSystem) return cachedSystem;
  cachedSystem = fs.readFileSync(
    path.join(PROMPTS_DIR, "system", "chief_of_staff.md"),
    "utf-8"
  );
  return cachedSystem;
}

const skillCache = new Map<string, string>();
function loadSkillPrompt(skill: string): string {
  if (skillCache.has(skill)) return skillCache.get(skill)!;
  const p = path.join(PROMPTS_DIR, "skills", \`\${skill}.md\`);
  if (!fs.existsSync(p)) throw new Error(\`Unknown skill: \${skill}\`);
  const tpl = fs.readFileSync(p, "utf-8");
  skillCache.set(skill, tpl);
  return tpl;
}

/** Replace every {{key}} with ctx[key] (or "(not provided)") */
function fill(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key: string) => {
    const v = ctx[key];
    if (v === undefined || v === null || v === "") return "(not provided)";
    return String(v).trim();
  });
}

export function buildPrompt(skill: string, ctx: Record<string, unknown>): ChatMessage[] {
  const system = loadSystemPrompt();
  const skillTemplate = loadSkillPrompt(skill);
  const user = fill(skillTemplate, ctx);
  return [
    { role: "system", content: system },
    { role: "user",   content: user },
  ];
}

/** Used by /api/generate (GET) to list every skill on disk. */
export function listSkills(): string[] {
  const dir = path.join(PROMPTS_DIR, "skills");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => f.replace(/\\.md$/, ""));
}`,
      },
      {
        type: "callout",
        tone: "success",
        title: "Add a new generator in 30 seconds",
        text: "Drop server/src/prompts/skills/<my_new_skill>.md (use any existing file as a template). The /api/generate/my_new_skill route is automatically live — no code changes, no redeploys needed. listSkills() reads the folder fresh on each call.",
      },
    ],
  },

  // 3. Generate API route
  {
    id: "generateroute",
    number: "03",
    title: "Generate Content API Route",
    tagline: "One generic Express route handles all 15 skills.",
    icon: "✨",
    blocks: [
      {
        type: "p",
        text: "Two files do this work. The route is intentionally tiny — it validates the URL parameter and the body, then delegates to the service. The service does the real work: ownership check, Task row, prompt build, AI call, credit decrement.",
      },
      {
        type: "filecode",
        path: "server/src/routes/generate.routes.ts",
        lang: "ts",
        description: "The Express route. Thin and dumb — all logic lives in the service.",
        code: `import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { generateLimiter } from "../middleware/rateLimit.js";
import { runGeneration } from "../services/generate.service.js";
import { listSkills } from "../lib/promptAssembler.js";
import { errors } from "../lib/errors.js";

const router = Router();
router.use(requireAuth);                     // every route requires login

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
        description: "Where the orchestration happens. Atomic, debuggable, fail-safe.",
        code: `import { prisma } from "../lib/prisma.js";
import { buildPrompt } from "../lib/promptAssembler.js";
import { chat } from "../lib/aiClient.js";
import { consumeCredit } from "./credits.service.js";
import { errors } from "../lib/errors.js";

export async function runGeneration(input: {
  userId: string;
  skill: string;
  projectId?: string;
  context: Record<string, unknown>;
}) {
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
    // 3. Build prompt (system + skill + context)
    const messages = buildPrompt(skill, context);

    // 4. Call AI
    const ai = await chat(messages);

    // 5. Mark task done
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "done",
        result: { content: ai.content },
        tokensUsed: ai.tokensIn + ai.tokensOut,
        completedAt: new Date(),
      },
    });

    // 6. Charge a credit (NEVER for failures)
    const creditsRemaining = await consumeCredit(userId);

    return {
      taskId: task.id, skill,
      content: ai.content,
      meta: { model: ai.model, tokensIn: ai.tokensIn, tokensOut: ai.tokensOut, latencyMs: ai.latencyMs, fake: ai.fake },
      creditsRemaining,
    };
  } catch (err) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "failed", errorMsg: String(err), completedAt: new Date() },
    });
    throw errors.server("AI generation failed. No credits were charged.");
  }
}`,
      },
    ],
  },

  // 4. Frontend function that calls the API
  {
    id: "frontend",
    number: "04",
    title: "Frontend Function That Calls the API",
    tagline: "One typed apiClient. All pages talk through it.",
    icon: "🔁",
    blocks: [
      {
        type: "p",
        text: "Just shipped: src/app/lib/apiClient.ts. Every page in the React app uses it — no raw fetch() calls anywhere else. That single file owns the BASE_URL, the cookie config, and the error normalization. Changing the backend URL, switching to Bearer tokens, adding retry logic — all become one-file changes.",
      },
      {
        type: "filecode",
        path: "src/app/lib/apiClient.ts",
        lang: "ts",
        description: "The fetch wrapper + typed endpoint helpers used by the entire frontend.",
        code: `const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export class ApiException extends Error {
  status: number; code: string; fields?: Record<string, string[]>;
  constructor(err: { status: number; code: string; message: string; fields?: Record<string, string[]> }) {
    super(err.message);
    Object.assign(this, err);
    this.name = "ApiException";
  }
}

async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(\`\${BASE_URL}\${path}\`, {
      method: opts.method ?? "GET",
      credentials: "include",                                  // send the JWT cookie
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch {
    throw new ApiException({ status: 0, code: "NETWORK", message: "Can't reach the server." });
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const e = payload?.error ?? {};
    throw new ApiException({
      status: res.status,
      code: e.code ?? "ERROR",
      message: e.message ?? \`Request failed (\${res.status})\`,
      fields: e.fields,
    });
  }
  return payload as T;
}

// ----- Typed endpoint helpers -----
export const generate = {
  run: (skill: string, data: { projectId?: string; context: Record<string, unknown> }) =>
    api<GenerateResult>(\`/api/generate/\${skill}\`, { method: "POST", body: data }),
};
export const outputs = {
  create: (data: { projectId?: string; type: string; title: string; content: string }) =>
    api<{ output: Output }>("/api/outputs", { method: "POST", body: data }),
  list:   ()             => api<{ outputs: Output[] }>("/api/outputs"),
  delete: (id: string)   => api<{ ok: true }>(\`/api/outputs/\${id}\`, { method: "DELETE" }),
};
export const auth = {
  login:  (data: { email: string; password: string })            => api<{ user: User }>("/api/auth/login",  { method: "POST", body: data }),
  signup: (data: { email: string; password: string; name?: string }) => api<{ user: User }>("/api/auth/signup", { method: "POST", body: data }),
  logout: ()                                                     => api<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me:     ()                                                     => api<{ user: User }>("/api/auth/me"),
};`,
      },
      {
        type: "callout",
        tone: "info",
        title: "credentials: \"include\" is the magic line",
        text: "That single fetch option is what tells the browser to send and accept the httpOnly JWT cookie. Without it, every authenticated request returns 401. Pair it with the backend's CORS config: { origin: CLIENT_ORIGIN, credentials: true }.",
      },
    ],
  },

  // 5. Loading + error handling
  {
    id: "loadingerrors",
    number: "05",
    title: "Loading & Error Handling",
    tagline: "Every async action has a clear loading, success, and failure path.",
    icon: "🎚️",
    blocks: [
      {
        type: "p",
        text: "There are 3 layers of UI feedback. The Generate button shows a spinner. The output area shows a skeleton. Errors fire toasts and (for validation) inline field hints. The friendlyError() helper translates ApiException codes into human messages.",
      },
      {
        type: "filecode",
        path: "src/app/lib/apiClient.ts (excerpt)",
        lang: "ts",
        description: "Friendly error messages the toast system displays.",
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
        path: "src/app/pages/NewTaskPage.tsx (the generate handler)",
        lang: "tsx",
        description: "Real loading + error pattern in production code.",
        code: `const onGenerate = async (e?: React.FormEvent) => {
  e?.preventDefault();
  setGenerating(true);          // shows spinner + skeleton
  setSaved(false);
  setOutput(null);
  let result = "";
  try {
    if (mode === "live") {
      result = await runGeneration(templateId, projectId, form);
    } else {
      // Mock mode — canned example after fake delay
      await new Promise((r) => setTimeout(r, 1400));
      result = activeTemplate?.exampleOutput ?? "_(no output)_";
    }
    setOutput(result);
    setDraft({ templateId, content: result, title: \`\${activeTemplate?.name} — \${form.product_name}\`, projectId });
  } catch {
    // runGeneration() already toasted the error
  } finally {
    setGenerating(false);
  }
};`,
      },
      {
        type: "filecode",
        path: "src/app/AppContext.tsx (the runGeneration wrapper)",
        lang: "ts",
        description: "Centralized error toasting + credit sync.",
        code: `const runGeneration = useCallback(async (skill, projectId, context) => {
  if (mode === "mock") throw new Error("USE_MOCK_FALLBACK");
  try {
    const result = await generateApi.run(skill, { projectId: projectId || undefined, context });
    // Keep the credits widget in sync with what the server returned
    setUser((u) => ({ ...u, credits: result.creditsRemaining }));
    return result.content;
  } catch (e) {
    if (e instanceof ApiException && e.code === "OUT_OF_CREDITS") {
      toast("Out of credits this month — upgrade to keep going.", "danger");
    } else {
      toast(friendlyError(e), "danger");
    }
    throw e;          // let the caller stop its loading state
  }
}, [mode, toast]);`,
      },
      {
        type: "callout",
        tone: "info",
        title: "The skeleton trick",
        text: "While generating, the OutputViewer shows a spinner + 7 animated gray bars. Why bars? They tell the user 'something is being written here'. A blank screen + spinner makes 8-second AI calls feel like 30. Skeletons make them feel like 4.",
      },
    ],
  },

  // 6. Example request body
  {
    id: "request",
    number: "06",
    title: "Example Request Body",
    tagline: "What the wire looks like when the user hits Generate.",
    icon: "📤",
    blocks: [
      {
        type: "reqresp",
        method: "POST",
        endpoint: "/api/generate/tiktok_script",
        request: `// HEADERS
Content-Type: application/json
Cookie: cos_session=eyJhbGciOiJIUzI1NiIs…   ← set by the browser

// BODY
{
  "projectId": "clx9k…",         // optional. Must belong to the signed-in user.
  "context": {
    "product_name":        "Glow Serum Bundle",
    "product_description": "A 3-step skincare routine for oily, breakout-prone skin.",
    "target_audience":     "Women 22-35 with adult acne",
    "pain_point":          "Cystic breakouts that don't respond to drugstore products",
    "offer_type":          "digital_product",
    "cta":                 "Tap the link in my bio to grab the bundle.",
    "brand_tone":          "Calm, no exclamations, peer-to-peer"
  }
}`,
        response: `// 200 OK — see next section`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Why one body shape for all 15 skills",
        text: "The route accepts ANY context object — keys are template-specific, but the wrapper is identical. That means apiClient.generate.run() is one function that works for every generator. New skills add zero new endpoint helpers.",
      },
    ],
  },

  // 7. Example response body
  {
    id: "response",
    number: "07",
    title: "Example Response Body",
    tagline: "What comes back, and how the frontend uses each field.",
    icon: "📥",
    blocks: [
      {
        type: "reqresp",
        method: "POST",
        endpoint: "/api/generate/tiktok_script",
        request: `// (see previous section)`,
        response: `{
  "taskId": "clx9m…",                       ← stored, used to recover unsaved drafts later
  "skill":  "tiktok_script",
  "content": "**Hook (0–2s):** I tried 11 skincare brands. Only one stopped my breakouts.\\n\\n**Script:**\\n1. For 8 months I had cystic acne every period week.\\n2. Then I swapped my $60 serum for this $24 one.\\n3. Three drops at night. That's it.\\n4. Two weeks in, my skin actually looked like skin again.\\n5. The link is in my bio if you want what I used.\\n\\n**CTA:** Tap the link in my bio to grab the bundle.\\n\\n**Hashtags:** #skincaretok #cysticacne #honestreview #foundit",
  "meta": {
    "model":     "gpt-4o-mini",             ← shown in dev to confirm right model
    "tokensIn":  612,                       ← logged for cost analysis
    "tokensOut": 248,
    "latencyMs": 1840,                      ← surfaces in toast if > 5s
    "fake":      false                      ← true when FAKE_AI mode is on
  },
  "creditsRemaining": 24                    ← frontend instantly updates the credits widget
}`,
      },
      {
        type: "filecode",
        path: "src/app/AppContext.tsx (post-generate hook)",
        lang: "ts",
        description: "Credits widget stays in sync without a separate /api/account/usage round trip.",
        code: `const result = await generateApi.run(skill, { projectId, context });
setUser((u) => ({ ...u, credits: result.creditsRemaining }));
return result.content;`,
      },
    ],
  },

  // 8. Protect API key
  {
    id: "protectkey",
    number: "08",
    title: "How to Protect Your API Key",
    tagline: "The 4 rules that stop your OpenAI bill from getting drained.",
    icon: "🔐",
    blocks: [
      {
        type: "ordered",
        items: [
          "OPENAI_API_KEY lives ONLY in server/.env (local) and Render's Environment tab (production). Never in the React app, never in localStorage, never in a Git commit.",
          "Anything starting with VITE_ is COMPILED INTO THE BROWSER BUNDLE. Never name a secret VITE_*.",
          "The frontend NEVER calls OpenAI directly. It always goes through your Express server, which is the only thing holding the key.",
          "server/.gitignore excludes .env. The committed .env.example has empty values + comments only.",
        ],
      },
      {
        type: "filecode",
        path: "server/.env (local, NEVER committed)",
        lang: "bash",
        description: "Real values live here. This file is gitignored.",
        code: `DATABASE_URL="postgresql://user:pass@localhost:5432/chief"
JWT_SECRET="abc123… 32+ random chars"
OPENAI_API_KEY="sk-…"            # ← THE secret. Never leaves the server.
OPENAI_MODEL="gpt-4o-mini"
FAKE_AI="false"
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV="development"
PORT="4000"`,
      },
      {
        type: "filecode",
        path: "server/.env.example (committed)",
        lang: "bash",
        description: "Documentation only — no real secrets here.",
        code: `DATABASE_URL=""
JWT_SECRET="change-me-to-a-long-random-string-min-32-chars"
OPENAI_API_KEY=""                # leave empty + set FAKE_AI=true for $0 dev
OPENAI_MODEL="gpt-4o-mini"
FAKE_AI="true"
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV="development"
PORT="4000"`,
      },
      {
        type: "h",
        text: "On Render — set these in the dashboard, not code",
      },
      {
        type: "ordered",
        items: [
          "Render dashboard → your Web Service → Environment → Add Environment Variable.",
          "Mark JWT_SECRET, OPENAI_API_KEY, STRIPE_SECRET_KEY as sensitive (Render encrypts them at rest).",
          "DATABASE_URL is auto-injected when you link a Render Postgres database — don't paste it manually.",
          "Rotate keys: revoke in OpenAI dashboard → paste a new one in Render → save → service redeploys with the new key. Zero code changes.",
        ],
      },
      {
        type: "callout",
        tone: "danger",
        title: "Worst-case rotation drill",
        text: "If you ever leak a key (accidental commit, screenshot in a tweet): 1) revoke it in the OpenAI dashboard NOW (not after 'I'll fix it later'). 2) Paste a new key in Render. 3) Force-redeploy. 4) Check OpenAI usage for the last 24h. The whole drill should take 5 minutes — design your workflow so it stays that way.",
      },
    ],
  },

  // 9. Prevent abuse
  {
    id: "antiabuse",
    number: "09",
    title: "How to Prevent API Abuse",
    tagline: "5 layers of defense, all already wired in.",
    icon: "🛡️",
    blocks: [
      {
        type: "table",
        headers: ["Defense layer", "What it does", "Where it lives"],
        rows: [
          ["Auth required", "Every /api/generate call needs a valid JWT cookie.", "middleware/requireAuth.ts"],
          ["Per-user credits", "User has N credits per month. Decrements atomically.", "services/credits.service.ts"],
          ["Per-IP rate limit (generate)", "Max 15 AI calls per IP per minute.", "middleware/rateLimit.ts → generateLimiter"],
          ["Per-IP rate limit (auth)", "Max 5 login/signup attempts per IP per minute.", "middleware/rateLimit.ts → authLimiter"],
          ["Global API limit", "Max 120 req/min/IP across all /api routes.", "middleware/rateLimit.ts → apiLimiter"],
          ["Body-size cap", "express.json({ limit: '100kb' }) — no 10MB request bombs.", "app.ts"],
          ["Token cap on AI", "max_tokens: 900 — runaway prompts can't generate $1 of text.", "lib/aiClient.ts"],
          ["Skill allowlist", "Only skills in /prompts/skills/ are valid. Unknown = 400.", "routes/generate.routes.ts"],
          ["Cross-tenant guard", "Every query filters by req.user.id — can't touch other users' data.", "Every route + service"],
        ],
      },
      {
        type: "filecode",
        path: "server/src/middleware/rateLimit.ts",
        lang: "ts",
        description: "Three buckets — different ceilings for different abuse risks.",
        code: `import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,                    // 120 req/min/IP — sane SPA default
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,                      // 5 login/signup attempts/min/IP
  message: { error: { code: "RATE_LIMITED", message: "Too many auth attempts. Try again in a minute." } },
});

export const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,                     // 15 AI calls/min/IP
  message: { error: { code: "RATE_LIMITED", message: "Slow down — too many generations." } },
});`,
      },
      {
        type: "filecode",
        path: "server/src/services/credits.service.ts",
        lang: "ts",
        description: "Atomic credit decrement — race-free under concurrent load.",
        code: `export async function consumeCredit(userId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId }, select: { credits: true },
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
}`,
      },
      {
        type: "callout",
        tone: "success",
        title: "What this stack stops",
        text: "Stolen credentials → blocked by per-user credits + IP rate limits. Bot scraping → blocked by global limit + auth. Prompt-bomb attack → blocked by body-size cap + max_tokens. Abusing FAKE_AI mode → costs you literally $0. The first real attack you'll face is a leaked API key — see section 08.",
      },
    ],
  },

  // 10. Bringing it all together
  {
    id: "summary",
    number: "10",
    title: "All Layers, One Diagram",
    tagline: "From button click to saved Markdown, with every file labeled.",
    icon: "🧭",
    blocks: [
      {
        type: "flow",
        steps: [
          { actor: "User",     action: "Fills New Task form, clicks Generate",                       detail: "src/app/pages/NewTaskPage.tsx" },
          { actor: "Frontend", action: "AppContext.runGeneration() — picks live mode",               detail: "src/app/AppContext.tsx" },
          { actor: "Frontend", action: "apiClient.generate.run('tiktok_script', { context })",       detail: "src/app/lib/apiClient.ts" },
          { actor: "Frontend", action: "fetch with credentials: 'include' sends the cookie",         detail: "POST /api/generate/tiktok_script" },
          { actor: "Express",  action: "helmet + cors + rateLimit (apiLimiter) pass",                detail: "server/src/app.ts" },
          { actor: "Express",  action: "generateLimiter caps at 15/min/IP",                          detail: "server/src/middleware/rateLimit.ts" },
          { actor: "Express",  action: "requireAuth verifies JWT cookie, attaches req.user",         detail: "server/src/middleware/requireAuth.ts" },
          { actor: "Express",  action: "Zod parses body, route delegates to runGeneration()",        detail: "server/src/routes/generate.routes.ts" },
          { actor: "Service",  action: "Verifies project ownership (cross-tenant guard)",            detail: "server/src/services/generate.service.ts" },
          { actor: "Service",  action: "Creates Task row (status='running') for debug trail",        detail: "Prisma → tasks table" },
          { actor: "Service",  action: "buildPrompt() loads system + skill MD, fills placeholders",  detail: "server/src/lib/promptAssembler.ts" },
          { actor: "Service",  action: "chat() — OpenAI or FAKE_AI returns Markdown",                detail: "server/src/lib/aiClient.ts" },
          { actor: "Service",  action: "Marks Task done, stores result + tokens",                    detail: "Prisma update" },
          { actor: "Service",  action: "consumeCredit() — atomic decrement (skipped on failure)",    detail: "server/src/services/credits.service.ts" },
          { actor: "Express",  action: "Returns { taskId, content, meta, creditsRemaining }",        detail: "200 JSON" },
          { actor: "Frontend", action: "Updates user.credits from creditsRemaining",                 detail: "AppContext.runGeneration" },
          { actor: "Frontend", action: "Markdown renders in OutputViewer — Copy / Save buttons appear", detail: "src/app/ui/Markdown.tsx" },
          { actor: "User",     action: "Clicks Save → POST /api/outputs",                            detail: "apiClient.outputs.create" },
          { actor: "Express",  action: "Verifies project ownership again, inserts Output row",       detail: "server/src/routes/outputs.routes.ts" },
          { actor: "Frontend", action: "New entry appears at top of Saved Outputs",                  detail: "AppContext.saveOutput" },
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Every layer is one file",
        text: "Want to add Anthropic? Edit aiClient.ts. Want to add a Brand Voice override? Edit promptAssembler.ts. Want to charge differently per skill? Edit credits.service.ts. The architecture rewards small, surgical edits — exactly what beginner-friendly code looks like.",
      },
    ],
  },
];
