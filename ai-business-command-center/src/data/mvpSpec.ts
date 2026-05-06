// MVP Specification — Prompt #2
// The smallest sellable version of the Chief of Staff platform.
// This is the contract we'll build against in Phase 1.

export type SpecBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "callout"; tone: "info" | "warn" | "success" | "danger"; title: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "checklist"; items: { label: string; done?: boolean; note?: string }[] }
  | { type: "code"; lang: string; code: string }
  | { type: "screen"; name: string; purpose: string; inputs: string[]; outputs: string[]; actions: string[] }
  | { type: "split"; left: { title: string; items: string[] }; right: { title: string; items: string[] } };

export type SpecSection = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  icon: string;
  blocks: SpecBlock[];
};

export const mvpSpec: SpecSection[] = [
  // 1. Smallest sellable MVP
  {
    id: "smallest",
    number: "01",
    title: "Smallest Sellable MVP",
    tagline: "What you can charge $19/month for in 4–6 weeks.",
    icon: "🎯",
    blocks: [
      {
        type: "p",
        text: "The smallest version anyone will pay for is a focused 'product → marketing assets' generator. One user, one product, four generators, a clean library. That's it. Everything else is decoration that delays your first paying customer.",
      },
      {
        type: "split",
        left: {
          title: "✅ IN the MVP",
          items: [
            "Email + password auth (no social login)",
            "1 user → many projects → many products",
            "Product intake form (the heart of the MVP)",
            "4 generators: TikTok script, Instagram caption, Product description, Email sequence",
            "AI output viewer with Copy + Save buttons",
            "Saved Outputs library (filter by project + type)",
            "Simple dashboard (counts + recent outputs)",
            "Free tier with hard cap (e.g. 25 generations) → upgrade prompt",
          ],
        },
        right: {
          title: "❌ OUT of the MVP",
          items: [
            "Facebook Reel script (almost identical to TikTok — add later)",
            "Sales page outline (long output, harder to QA)",
            "DM reply (small payoff, niche use)",
            "30-day content plan (needs scheduling UI to feel valuable)",
            "Offer improvement analysis (needs different UX flow)",
            "Teams, sharing, exports, integrations, webhooks",
            "Workflow builder, brand voice profiles, file uploads",
            "Stripe billing (collect emails on a waitlist instead at first)",
          ],
        },
      },
      {
        type: "callout",
        tone: "success",
        title: "Why 4 generators, not 9",
        text: "TikTok script + IG caption + product description + email sequence cover ~80% of what a digital product seller posts in their first week. Each is short, easy to evaluate, and the prompt cost is low. The other 5 generators ship in Phase 1.5 once we've validated the core loop.",
      },
    ],
  },

  // 2. What we cut and why
  {
    id: "cuts",
    number: "02",
    title: "What We Cut & Why",
    tagline: "Every removal makes the MVP shippable faster.",
    icon: "✂️",
    blocks: [
      {
        type: "table",
        headers: ["Removed", "Why", "When it returns"],
        rows: [
          ["Facebook Reel script", "Output is 95% the same as TikTok. Add it as a 1-checkbox toggle later.", "Phase 1.5"],
          ["Sales page outline", "Long output, harder to evaluate quality, slows MVP testing.", "Phase 2"],
          ["DM reply generator", "Low usage frequency for the target user.", "Phase 2"],
          ["30-day content plan", "Only useful with calendar UI + scheduling — too big for MVP.", "Phase 3"],
          ["Offer improvement analysis", "Needs a paste-in URL flow, different from product intake.", "Phase 2"],
          ["Brand voice profiles", "Useful but a power-user feature; ship without first.", "Phase 2"],
          ["Stripe billing", "Validate desire first via free tier + waitlist for Pro.", "Phase 2"],
          ["Integrations (IG, Stripe, Gmail)", "Each is weeks of OAuth work and adds zero value to the core loop.", "Phase 4"],
          ["Team accounts", "Solo founders are the MVP audience.", "Phase 5"],
          ["Workflow automations", "Belongs to the 'AI Chief of Staff' phase.", "Phase 5"],
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "Rule of thumb",
        text: "If a feature doesn't help a user produce a piece of marketing copy in under 60 seconds, it's not in the MVP.",
      },
    ],
  },

  // 3. Screens
  {
    id: "screens",
    number: "03",
    title: "Exact Screens (8 Total)",
    tagline: "Every page in the MVP, no more, no less.",
    icon: "🖼️",
    blocks: [
      {
        type: "screen",
        name: "1. Landing Page",
        purpose: "Convert visitors into sign-ups. One headline, one demo gif, one CTA.",
        inputs: ["—"],
        outputs: ["Sign-up button"],
        actions: ["Click 'Get Started Free' → /signup"],
      },
      {
        type: "screen",
        name: "2. Sign Up / Log In",
        purpose: "Email + password. One screen with a toggle. No social login in MVP.",
        inputs: ["Email", "Password", "(Sign-up only) Name"],
        outputs: ["JWT cookie set", "Redirect to /dashboard"],
        actions: ["Submit form", "Toggle to login mode", "Forgot password (Phase 1.5)"],
      },
      {
        type: "screen",
        name: "3. Dashboard",
        purpose: "First thing users see after logging in. Shows progress + a clear 'do this next' button.",
        inputs: ["—"],
        outputs: [
          "Counts: projects, products, outputs, credits remaining",
          "Recent outputs (last 5)",
          "'Generate' big button",
          "Onboarding checklist if user has 0 projects",
        ],
        actions: ["+ New Project", "+ New Generation", "Click an output to view it"],
      },
      {
        type: "screen",
        name: "4. Projects List",
        purpose: "All projects (businesses or product lines) the user has created.",
        inputs: ["—"],
        outputs: ["Cards: name, niche, # products, # outputs"],
        actions: ["+ New Project", "Click a card → /projects/:id"],
      },
      {
        type: "screen",
        name: "5. Project Detail",
        purpose: "Inside a project: list of products + recent outputs scoped to it.",
        inputs: ["—"],
        outputs: ["Product cards", "Outputs filtered to this project"],
        actions: ["+ Add Product", "Click product → product intake form", "Generate from a product"],
      },
      {
        type: "screen",
        name: "6. Generator Page (the core screen)",
        purpose: "Pick a template, fill in the intake form, get AI output. This is where 80% of value happens.",
        inputs: [
          "Template selector (TikTok / Caption / Description / Email)",
          "Product name",
          "Product description",
          "Audience",
          "Pain point",
          "Offer type (course / digital product / service / affiliate / coaching)",
          "Call to action",
        ],
        outputs: ["AI-generated content displayed in an editable text area"],
        actions: ["Generate", "Regenerate", "Copy to clipboard", "Save to library", "Edit inline"],
      },
      {
        type: "screen",
        name: "7. Saved Outputs (Library)",
        purpose: "Every saved output, searchable and filterable. The user's growing asset bank.",
        inputs: ["Search box", "Filter by project", "Filter by template type"],
        outputs: ["List of saved outputs with title, type, project, date"],
        actions: ["Click → view full output", "Copy", "Delete", "Edit title"],
      },
      {
        type: "screen",
        name: "8. Settings",
        purpose: "Profile + credits + sign out. Minimal.",
        inputs: ["Display name", "Email (read-only in MVP)"],
        outputs: ["Plan badge (Free)", "Credits used this month"],
        actions: ["Update name", "Sign out", "Delete account (Phase 1.5)"],
      },
      {
        type: "callout",
        tone: "info",
        title: "Why 8 and not 12",
        text: "We collapsed 'task history' into the library, dropped product detail (use the project page), and skipped a separate 'integrations' screen entirely. Fewer screens = less code = faster ship.",
      },
    ],
  },

  // 4. User input data
  {
    id: "inputs",
    number: "04",
    title: "What the User Enters",
    tagline: "The exact intake form that powers every generator.",
    icon: "⌨️",
    blocks: [
      { type: "p", text: "All four generators share one intake form. The only thing that changes is the template selector at the top — that decides which AI prompt runs." },
      {
        type: "table",
        headers: ["Field", "Type", "Required", "Example", "Used by"],
        rows: [
          ["Template", "Dropdown", "Yes", "TikTok Script", "Routes to the right AI prompt"],
          ["Product Name", "Text (max 80)", "Yes", "Glow Serum Bundle", "Title of every output"],
          ["Product Description", "Textarea (max 600)", "Yes", "A 3-step skincare set for oily skin…", "Core context to AI"],
          ["Target Audience", "Text (max 120)", "Yes", "Women 25–35 with oily skin", "Tone + vocabulary"],
          ["Main Pain Point", "Text (max 200)", "Yes", "Breakouts that won't go away", "The hook"],
          ["Offer Type", "Dropdown", "Yes", "Digital Product / Course / Affiliate / Service / Coaching", "Tone + structure"],
          ["Call to Action", "Text (max 120)", "Yes", "Get 20% off at glowserum.com", "Closes every output"],
          ["Project", "Dropdown", "Yes", "Skincare Brand", "Where output gets saved"],
          ["Tone (optional)", "Dropdown", "No", "Friendly / Bold / Expert / Funny", "Phase 1.5 — skip in MVP"],
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Why one shared form",
        text: "Users don't want to relearn an interface for each generator. One form + a template switcher means they can rapid-fire test multiple angles for the same product in seconds.",
      },
    ],
  },

  // 5. AI output
  {
    id: "outputs",
    number: "05",
    title: "What the AI Generates",
    tagline: "Exact output shape for each of the 4 generators.",
    icon: "✨",
    blocks: [
      {
        type: "h",
        text: "TikTok Script",
      },
      {
        type: "list",
        items: [
          "Hook (1–2 lines, ≤ 15 words, pattern-interrupt)",
          "Body (3–5 short lines, problem → solution → proof)",
          "CTA (1 line, urgency)",
          "On-screen text suggestions (3 bullets)",
          "Suggested hashtags (5)",
        ],
      },
      { type: "h", text: "Instagram Caption" },
      {
        type: "list",
        items: [
          "Hook line",
          "2–4 short paragraphs",
          "CTA line",
          "10 hashtags (mix of broad + niche)",
        ],
      },
      { type: "h", text: "Product Description" },
      {
        type: "list",
        items: [
          "1-line hero promise",
          "3 benefit bullets (outcome-focused, not feature-listy)",
          "Short paragraph framing the offer",
          "CTA sentence",
        ],
      },
      { type: "h", text: "Email Sequence (3-email starter)" },
      {
        type: "list",
        items: [
          "Email 1 — Awareness: subject + 80–120 word body + CTA",
          "Email 2 — Value/proof: subject + 80–120 word body + CTA",
          "Email 3 — Urgency/close: subject + 80–120 word body + CTA",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Output format",
        text: "All outputs return as Markdown. The frontend renders Markdown for display and stores the raw Markdown in the database. This makes Copy / Save / Edit identical across all 4 generators.",
      },
    ],
  },

  // 6. What gets saved
  {
    id: "save",
    number: "06",
    title: "What Gets Saved",
    tagline: "The exact data persisted in the database.",
    icon: "💾",
    blocks: [
      {
        type: "code",
        lang: "ts",
        code: `// Saved when user clicks "Save to Library"
Output {
  id           // auto
  userId       // who owns it
  projectId    // which project it belongs to
  type         // "tiktok_script" | "caption" | "product_desc" | "email_sequence"
  title        // defaults to product name + template, user-editable
  content      // the Markdown the AI returned (after any edits)
  inputSnapshot // JSON of the intake form so they can re-run it
  createdAt
}

// Saved automatically every time AI runs (even before "Save to Library")
Task {
  id
  userId
  projectId
  type
  status       // "running" | "done" | "failed"
  input        // the intake form
  result       // the Markdown
  tokensUsed   // for credit accounting
  createdAt
  completedAt
}

// Decremented on every successful generation
User.credits   // starts at 25 for free tier`,
      },
      {
        type: "callout",
        tone: "warn",
        title: "Important nuance",
        text: "Every AI run creates a Task row even if the user never clicks Save. This gives you (a) accurate credit accounting, (b) a debug trail when generations fail, and (c) the ability to add 'Recover unsaved generation' later. Outputs are only created when the user explicitly hits Save.",
      },
    ],
  },

  // 7. What waits
  {
    id: "later",
    number: "07",
    title: "What Waits Until Later",
    tagline: "Parked features and the phase they belong to.",
    icon: "⏳",
    blocks: [
      {
        type: "table",
        headers: ["Feature", "Phase", "Why later"],
        rows: [
          ["Facebook Reel script generator", "1.5", "Quick add once TikTok prompt is dialed in."],
          ["Sales page outline generator", "2", "Long-form, needs section-by-section UX."],
          ["DM reply generator", "2", "Different UX (paste a DM, get a reply)."],
          ["30-day content plan", "3", "Needs calendar view + scheduling."],
          ["Offer improvement analyzer", "2", "Different intake (URL or paste-in)."],
          ["Brand voice profiles", "2", "Power feature; needs settings + prompt injection."],
          ["File / image uploads", "3", "Storage costs + moderation overhead."],
          ["Stripe paid tiers", "2", "Validate willingness to pay first via waitlist."],
          ["Stripe / Gmail / IG integrations", "4", "Each = OAuth + webhooks + edge cases."],
          ["AI Chief of Staff chat", "5", "Needs vector search across user data."],
          ["Teams / clients / roles", "5", "Solo founders first."],
          ["Workflow automations", "5", "Trigger system + job queue required."],
        ],
      },
    ],
  },

  // 8. Feature checklist
  {
    id: "checklist",
    number: "08",
    title: "Clean MVP Feature Checklist",
    tagline: "Print this. Tape it to your monitor.",
    icon: "✅",
    blocks: [
      { type: "h", text: "Auth" },
      {
        type: "checklist",
        items: [
          { label: "Email + password sign up" },
          { label: "Email + password log in" },
          { label: "Logout" },
          { label: "JWT in httpOnly cookie" },
          { label: "Auth middleware on protected routes" },
        ],
      },
      { type: "h", text: "Projects & products" },
      {
        type: "checklist",
        items: [
          { label: "Create / list / delete projects" },
          { label: "Create / list / delete products inside a project" },
          { label: "Project switcher in the generator form" },
        ],
      },
      { type: "h", text: "Generator (the core)" },
      {
        type: "checklist",
        items: [
          { label: "Shared intake form with all required fields" },
          { label: "Template selector (4 options)" },
          { label: "Generate button → calls backend → shows loading state" },
          { label: "Render Markdown output in an editor" },
          { label: "Copy to clipboard button" },
          { label: "Save to Library button" },
          { label: "Regenerate button (uses last input)" },
          { label: "Credit check before each call" },
          { label: "Friendly error states (out of credits, AI failure)" },
        ],
      },
      { type: "h", text: "Library" },
      {
        type: "checklist",
        items: [
          { label: "List all saved outputs" },
          { label: "Filter by project" },
          { label: "Filter by template type" },
          { label: "Search by title" },
          { label: "View full output", note: "Read-only modal or detail view" },
          { label: "Delete output" },
        ],
      },
      { type: "h", text: "Dashboard" },
      {
        type: "checklist",
        items: [
          { label: "Stat cards (projects / products / outputs / credits)" },
          { label: "Recent 5 outputs" },
          { label: "Empty-state onboarding checklist" },
          { label: "Big 'New Generation' CTA" },
        ],
      },
      { type: "h", text: "Settings" },
      {
        type: "checklist",
        items: [
          { label: "Update display name" },
          { label: "Show plan + credits" },
          { label: "Sign out" },
        ],
      },
      { type: "h", text: "Backend essentials" },
      {
        type: "checklist",
        items: [
          { label: "Express server with health check" },
          { label: "Prisma schema + migration applied to Render Postgres" },
          { label: "OpenAI client with prompt assembler" },
          { label: "Error logging (console + later: Sentry)" },
          { label: "CORS configured for the frontend origin" },
          { label: "Rate limit on /api/generate/* routes" },
        ],
      },
      { type: "h", text: "Deployment" },
      {
        type: "checklist",
        items: [
          { label: "GitHub repo with /client and /server" },
          { label: "render.yaml describing both services + DB" },
          { label: "Env vars set in Render (never in repo)" },
          { label: "Frontend deployed as static site" },
          { label: "Backend deployed as web service" },
          { label: "Postgres database provisioned on Render" },
        ],
      },
    ],
  },

  // 9. Build order
  {
    id: "buildorder",
    number: "09",
    title: "Build Order — First File to Live Deployment",
    tagline: "Follow this order. Don't skip steps.",
    icon: "🛠️",
    blocks: [
      {
        type: "ordered",
        items: [
          "Initialize the monorepo: /client (this React app) + /server (Express + Prisma).",
          "Create Prisma schema with User, Project, Product, Task, Output. Run first migration locally (SQLite) for speed.",
          "Build the Express skeleton: server.ts, /health route, error middleware, CORS, dotenv loader.",
          "Implement auth: POST /signup, POST /login, POST /logout, GET /me, JWT in httpOnly cookie.",
          "Implement projects + products CRUD routes (no AI yet).",
          "Build the prompt assembler + /server/prompts/ folder with system prompt and 4 skill prompts.",
          "Wrap OpenAI in /server/lib/aiClient.ts so swapping providers is one file.",
          "Implement the 4 generator routes — each one: validate → check credits → call AI → save Task → return Markdown.",
          "Implement /api/outputs (list, create, get, patch, delete).",
          "Switch frontend from mocked data to real fetch calls. Build pages in this order: Login → Dashboard → Projects → Project detail → Generator → Library → Settings.",
          "Add loading + error + empty states to every page.",
          "Add credit meter + 'out of credits' modal.",
          "Switch local DB from SQLite to Render Postgres. Re-run migration.",
          "Write render.yaml describing static site (client) + web service (server) + postgres DB.",
          "Push to GitHub. Connect repo to Render. Set env vars: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, CLIENT_ORIGIN.",
          "First deploy. Smoke test signup → create project → generate → save → see in library.",
          "Add basic analytics (PostHog free tier or simple event log) so you know what users actually use.",
          "Soft-launch to 10 hand-picked users. Iterate prompts based on real feedback.",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Time estimate (solo, evenings/weekends)",
        text: "Steps 1–9: ~2 weeks. Steps 10–13: ~2 weeks. Steps 14–18: ~1 week. Total: 4–6 weeks to a paying-customer-ready MVP.",
      },
    ],
  },

  // 10. Pricing & monetization (bonus)
  {
    id: "money",
    number: "10",
    title: "How the MVP Makes Money (Bonus)",
    tagline: "A lightweight monetization plan that doesn't slow the build.",
    icon: "💰",
    blocks: [
      {
        type: "table",
        headers: ["Tier", "Price", "Limits", "Status in MVP"],
        rows: [
          ["Free", "$0", "25 generations/month, 1 project, 4 generators", "Live at launch"],
          ["Pro (waitlist)", "$19/mo", "Unlimited generations, unlimited projects, all generators", "Email capture only — Stripe in Phase 2"],
          ["Agency", "$49/mo", "Pro + 3 client workspaces", "Phase 5"],
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Validation play",
        text: "When a free user hits 25 generations, show a waitlist modal: 'Join the Pro waitlist for $19/mo unlimited.' If 30+ people join in 2 weeks, you've validated demand. Then ship Stripe in Phase 2 with confidence.",
      },
    ],
  },
];
