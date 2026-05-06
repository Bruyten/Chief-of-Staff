// AI Agent & Workflow System — Prompt #12
// The architecture for turning Chief of Staff from a generator
// into an autonomous agent that takes a high-level goal and ships outcomes.

export type AgentBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "callout"; tone: "info" | "warn" | "success" | "danger"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "filecode"; path: string; lang: string; description: string; code: string }
  | { type: "statusgrid"; statuses: { id: string; label: string; tone: string; description: string; from: string[]; to: string[] }[] }
  | { type: "steps"; title: string; steps: { name: string; skill: string; needsApproval: boolean; note: string }[] }
  | { type: "compare"; label: string; bad: string; good: string };

export type AgentSection = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  icon: string;
  blocks: AgentBlock[];
};

export const agentSpec: AgentSection[] = [
  // 0. Vision
  {
    id: "vision",
    number: "00",
    title: "The Vision",
    tagline: "From 'pick a template' to 'tell me your goal'.",
    icon: "🎯",
    blocks: [
      {
        type: "p",
        text: "User types: 'Launch my new digital product this week.' Chief of Staff plans the work, generates every asset, asks for approval at the right moments, and ships them to the user's library — with one human checkpoint per critical step. This is the path from Phase 1 (template generators) to Phase 5 (true AI command center).",
      },
      {
        type: "compare",
        label: "Today vs the agent vision",
        bad: "User picks 1 template → fills 7 fields → clicks Generate → repeats 12 times for a launch.",
        good: "User types one goal → reviews a generated plan → approves it → AI runs each step → user approves outputs at 3 checkpoints → entire launch lives in their library in 20 minutes.",
      },
      {
        type: "callout",
        tone: "warn",
        title: "Read the last section first",
        text: "Section 11 — 'What NOT to automate yet' — exists because shipping autonomy too early is the #1 way agent products die. Read it before building anything in this spec.",
      },
    ],
  },

  // 1. Data model
  {
    id: "datamodel",
    number: "01",
    title: "Data Model",
    tagline: "Three new tables on top of the existing Project/Product/Output schema.",
    icon: "🗄️",
    blocks: [
      {
        type: "p",
        text: "The existing Task table (one AI call) becomes a child of a new Workflow table (a goal). The agent's plan is stored as a JSON tree of WorkflowSteps. Outputs are produced by individual steps and link back to both — every saved asset has full provenance: 'this came from the launch workflow on March 4, step 3 of 8.'",
      },
      {
        type: "filecode",
        path: "server/prisma/schema.prisma (additions)",
        lang: "prisma",
        description: "Drop these three models alongside the existing User/Project/Product/Output/Task.",
        code: `// A user's high-level goal — "Launch my new digital product this week."
model Workflow {
  id          String   @id @default(cuid())
  userId      String
  projectId   String?
  templateId  String?                              // optional — based on a saved WorkflowTemplate
  goal        String                                // raw user input
  title       String                                // AI-summarized title
  status      String   @default("planning")        // planning | awaiting_approval | running | paused | done | failed | canceled
  plan        Json                                  // the agent's planned step list (versioned, see WorkflowStep)
  context     Json                                  // shared context all steps can read (audience, tone, brand)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?

  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project?       @relation(fields: [projectId], references: [id], onDelete: SetNull)
  steps   WorkflowStep[]
  tasks   Task[]                                    // existing model — gets a workflowId column

  @@index([userId, createdAt])
}

// One step inside a workflow — corresponds to one generator skill OR an action
model WorkflowStep {
  id           String   @id @default(cuid())
  workflowId   String
  workflow     Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  order        Int                                  // 1, 2, 3 …
  name         String                                // "Write 3 TikTok hooks"
  skill        String                                // tiktok_script | email_sequence | … | manual_review
  inputs       Json                                  // resolved inputs (filled from workflow.context + previous steps)
  status       String   @default("pending")         // pending | running | awaiting_approval | approved | rejected | skipped | failed
  needsApproval Boolean @default(false)             // human checkpoint after this step?
  outputId     String?                               // if completed + saved, link to the resulting Output
  taskId       String?                               // link to the Task row that ran the AI call
  errorMsg     String?
  startedAt    DateTime?
  completedAt  DateTime?

  @@index([workflowId, order])
}

// User-saved or system-shipped workflow blueprint
model WorkflowTemplate {
  id          String  @id @default(cuid())
  userId      String?                               // null = system template
  name        String                                // "Launch a digital product (1 week)"
  description String
  steps       Json                                  // array of { name, skill, needsApproval, defaultInputs }
  isPublic    Boolean @default(false)
  createdAt   DateTime @default(now())

  @@index([userId])
}

// Add to existing Task model:
//   workflowId  String?
//   stepId      String?
//   workflow    Workflow?     @relation(...)
//   step        WorkflowStep? @relation(...)`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Why the plan is JSON (not normalized rows)",
        text: "The agent regenerates the plan multiple times during planning. Storing it as a single JSON column means edits are atomic — no orphaned rows when the user says 'remake the plan'. Once the user approves, we materialize the plan into WorkflowStep rows for execution + tracking.",
      },
    ],
  },

  // 2. Workflow logic
  {
    id: "logic",
    number: "02",
    title: "Workflow Logic",
    tagline: "Plan → Approve → Execute → Review. Four phases. One state machine.",
    icon: "⚙️",
    blocks: [
      {
        type: "ordered",
        items: [
          "PLAN — User types a goal. Planner agent reads it + the project's brand voice, returns a plan: ordered list of steps with names, skills, expected outputs, and approval checkpoints.",
          "APPROVE PLAN — User reviews the plan. Can edit (drag, delete, add, change inputs), regenerate, or approve. No AI work has happened yet — this is fast.",
          "EXECUTE — On approval, workflow runs steps in order. Each step: resolve inputs from context + previous outputs → call the existing /api/generate/<skill> route → save Task → if needsApproval = true, pause for human review.",
          "REVIEW & SAVE — On each approval pause, user sees the AI output, can Edit / Approve / Reject / Regenerate. Approve → Output saved to library. Reject → workflow goes back one step or pauses.",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Why pausing for approval is the whole game",
        text: "Fully autonomous = exciting demo, broken in production. Approval checkpoints turn the agent into a 'co-pilot you supervise', which is what users actually want. They get speed without losing taste control. We default to approval ON for high-stakes outputs (sales pages, launch plans) and OFF for low-stakes (hashtag lists).",
      },
      {
        type: "h",
        text: "The execution loop (pseudocode)",
      },
      {
        type: "code",
        lang: "ts",
        code: `// server/src/services/workflow.service.ts
async function runNextStep(workflowId: string) {
  const wf = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!wf) throw errors.notFound("Workflow not found");

  // Find the next step that's pending
  const next = wf.steps.find((s) => s.status === "pending");
  if (!next) {
    await prisma.workflow.update({ where: { id: wf.id }, data: { status: "done", completedAt: new Date() } });
    return { done: true };
  }

  // Mark as running
  await prisma.workflowStep.update({ where: { id: next.id }, data: { status: "running", startedAt: new Date() } });
  await prisma.workflow.update({ where: { id: wf.id }, data: { status: "running" } });

  try {
    // Resolve inputs: shared context + outputs of previous approved steps
    const inputs = resolveInputs(wf, next);

    // Reuse the existing AI generation pipeline
    const result = await runGeneration({
      userId: wf.userId,
      skill: next.skill,
      projectId: wf.projectId ?? undefined,
      context: inputs,
    });

    await prisma.workflowStep.update({
      where: { id: next.id },
      data: {
        status: next.needsApproval ? "awaiting_approval" : "approved",
        taskId: result.taskId,
        completedAt: new Date(),
      },
    });

    if (next.needsApproval) {
      await prisma.workflow.update({ where: { id: wf.id }, data: { status: "awaiting_approval" } });
      return { paused: true, stepId: next.id, content: result.content };
    }

    // Auto-save & continue
    await autoSaveOutput(wf, next, result.content);
    return runNextStep(workflowId);    // recurse to next step
  } catch (err) {
    await prisma.workflowStep.update({
      where: { id: next.id },
      data: { status: "failed", errorMsg: String(err), completedAt: new Date() },
    });
    await prisma.workflow.update({ where: { id: wf.id }, data: { status: "failed" } });
    throw err;
  }
}`,
      },
    ],
  },

  // 3. Task status system
  {
    id: "statuses",
    number: "03",
    title: "Task Status System",
    tagline: "8 step states + 7 workflow states. Every transition logged.",
    icon: "🚦",
    blocks: [
      { type: "h", text: "WorkflowStep states" },
      {
        type: "statusgrid",
        statuses: [
          { id: "pending",            label: "pending",             tone: "neutral",  description: "Not started yet — waiting in the queue.",                                  from: ["plan-approved"],                  to: ["running", "skipped"] },
          { id: "running",            label: "running",             tone: "info",     description: "AI is generating. Spinner showing.",                                       from: ["pending"],                        to: ["awaiting_approval", "approved", "failed"] },
          { id: "awaiting_approval",  label: "awaiting_approval",   tone: "warn",     description: "Generated, paused for human review.",                                      from: ["running"],                        to: ["approved", "rejected"] },
          { id: "approved",           label: "approved",            tone: "success",  description: "Human said yes. Output saved to library.",                                 from: ["running", "awaiting_approval"],   to: [] },
          { id: "rejected",           label: "rejected",            tone: "danger",   description: "Human said no. Workflow pauses or rolls back one step.",                   from: ["awaiting_approval"],              to: ["pending"] },
          { id: "skipped",            label: "skipped",             tone: "neutral",  description: "User opted out of this step from the plan editor.",                        from: ["pending"],                        to: [] },
          { id: "failed",             label: "failed",              tone: "danger",   description: "AI errored. No credit charged. User can retry.",                            from: ["running"],                        to: ["pending"] },
          { id: "manual_review",      label: "manual_review",       tone: "info",     description: "Special step — does no AI work, just pauses for the user to add context.", from: ["pending"],                        to: ["approved"] },
        ],
      },
      { type: "h", text: "Workflow-level states" },
      {
        type: "table",
        headers: ["Status", "What it means", "User can"],
        rows: [
          ["planning",            "Planner agent is generating the step list.",      "Wait (~5 sec)"],
          ["awaiting_approval",   "Plan generated, waiting for user to approve.",   "Edit, regenerate, approve, cancel"],
          ["running",             "Steps executing. May or may not pause for approval.", "Pause, cancel, view live progress"],
          ["paused",              "User manually paused mid-execution.",             "Resume, cancel"],
          ["done",                "All steps approved (or skipped). Workflow complete.", "View summary, fork to template"],
          ["failed",              "An unrecoverable step failed.",                  "Retry from failed step, view error log"],
          ["canceled",            "User killed the workflow before completion.",    "View what was completed before cancel"],
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Idempotent transitions",
        text: "Every state change goes through one updateStatus(stepId, newStatus) helper that validates the transition is legal. You can't go from 'approved' back to 'running' — that's how data corruption sneaks in. Cheap to build, saves weeks of debugging later.",
      },
    ],
  },

  // 4. Agent prompt design
  {
    id: "prompts",
    number: "04",
    title: "Agent Prompt Design",
    tagline: "Two new prompts. The Planner and the Step Resolver.",
    icon: "🧠",
    blocks: [
      {
        type: "p",
        text: "We don't need 15 new prompts. The 15 skill prompts from Prompt #4 keep doing the writing work. We add two coordinator prompts that decide WHAT to write and IN WHAT ORDER. Both live in /server/src/prompts/agent/ as Markdown.",
      },
      {
        type: "filecode",
        path: "server/src/prompts/agent/planner.md",
        lang: "md",
        description: "The planning agent — reads the user's goal, returns a structured plan as JSON.",
        code: `# AGENT: planner

## OBJECTIVE
Given a user's high-level marketing goal, return a step-by-step plan to ship it.
Each step uses one of the available SKILLS. Output is JSON, ready to render
in the plan-editor UI.

## CONTEXT
- Goal: {{goal}}
- Project: {{project_name}}
- Niche: {{project_niche}}
- Brand voice: {{brand_voice}}
- Available skills: {{available_skills}}    <!-- e.g. tiktok_script, email_sequence, … -->
- User tier: {{plan}}                        <!-- free | starter | pro | agency -->

## RULES
- Steps must be in execution order.
- Each step uses exactly ONE skill from the available list, OR the special skill "manual_review".
- 4-10 steps total. More than 10 = the goal is too vague — return one "manual_review" asking the user to clarify.
- Mark needsApproval = true for: sales_page_outline, email_welcome_sequence, launch_plan, offer_improvement_analysis.
- Mark needsApproval = false for low-stakes outputs: hashtag lists, single captions, single hook variations.
- Each step has a human-readable name (≤ 40 chars) the user will see in the UI.
- Pre-fill defaultInputs from the project's brand voice + goal — NOT generic placeholders.
- If the user's tier can't run the plan (would exceed credits), return only the first N steps that fit + a "manual_review" step explaining the cap.

## OUTPUT FORMAT (JSON only, no commentary)
\`\`\`json
{
  "title": "<≤ 60 char workflow title summarizing the goal>",
  "summary": "<one paragraph explaining the strategy>",
  "steps": [
    {
      "order": 1,
      "name": "Define audience and pain points",
      "skill": "manual_review",
      "needsApproval": true,
      "defaultInputs": { "instructions": "Confirm the audience for this launch in one sentence." },
      "rationale": "Locks the audience before generation so all downstream copy is consistent."
    },
    {
      "order": 2,
      "name": "Write 3 TikTok hooks",
      "skill": "hook_generator",
      "needsApproval": false,
      "defaultInputs": { "topic": "<filled from goal>", "platform": "TikTok" },
      "rationale": "Cheap, high-volume — pick the best hook before writing the full script."
    }
    // …
  ]
}
\`\`\``,
      },
      {
        type: "filecode",
        path: "server/src/prompts/agent/step_resolver.md",
        lang: "md",
        description: "Runs before each step — fills in inputs from shared context + prior outputs.",
        code: `# AGENT: step_resolver

## OBJECTIVE
Given a planned step and the current workflow context (including approved
outputs from prior steps), return the FINAL inputs to feed into the skill prompt.

## CONTEXT
- Step: {{step_name}} (skill: {{skill}})
- Default inputs: {{default_inputs}}
- Workflow goal: {{goal}}
- Project brand voice: {{brand_voice}}
- Approved prior outputs (summarized): {{prior_outputs}}

## RULES
- NEVER invent fields not present in the skill's expected input schema.
- Pull specifics (numbers, names, audience descriptions) from prior outputs when available.
- If a required field is missing AND can't be inferred, set it to null and add a "missing_fields" array.
- Output JSON, ready to POST to /api/generate/<skill>.

## OUTPUT FORMAT
\`\`\`json
{
  "inputs": { … },                            // matches the skill's expected fields
  "missing_fields": [],                       // empty if all good; otherwise the workflow pauses
  "rationale": "Pulled audience from step 1; brand voice from project."
}
\`\`\``,
      },
      {
        type: "callout",
        tone: "success",
        title: "JSON output mode is mandatory here",
        text: "Both agent prompts return JSON. Use OpenAI's response_format: { type: 'json_object' }. Parse with try/catch — if it fails, retry once with 'You returned invalid JSON. Try again.' before falling back to a manual_review step. Three failures in a row → mark workflow failed and refund the credits.",
      },
    ],
  },

  // 5. Human-in-the-loop
  {
    id: "hitl",
    number: "05",
    title: "Human-in-the-Loop Approvals",
    tagline: "Three checkpoints. Designed to feel like 1-tap, not 1-form.",
    icon: "🙋",
    blocks: [
      {
        type: "table",
        headers: ["Checkpoint", "When", "What user does", "Time per checkpoint"],
        rows: [
          ["Plan approval",     "After PLAN, before any AI generation runs.",   "Drag steps, delete, edit names, regenerate plan, click Approve.", "~30 sec"],
          ["Critical step approval", "After every step where needsApproval=true.", "Read output, Edit / Approve / Reject / Regenerate.",            "~60 sec"],
          ["Final review",      "All steps complete.",                           "Skim summary of N saved outputs. Optional: 'Save as template'.",  "~30 sec"],
        ],
      },
      {
        type: "h",
        text: "Designing the approval UI",
      },
      {
        type: "list",
        items: [
          "Show ONE thing at a time. Never show 'here are 8 outputs to approve' — feels like homework.",
          "Approve is the BIG primary button. Reject and Regenerate are secondary. Edit is a chevron expand.",
          "Show what's NEXT under the Approve button: 'Next: Write product description'. Builds momentum.",
          "If the user closes the tab mid-workflow, the workflow stays in awaiting_approval. Email them a magic link to resume.",
        ],
      },
      {
        type: "compare",
        label: "Approval UX",
        bad: "8 collapsible cards, all open, all asking for approval. User scrolls, gets overwhelmed, closes tab, never returns.",
        good: "Full-screen card showing ONE output. Big green Approve. 'Step 4 of 8'. Next step previewed below. Feels like Tinder — fast, clear, satisfying.",
      },
      {
        type: "callout",
        tone: "warn",
        title: "Don't pause for approval more than 4 times per workflow",
        text: "More than that and users abandon mid-flow. Bundle low-stakes approvals (3 caption variants → one approval). Cap at 4 checkpoints regardless of step count. Track 'completion rate by checkpoint count' as your North Star.",
      },
    ],
  },

  // 6. API routes
  {
    id: "routes",
    number: "06",
    title: "API Routes",
    tagline: "Six new endpoints. Reuses /api/generate/<skill> under the hood.",
    icon: "🛰️",
    blocks: [
      {
        type: "table",
        headers: ["Method", "Path", "Purpose"],
        rows: [
          ["POST",   "/api/workflows",                    "Create a workflow from a goal — runs planner agent, returns plan."],
          ["GET",    "/api/workflows/:id",                "Get workflow + all steps + statuses (used by the agent UI)."],
          ["PATCH",  "/api/workflows/:id/plan",           "Edit the plan before approval (drag/edit/delete steps)."],
          ["POST",   "/api/workflows/:id/approve-plan",   "Materialize plan into WorkflowStep rows + start execution."],
          ["POST",   "/api/workflows/:id/steps/:stepId/approve", "Approve a paused step → save output → run next."],
          ["POST",   "/api/workflows/:id/steps/:stepId/reject",  "Reject a paused step → pause workflow OR regenerate."],
          ["POST",   "/api/workflows/:id/cancel",         "Stop a running workflow."],
          ["POST",   "/api/workflow-templates",           "Save a completed workflow as a reusable template."],
          ["GET",    "/api/workflow-templates",           "List user + system templates."],
        ],
      },
      {
        type: "filecode",
        path: "server/src/routes/workflows.routes.ts (sketch)",
        lang: "ts",
        description: "Thin routes — all logic lives in workflow.service.ts.",
        code: `import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { generateLimiter } from "../middleware/rateLimit.js";
import {
  createWorkflowFromGoal,
  approvePlan,
  approveStep,
  rejectStep,
  cancelWorkflow,
  getWorkflow,
} from "../services/workflow.service.js";

const router = Router();
router.use(requireAuth);

router.post("/", generateLimiter, async (req, res, next) => {
  try {
    const { goal, projectId } = z.object({
      goal: z.string().min(8).max(500),
      projectId: z.string().cuid().optional(),
    }).parse(req.body);
    const wf = await createWorkflowFromGoal({ userId: req.user!.id, goal, projectId });
    res.status(201).json(wf);
  } catch (e) { next(e); }
});

router.post("/:id/approve-plan", async (req, res, next) => {
  try {
    const wf = await approvePlan({ userId: req.user!.id, workflowId: req.params.id });
    res.json(wf);
  } catch (e) { next(e); }
});

router.post("/:id/steps/:stepId/approve", async (req, res, next) => {
  try {
    // Optional: user-edited content overrides the AI output
    const { editedContent } = z.object({ editedContent: z.string().optional() }).parse(req.body);
    const result = await approveStep({
      userId: req.user!.id,
      workflowId: req.params.id,
      stepId: req.params.stepId,
      editedContent,
    });
    res.json(result);
  } catch (e) { next(e); }
});`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Why we DON'T expose /api/workflows/:id/steps/:stepId/run",
        text: "Steps run automatically inside the service — never triggered directly by the client. Otherwise the user could re-run + double-charge a step. The server owns the execution loop; the client only owns approve/reject inputs.",
      },
    ],
  },

  // 7. Frontend screens
  {
    id: "screens",
    number: "07",
    title: "Frontend Screens",
    tagline: "Three screens. Slot into the existing app router.",
    icon: "🖼️",
    blocks: [
      {
        type: "table",
        headers: ["Screen", "Page", "Purpose"],
        rows: [
          ["Goal Composer",       "/agent/new",           "One textarea: 'What do you want to ship?' + project picker + 'Generate plan' button."],
          ["Plan Approval",       "/agent/:id/plan",      "Shows generated plan as a draggable list of step cards. Edit / regenerate / approve."],
          ["Workflow Run",        "/agent/:id",           "Live timeline of steps. Spinner on running. Big approval cards on awaiting_approval. Final summary on done."],
        ],
      },
      {
        type: "h",
        text: "The Workflow Run screen — anatomy",
      },
      {
        type: "ordered",
        items: [
          "TOP: Workflow title + status badge + 'Pause' / 'Cancel' buttons.",
          "TIMELINE: Vertical list of all steps. Each shows: order, name, skill icon, status badge, completion time. Click any to view its output.",
          "ACTIVE PANEL (right side, sticky): If awaiting_approval, shows the current step's full output + Approve/Reject/Regenerate. If running, shows a spinner + 'Generating <step name>…'. If done, shows 'All N outputs saved → View library.'",
          "FOOTER: 'Save as template' button (only when status = done).",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Reuses everything we already built",
        text: "OutputViewer (with Markdown), CopyButton, SaveButton, EmptyState, Spinner — all from /src/app/ui/Primitives.tsx. The agent UI is mostly composition of existing primitives + 3 new layout components (PlanEditor, StepTimeline, StepApprovalCard).",
      },
    ],
  },

  // 8. MVP version
  {
    id: "mvp",
    number: "08",
    title: "MVP Version (4-6 weeks)",
    tagline: "The smallest agent that delivers real value.",
    icon: "🚀",
    blocks: [
      {
        type: "list",
        items: [
          "✅ One built-in workflow template: 'Launch a digital product' (8 steps, fixed order, fixed skills).",
          "✅ Goal Composer with template picker (no free-form goal yet).",
          "✅ Plan Approval (read-only — show the steps, but only 'Approve' or 'Cancel' for v1; no editing).",
          "✅ Sequential execution — one step at a time, no parallelism.",
          "✅ Approval pauses on the 3 critical steps (sales page, email sequence, launch plan).",
          "✅ Workflow Run screen with live status and one big approval card.",
          "✅ Auto-save approved outputs to library, scoped to the workflow's project.",
          "✅ 'Cancel workflow' kills it cleanly. Already-saved outputs stay.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Notice what's missing",
        text: "No free-form goals. No plan editor. No parallelism. No retries. No templates marketplace. No background jobs. The MVP is intentionally a 'guided launch wizard' that LOOKS agentic. Users get the value (one click → 8 outputs) without the failure modes of true autonomy.",
      },
    ],
  },

  // 9. Advanced version
  {
    id: "advanced",
    number: "09",
    title: "Advanced Version (Months 6-12)",
    tagline: "Once the MVP works for 100 users, layer these in one at a time.",
    icon: "🛸",
    blocks: [
      {
        type: "ordered",
        items: [
          "Free-form goals — Planner agent runs against any user-typed goal, not just templates.",
          "Plan editor — drag steps, edit names + inputs, regenerate from plan.",
          "Step parallelism — independent steps run concurrently (e.g. 3 hook variants in parallel).",
          "Step retries — auto-retry failed steps once with backoff before pausing the workflow.",
          "Workflow templates marketplace — users save successful workflows as templates; system curates the best.",
          "Cross-step learning — Planner reads user's last 5 approved workflows to personalize future plans.",
          "Background execution — long workflows keep running when user closes tab; resume via email link.",
          "Conditional steps — 'IF budget > $100, add lead-magnet step' (basic if/else in plan).",
          "Multi-project workflows — one workflow touches multiple projects (e.g. cross-promote two products).",
          "Voice goal input — 'Hey Chief of Staff, launch my serum next Tuesday.'",
          "Scheduled workflows — 'Run this 30-day plan starting March 1, one step per day.'",
          "Inter-agent collaboration — Planner + Critic + Editor agents review each other's output before user sees it.",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "Resist building these out of order",
        text: "Each item here is 1-3 weeks of work. The temptation is to build #5 (templates marketplace) before #1 (free-form goals) because it's a flashier demo. Don't. Free-form goals is what makes the agent useful. Marketplace is what makes it scale — different problem, later.",
      },
    ],
  },

  // 10. Error handling
  {
    id: "errors",
    number: "10",
    title: "Error Handling & Recovery",
    tagline: "Every failure mode has a defined recovery path.",
    icon: "🛑",
    blocks: [
      {
        type: "table",
        headers: ["Failure", "What happens", "User experience"],
        rows: [
          ["Planner returns invalid JSON",    "Auto-retry once. If still fails → workflow → failed.",                "Toast: 'Couldn't generate a plan. Try rewording the goal.'"],
          ["A step's AI call errors",         "Mark step → failed. Workflow → failed. NO credit charged for that step.", "Step card shows 'Failed — retry' button. Other approved outputs are kept."],
          ["A step's output fails validation", "Auto-regenerate ONCE. Then pause for manual approval.",              "Step card shows 'AI gave us something odd — regenerated. Please review.'"],
          ["User closes tab mid-execution",   "Workflow stays in current state. Steps already running complete.",   "On return: 'Resume workflow?' banner. Email link if absent > 1 hour."],
          ["User cancels mid-execution",      "Workflow → canceled. Already-approved outputs stay in library.",     "Toast: 'Cancelled. N outputs were already saved to your library.'"],
          ["Out of credits mid-workflow",     "Workflow → paused. Step that triggered it stays in awaiting_approval.", "Banner: 'You ran out of credits at step 5. Upgrade to continue.'"],
          ["Step depends on rejected output", "Workflow pauses. User picks: 'Skip this step' or 'Regenerate dependency'.", "Modal explains the dependency clearly."],
        ],
      },
      {
        type: "callout",
        tone: "danger",
        title: "The cardinal rule of agent failures",
        text: "Never 'silently continue with degraded output'. If a step fails, PAUSE and tell the user. Agent products that hide failures and produce subtly-wrong outputs are how trust evaporates. A loud failure is recoverable; a silent one is fatal.",
      },
    ],
  },

  // 11. What NOT to automate yet
  {
    id: "warning",
    number: "11",
    title: "What NOT to Automate Too Early",
    tagline: "Read this section before writing a single line of agent code.",
    icon: "🛑",
    blocks: [
      {
        type: "p",
        text: "Agent products die from premature autonomy more often than from any other cause. Every item below is something users will ASK you to automate. Resist. Each one becomes a real feature only after the boring foundations work for hundreds of users.",
      },
      {
        type: "table",
        headers: ["Don't automate yet", "Why it bites", "When you can"],
        rows: [
          ["Direct posting to social platforms",
           "AI writes something off-tone, gets posted, real-world embarrassment. Trust never recovers.",
           "After Phase 4 publishing UI ships AND you have explicit per-post approval, NEVER as a workflow step."],
          ["Sending real emails to a real list",
           "One bad subject line → unsubscribes + spam complaints → sender reputation tanks.",
           "After Gmail integration ships AND there's an explicit 'Send to my list' button, never silently."],
          ["Charging the user's customers",
           "AI sets a price 80% lower than intended → real revenue loss.",
           "Pricing decisions stay human-only. Forever, probably."],
          ["Multi-step workflows without ANY approval",
           "Eight bad outputs land in the library, user feels betrayed.",
           "Only after 12+ months and you've measured 'rejection rate per step' is < 5%."],
          ["Auto-replying to customer DMs as the user",
           "Customer has a complaint. Bot responds blandly. Complaint becomes a public post.",
           "After explicit 'Auto-reply ON' toggle per conversation, with a reviewed-by-human queue."],
          ["Spending the user's ad budget",
           "Boosting posts, running ads — even small mistakes burn $100s/day.",
           "Phase 6+ if ever. Don't be the AI that lost someone their grocery money."],
          ["Inferring 'brand voice' from one post",
           "Agent confidently uses tone X across 30 outputs. Tone X was a one-off joke.",
           "Voice profile requires explicit user-uploaded examples + an 'edit voice' page."],
          ["Overwriting the user's existing files",
           "AI 'improves' a doc, original is gone, user panics.",
           "Always create new versions. Never overwrite. Always."],
          ["Cross-account actions (your friends, your team)",
           "Privacy nightmares + permissions complexity that 10x's support burden.",
           "Phase 5 teams feature, behind explicit OAuth grants per user."],
        ],
      },
      {
        type: "callout",
        tone: "danger",
        title: "The agent product graveyard",
        text: "AutoGPT, BabyAGI, and a dozen 2023 agent startups died because they shipped 'fully autonomous' before the world wanted that. The winners (Cursor, Devin's launch UX, ChatGPT Tasks) all kept the human firmly in the loop. Pattern: ship 'speed for human-supervised work' first; pure autonomy is a 5-year horizon, not a 5-week one.",
      },
      {
        type: "compare",
        label: "Marketing copy for the agent feature",
        bad: "Tell Chief of Staff your goal — sit back while AI runs your entire launch automatically.",
        good: "Tell Chief of Staff your goal — get a complete launch ready for your approval in 20 minutes.",
      },
      {
        type: "callout",
        tone: "success",
        title: "Final word",
        text: "The 8 sections above describe the architecture. Section 11 describes the discipline. The architecture without the discipline is how you ship a demo that goes viral on Twitter and dies in production six weeks later. Build the agent. Keep the humans in charge.",
      },
    ],
  },
];
