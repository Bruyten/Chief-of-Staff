// The complete master build plan for the Chief of Staff platform.
// This is rendered into the Blueprint view so the user has a living,
// browsable spec they can reference as we build each phase.

export type BlueprintSection = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  icon: string;
  blocks: Block[];
};

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "callout"; tone: "info" | "warn" | "success"; title: string; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "cards"; cards: { title: string; text: string; icon?: string }[] };

export const blueprint: BlueprintSection[] = [
  // 1. MVP
  {
    id: "mvp",
    number: "01",
    title: "The MVP — Build This First",
    tagline: "The smallest version that delivers real value to a real user this month.",
    icon: "🚀",
    blocks: [
      {
        type: "p",
        text: "Your MVP should be a focused AI content & launch assistant for digital product sellers, affiliate marketers, and beginners. Don't try to build Stripe, Gmail, Instagram, TikTok, and Drive integrations on day one — that path kills startups. Instead, ship one tight loop: 'Tell me about your product → I'll generate everything you need to launch and sell it.'",
      },
      { type: "h", text: "What the MVP does" },
      {
        type: "list",
        items: [
          "Sign up / log in (email + password)",
          "Create a Project (a business or product line)",
          "Add a Product inside a Project (name, description, price, audience, offer)",
          "Click a generator: TikTok script, caption, email, product description, sales page, launch plan, DM reply",
          "AI generates the output, saves it, lets the user edit, copy, or regenerate",
          "Library / History page of every output, filterable by project & type",
          "A simple dashboard with 'today's tasks' + recent outputs",
        ],
      },
      { type: "h", text: "What the MVP intentionally does NOT do (yet)" },
      {
        type: "list",
        items: [
          "No Stripe / Gmail / Instagram / Facebook / TikTok / Drive integrations",
          "No team accounts or roles",
          "No paid subscriptions (free during validation)",
          "No multi-step automations or workflow builder",
          "No analytics dashboards beyond simple counts",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "Why this is the right MVP",
        text: "It solves one painful, repetitive problem (content + launch copy) for a clearly defined user. It can be built in weeks, not months, and every later feature (automations, integrations, subscriptions) plugs cleanly into the same data model.",
      },
    ],
  },

  // 2. Full vision
  {
    id: "vision",
    number: "02",
    title: "The Full Platform Vision",
    tagline: "Where this grows into over 12–18 months.",
    icon: "🌐",
    blocks: [
      {
        type: "p",
        text: "Long term, Chief of Staff becomes a true AI operations layer for solo founders and small digital businesses — the place they run their day from.",
      },
      {
        type: "cards",
        cards: [
          { icon: "🧠", title: "AI Chief of Staff Chat", text: "A persistent assistant that knows your projects, products, customers, and recent outputs, and can take actions." },
          { icon: "⚙️", title: "Workflow Automations", text: "Triggers + actions: 'When a Stripe sale happens → email customer + add to Drive folder + post to IG.'" },
          { icon: "🔌", title: "Integrations Hub", text: "Stripe, Gmail, Google Drive, Instagram, Facebook, TikTok, Notion, Calendly, Shopify." },
          { icon: "📊", title: "Funnel & Offer Analyzer", text: "Paste a sales page or funnel and get an AI scorecard with rewrites." },
          { icon: "💸", title: "Subscriptions & Billing", text: "Free / Pro / Agency tiers via Stripe with usage-based AI credits." },
          { icon: "👥", title: "Teams & Clients", text: "Invite VAs, contractors, or clients with role-based permissions." },
          { icon: "📚", title: "Knowledge Base / Brand Voice", text: "Upload docs so AI writes in your brand's voice automatically." },
          { icon: "📅", title: "Content Calendar", text: "Schedule generated content directly to social channels." },
        ],
      },
    ],
  },

  // 3. Tech stack
  {
    id: "stack",
    number: "03",
    title: "Recommended Tech Stack",
    tagline: "Modern, beginner-friendly, and ready for Render + GitHub.",
    icon: "🧱",
    blocks: [
      {
        type: "table",
        headers: ["Layer", "Tool", "Why"],
        rows: [
          ["Frontend", "React + Vite + TypeScript + Tailwind CSS", "Fast, modern, huge community, easy to deploy as a static site."],
          ["Backend", "Node.js + Express (TypeScript)", "Simple, well-documented, runs perfectly on Render web services."],
          ["Database", "PostgreSQL (Render-hosted)", "Reliable, free tier on Render, great for relational data like projects/products/outputs."],
          ["ORM", "Prisma", "Type-safe queries, painless migrations, beginner-friendly schema file."],
          ["Auth", "JWT + bcrypt (later: Clerk or Auth.js)", "Start simple, swap in a managed provider when you scale."],
          ["AI", "OpenAI API (GPT-4o / GPT-4o-mini)", "Best quality + speed mix; mini for cheap tasks, full for premium ones."],
          ["File storage", "Cloudflare R2 or AWS S3 (later)", "For uploads like brand assets and PDFs."],
          ["Hosting (frontend)", "Render Static Site (or Vercel)", "Connects directly to your GitHub repo."],
          ["Hosting (backend)", "Render Web Service", "Auto-deploys from GitHub on every push."],
          ["Background jobs", "Render Cron + a jobs queue (BullMQ/Redis) later", "For scheduled posts & long automations."],
          ["Payments (later)", "Stripe", "Industry standard, simple subscription billing."],
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Why this stack for a beginner",
        text: "Every piece has world-class docs, free tiers, and a clear path from 'localhost' to 'live on the internet'. You won't paint yourself into a corner.",
      },
    ],
  },

  // 4. Database
  {
    id: "database",
    number: "04",
    title: "Database Structure",
    tagline: "The data model the entire app is built on.",
    icon: "🗄️",
    blocks: [
      { type: "p", text: "Eight core tables. Everything else is an extension of these." },
      {
        type: "code",
        lang: "prisma",
        code: `model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  plan          String    @default("free") // free | pro | agency
  credits       Int       @default(50)
  createdAt     DateTime  @default(now())
  projects      Project[]
  tasks         Task[]
  outputs       Output[]
  integrations  Integration[]
}

model Project {
  id          String    @id @default(cuid())
  userId      String
  name        String
  niche       String?
  brandVoice  String?
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
  products    Product[]
  outputs     Output[]
  tasks       Task[]
}

model Product {
  id           String   @id @default(cuid())
  projectId    String
  name         String
  description  String
  price        Float?
  audience     String?
  offer        String?
  createdAt    DateTime @default(now())
  project      Project  @relation(fields: [projectId], references: [id])
  outputs      Output[]
}

model Task {
  id          String    @id @default(cuid())
  userId      String
  projectId   String?
  title       String
  status      String    @default("pending") // pending | running | done | failed
  type        String    // generate_script | generate_email | analyze_offer ...
  input       Json
  result      Json?
  createdAt   DateTime  @default(now())
  completedAt DateTime?
  user        User      @relation(fields: [userId], references: [id])
  project     Project?  @relation(fields: [projectId], references: [id])
}

model Output {
  id         String   @id @default(cuid())
  userId     String
  projectId  String?
  productId  String?
  type       String   // tiktok_script | caption | email | product_desc | sales_page | launch_plan | dm_reply
  title      String
  content    String
  metadata   Json?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  project    Project? @relation(fields: [projectId], references: [id])
  product    Product? @relation(fields: [productId], references: [id])
}

model Integration {
  id           String   @id @default(cuid())
  userId       String
  provider     String   // stripe | gmail | gdrive | instagram | facebook | tiktok
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  meta         Json?
  user         User     @relation(fields: [userId], references: [id])
}

model Workflow {
  id        String   @id @default(cuid())
  userId    String
  name      String
  trigger   Json     // { type, config }
  steps     Json     // [{ action, config }, ...]
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
}

model UsageEvent {
  id        String   @id @default(cuid())
  userId    String
  kind      String   // ai_call | output_created | workflow_run
  cost      Int      @default(1)
  createdAt DateTime @default(now())
}`,
      },
    ],
  },

  // 5. Pages
  {
    id: "pages",
    number: "05",
    title: "Core Pages / Screens",
    tagline: "Every screen the user can land on, MVP and beyond.",
    icon: "🖼️",
    blocks: [
      { type: "h", text: "MVP screens" },
      {
        type: "ordered",
        items: [
          "Landing page (marketing)",
          "Sign up / Log in",
          "Dashboard (today's snapshot + quick actions)",
          "Projects list",
          "Project detail (products + outputs inside)",
          "Product detail",
          "Generator hub (pick a tool: script, caption, email, etc.)",
          "Output viewer / editor",
          "Library (all saved outputs, filterable)",
          "Task history",
          "Settings / profile",
        ],
      },
      { type: "h", text: "Phase 2+ screens" },
      {
        type: "list",
        items: [
          "Integrations hub (connect Stripe, Gmail, IG, etc.)",
          "Workflow builder (trigger → steps)",
          "Funnel / offer analyzer",
          "Content calendar",
          "Billing & subscription",
          "Team members & permissions",
          "AI Chief of Staff chat",
        ],
      },
    ],
  },

  // 6. Components
  {
    id: "components",
    number: "06",
    title: "Core Components",
    tagline: "Reusable building blocks across the UI.",
    icon: "🧩",
    blocks: [
      {
        type: "cards",
        cards: [
          { icon: "🧭", title: "Sidebar", text: "Persistent left nav with project switcher." },
          { icon: "🎴", title: "ProjectCard / ProductCard", text: "Compact summaries used in lists." },
          { icon: "🛠️", title: "GeneratorCard", text: "Tile representing one AI tool." },
          { icon: "📝", title: "OutputEditor", text: "Markdown-aware editor for generated content." },
          { icon: "📜", title: "PromptForm", text: "Dynamic form per generator type." },
          { icon: "📡", title: "TaskStatusBadge", text: "Pending / running / done / failed." },
          { icon: "📚", title: "LibraryTable", text: "Filter + search saved outputs." },
          { icon: "💳", title: "CreditMeter", text: "Shows AI credit usage." },
          { icon: "🔔", title: "Toast / Modal / EmptyState", text: "Standard UX primitives." },
        ],
      },
    ],
  },

  // 7. API routes
  {
    id: "api",
    number: "07",
    title: "Backend / API Routes",
    tagline: "The Express endpoints that power the MVP.",
    icon: "🛰️",
    blocks: [
      {
        type: "code",
        lang: "http",
        code: `# Auth
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

# Projects
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id

# Products
GET    /api/projects/:projectId/products
POST   /api/projects/:projectId/products
PATCH  /api/products/:id
DELETE /api/products/:id

# AI Generators (the heart of the MVP)
POST   /api/generate/tiktok-script
POST   /api/generate/caption
POST   /api/generate/email
POST   /api/generate/product-description
POST   /api/generate/sales-page
POST   /api/generate/launch-plan
POST   /api/generate/dm-reply
POST   /api/analyze/offer
POST   /api/analyze/funnel

# Outputs (saved generations)
GET    /api/outputs?projectId=&type=
GET    /api/outputs/:id
PATCH  /api/outputs/:id
DELETE /api/outputs/:id

# Tasks
GET    /api/tasks
GET    /api/tasks/:id

# Account
GET    /api/account/usage
PATCH  /api/account/profile

# Phase 2+
POST   /api/integrations/:provider/connect
POST   /api/workflows
POST   /api/billing/checkout`,
      },
      {
        type: "callout",
        tone: "info",
        title: "Pattern",
        text: "Every generate route does the same dance: validate input → check credits → call OpenAI with the right system prompt → save Output + Task → return result. We build that helper once and reuse it.",
      },
    ],
  },

  // 8. AI prompt architecture
  {
    id: "prompts",
    number: "08",
    title: "AI Prompt Architecture",
    tagline: "How the AI brain is organized so it stays consistent and improvable.",
    icon: "🧠",
    blocks: [
      { type: "p", text: "Prompts are NOT scattered through your code. They live in their own folder, versioned, and assembled at runtime from three layers:" },
      {
        type: "ordered",
        items: [
          "System layer — the persistent 'Chief of Staff' personality and rules (always included).",
          "Skill layer — the specific generator template (TikTok script, email, etc.).",
          "Context layer — runtime data: project name, brand voice, product info, audience.",
        ],
      },
      {
        type: "code",
        lang: "txt",
        code: `/server/prompts/
  system/
    chief_of_staff.md
  skills/
    tiktok_script.md
    caption.md
    email.md
    product_description.md
    sales_page.md
    launch_plan.md
    dm_reply.md
  analyzers/
    offer.md
    funnel.md`,
      },
      {
        type: "code",
        lang: "ts",
        code: `// Pseudocode for the prompt assembler
function buildPrompt(skill: string, context: Context) {
  const system = load("system/chief_of_staff.md");
  const skillTemplate = load(\`skills/\${skill}.md\`);
  const filled = render(skillTemplate, context); // {{product.name}} etc.
  return [
    { role: "system", content: system },
    { role: "user",   content: filled },
  ];
}`,
      },
      {
        type: "callout",
        tone: "success",
        title: "Why this matters",
        text: "When a prompt underperforms, you edit one Markdown file — not your TypeScript. You can also A/B test prompt versions and let users override brand voice without touching code.",
      },
    ],
  },

  // 9. User flow
  {
    id: "flow",
    number: "09",
    title: "User Flow",
    tagline: "From sign-up to first 'wow' moment in under 5 minutes.",
    icon: "🛤️",
    blocks: [
      {
        type: "ordered",
        items: [
          "User signs up → lands on empty dashboard with a friendly checklist.",
          "Step 1: 'Create your first project' (e.g. 'My Skincare Brand').",
          "Step 2: 'Add a product' — guided form (name, description, price, audience).",
          "Step 3: 'Generate your first asset' — picks a generator (TikTok script).",
          "AI runs (loading state with progress) and shows the result in an editor.",
          "User can edit, copy, regenerate, or save. It's auto-saved to the Library.",
          "Dashboard now shows recent outputs + suggests next assets ('Now generate a launch email').",
          "User comes back → sees their library, picks up where they left off.",
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "The 'wow' moment",
        text: "It's the first time they see a polished, on-brand TikTok script appear in 8 seconds for the product they just typed in. Everything in the MVP is engineered to get them to that moment fast.",
      },
    ],
  },

  // 10. Roadmap
  {
    id: "roadmap",
    number: "10",
    title: "Phased Roadmap — MVP → Full Platform",
    tagline: "Six phases, each one shippable and useful on its own.",
    icon: "🗺️",
    blocks: [
      {
        type: "table",
        headers: ["Phase", "Name", "Scope", "Goal"],
        rows: [
          ["1", "MVP — Content Engine", "Auth, projects, products, 7 generators, library, dashboard.", "Get 50 real users creating content daily."],
          ["2", "Monetize", "Stripe billing, Free / Pro / Agency tiers, AI credits meter.", "First $1k MRR."],
          ["3", "Brand Voice & Knowledge", "Upload docs/PDFs, brand voice profiles, output personalization.", "Higher quality, stickier users."],
          ["4", "Integrations Hub", "Stripe (read), Gmail send, Google Drive save, IG/FB post.", "Outputs leave the app and reach customers."],
          ["5", "Automations", "Workflow builder: triggers + steps + scheduling. TikTok integration.", "Replace 3+ tools per user."],
          ["6", "AI Chief of Staff", "Persistent chat that takes actions across projects. Teams & clients.", "Become the daily driver for solo founders."],
        ],
      },
    ],
  },

  // 11. Risks
  {
    id: "risks",
    number: "11",
    title: "Biggest Risks & How to Avoid Them",
    tagline: "What kills projects like this and how to dodge each one.",
    icon: "⚠️",
    blocks: [
      {
        type: "cards",
        cards: [
          { icon: "💸", title: "AI cost blowups", text: "Mitigation: credit system from day one, default to GPT-4o-mini, cap tokens, cache reusable contexts." },
          { icon: "🪨", title: "Building too much, too fast", text: "Mitigation: ship Phase 1 to real users before touching Phase 2. Cut, don't add." },
          { icon: "🔐", title: "Auth & security mistakes", text: "Mitigation: bcrypt for passwords, JWT in httpOnly cookies, never log secrets, env vars on Render only." },
          { icon: "📉", title: "Low output quality", text: "Mitigation: prompt files versioned, internal eval set, user 'thumbs up/down' on every output to learn what works." },
          { icon: "🔌", title: "Integration sprawl", text: "Mitigation: one integration framework, add providers one at a time, only after a paying user requests it." },
          { icon: "🧯", title: "Vendor lock-in", text: "Mitigation: abstract OpenAI calls behind an `aiClient` so swapping to Anthropic/Groq is a 1-file change." },
          { icon: "👻", title: "No users", text: "Mitigation: pick ONE niche (digital product sellers) and post your own AI-generated content from the app to attract them." },
          { icon: "🛟", title: "You burn out", text: "Mitigation: phases are designed so you can stop after any one and still have a real product." },
        ],
      },
    ],
  },

  // 12. How it all connects
  {
    id: "explainer",
    number: "12",
    title: "How It All Connects (Plain English)",
    tagline: "A non-developer walkthrough of the whole system.",
    icon: "🧒",
    blocks: [
      {
        type: "p",
        text: "Imagine your app as a restaurant.",
      },
      {
        type: "cards",
        cards: [
          { icon: "🍽️", title: "Frontend = the dining room", text: "React + Vite + Tailwind. This is what users see and click. Lives on Render as a static site, connected to your GitHub." },
          { icon: "👨‍🍳", title: "Backend = the kitchen", text: "Node + Express on Render. It takes orders (API requests), prepares them, and sends back food (data + AI output)." },
          { icon: "📒", title: "Database = the recipe book + pantry", text: "PostgreSQL on Render. Stores every user, project, product, and saved output forever." },
          { icon: "🧠", title: "OpenAI = a brilliant guest chef", text: "The kitchen calls the chef when an order needs creativity (writing scripts, emails, etc.). You pay per dish." },
          { icon: "🔑", title: "API keys = staff badges", text: "Secret strings that prove your kitchen is allowed to talk to OpenAI, Stripe, etc. They live ONLY in Render's environment variables, never in GitHub." },
          { icon: "🚚", title: "GitHub = the delivery system", text: "You push code to GitHub. Render watches GitHub. When you push, Render automatically rebuilds and redeploys both the dining room and the kitchen." },
        ],
      },
      {
        type: "p",
        text: "A real request, end to end:",
      },
      {
        type: "ordered",
        items: [
          "User clicks 'Generate TikTok Script' in the dining room (frontend).",
          "Frontend sends a POST request to /api/generate/tiktok-script in the kitchen (backend).",
          "Backend checks: is this user logged in? do they have credits left?",
          "Backend looks up the product in the recipe book (database).",
          "Backend assembles a prompt (system + skill + context) and calls OpenAI.",
          "OpenAI returns the script. Backend saves it as an Output row in the database.",
          "Backend sends the script back to the frontend.",
          "Frontend shows it in the editor. User edits, copies, or saves it.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Where we are right now",
        text: "This first build sets up the dining room — a beautiful frontend shell with the full plan visible AND a preview of the dashboard you'll be using. In the next prompts, we'll build the kitchen (Express backend), wire in the database, add real auth, and start connecting the AI generators one by one.",
      },
    ],
  },
];
