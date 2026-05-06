# Chief of Staff — AI Marketing Assistant

> An AI-powered business command center for digital product sellers, affiliate marketers, course creators, and beginners. Generate marketing copy, organize it under projects, save to a personal library, and grow into a full SaaS — billing, integrations, and agentic workflows already designed in.

[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Express%20%2B%20Prisma%20%2B%20OpenAI-violet)](#tech-stack)
[![Deploy](https://img.shields.io/badge/deploy-Render-46e3b7)](#deploy)
[![Status](https://img.shields.io/badge/status-MVP%20feature--complete-success)](#whats-included)

---

## Table of Contents

1. [What is this](#what-is-this)
2. [What's included](#whats-included)
3. [Repository layout](#repository-layout)
4. [Quick start (local dev)](#quick-start-local-dev)
5. [Tech stack](#tech-stack)
6. [Deploy](#deploy) — see also [DEPLOY.md](./DEPLOY.md) for non-developers
7. [Environment variables](#environment-variables)
8. [How to add a new AI generator](#how-to-add-a-new-ai-generator)
9. [Roadmap](#roadmap)
10. [License](#license)

---

## What is this

Chief of Staff is a real, working AI marketing SaaS — not a tutorial. The repo contains:

- A **full React frontend** (Vite + Tailwind) with auth, dashboard, 15-template generator, project library, edit/delete/filter, pricing page, settings.
- A **production-grade Express + Prisma + OpenAI backend** with JWT auth, atomic credit accounting, prompt assembler, rate limiting, secret-safe logging.
- **15 AI generator templates** (TikTok script, Instagram caption, email sequence, sales page outline, 30-day content plan, and 10 more) — each as a versioned Markdown file.
- **Stripe billing** wired in: 4 plans (Free / Starter / Pro / Agency), Checkout, customer portal, webhook lifecycle handler.
- **`FAKE_AI` and `FAKE_STRIPE` modes** so you can build, test, demo, and even soft-launch before adding any API keys.
- A complete **architecture spec site** (browse it at the live URL after deploy) with 12 sections covering every design decision, data flow, and roadmap milestone.

> **You can run the entire app locally for $0.** With both fake modes on, no Stripe account, no OpenAI key, no payment, nothing — full sign-up, generate, save, upgrade, cancel — all works against a local Postgres.

---

## What's included

| Layer | Implementation |
|---|---|
| **Frontend pages** | Login, Dashboard, New Task, Projects, Project Detail, Saved Outputs, Templates, Pricing, Settings |
| **AI generators** | TikTok / FB Reel / IG Caption / YT Shorts / Product Description / Sales Page / Email Sequence / DM Reply / 30-Day Content Plan / Offer Analysis / Lead Magnet Ideas / Launch Plan / Hook Generator / Objection Post / Trust Post |
| **Database** | User, Project, Product, Output, Task, Subscription (Postgres via Prisma) |
| **Auth** | Email + password, bcrypt, JWT in httpOnly cookie, Zod-validated everything |
| **Payments** | Stripe Checkout (subscription mode), customer portal, webhook → DB sync |
| **Defense** | helmet, CORS allowlist, 3-tier rate limiting (api / auth / generate), atomic credit decrement, cross-tenant guards on every query, body-size cap |
| **DX** | TypeScript everywhere, Prisma type-safe queries, Pino logger w/ secret redaction, single-file env validator |

See `/docs-site` (this repo's frontend) for the complete spec — every architecture decision is documented in 12 sections.

---

## Repository layout

```
chief-of-staff/
├── client/                       React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx, index.css
│   │   ├── data/                12 spec data files (powers the docs site)
│   │   ├── components/          12 docs view components
│   │   ├── app/                 The actual working SaaS app
│   │   │   ├── AppContext.tsx, AppRouter.tsx
│   │   │   ├── lib/apiClient.ts        Typed fetch wrapper
│   │   │   ├── mock/data.ts            Seed data for mock mode
│   │   │   ├── layout/AppShell.tsx     Sidebar + topbar shell
│   │   │   ├── ui/                     Primitives, Markdown, Toaster
│   │   │   └── pages/                  9 live pages (login, dashboard, …)
│   │   └── utils/cn.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                       Node + Express + Prisma + OpenAI backend
│   ├── src/
│   │   ├── index.ts             Boots HTTP server + graceful shutdown
│   │   ├── app.ts               Builds the Express app
│   │   ├── env.ts               Zod-validated env loader (crash on boot if missing)
│   │   ├── lib/
│   │   │   ├── prisma.ts        Singleton client
│   │   │   ├── aiClient.ts      OpenAI wrapper + FAKE_AI mode
│   │   │   ├── stripeClient.ts  Stripe wrapper + FAKE_STRIPE mode
│   │   │   ├── promptAssembler.ts  Loads /prompts, fills {{placeholders}}
│   │   │   ├── plans.ts         Single source of truth for plans/credits/Stripe price IDs
│   │   │   ├── jwt.ts, logger.ts, errors.ts
│   │   ├── middleware/          requireAuth, rateLimit, errorHandler
│   │   ├── services/            credits, generate, billing
│   │   ├── routes/              auth, projects, products, generate, outputs,
│   │   │                        account, billing, webhook (8 routers)
│   │   └── prompts/
│   │       ├── system/chief_of_staff.md
│   │       └── skills/                15 .md files (one per generator)
│   ├── prisma/
│   │   ├── schema.prisma        User, Project, Product, Output, Task, Subscription
│   │   └── seed.ts              Demo user + project + product
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── render.yaml                  One-click Render deploy (DB + API + static site)
├── package.json                 Workspace root (`npm i` installs both)
├── .gitignore
├── README.md                    You are here
├── DEPLOY.md                    Step-by-step deploy guide for non-developers
└── MIGRATE.md                   One-time monorepo restructure script
```

---

## Quick start (local dev)

**Prerequisites:** Node.js 20+, PostgreSQL 14+ (free local install or Docker), npm.

### 0. Restructure (one-time, only if you cloned the original layout)

If your repo has `./src/` and `./index.html` at the root (legacy layout), run the one-time restructure:

```bash
# macOS / Linux / WSL
./scripts/restructure.sh

# Windows
./scripts/restructure.ps1
```

This moves `./src/` → `./client/src/` and writes the workspace-aware root `package.json`. **If your repo already has `./client/` and `./server/` at the root, skip this step.** See `scripts/README.md` for details.

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/chief-of-staff.git
cd chief-of-staff
# (run step 0 if needed)
npm install                          # installs both client + server via workspaces
```

### 2. Provision a local Postgres

Easiest: Docker.

```bash
docker run --name cos-pg -e POSTGRES_PASSWORD=cos -e POSTGRES_DB=chief -p 5432:5432 -d postgres:16
```

Or install Postgres directly and create a `chief` database.

### 3. Configure the server

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET. Leave OPENAI_API_KEY empty.
# Generate JWT_SECRET with:  openssl rand -hex 32
```

Default `.env` ships with `FAKE_AI=true` and `FAKE_STRIPE=true` — so you don't need an OpenAI or Stripe account to run everything end-to-end.

### 4. Initialize the database

```bash
npm run prisma:generate
npm run prisma:migrate               # creates all tables
npm run db:seed                      # creates demo@chiefofstaff.app / demo1234
```

### 5. Start both servers

From the **repo root** in two terminals:

```bash
# Terminal 1 — backend on :4000
npm run dev:server

# Terminal 2 — frontend on :5173
npm run dev:client
```

Open <http://localhost:5173>. Click the **App** tab. Sign in with `demo@chiefofstaff.app` / `demo1234`.

### 6. Switch to live API mode

By default the frontend loads in **🧪 Mock mode** (no backend needed). On the login screen, flip the toggle to **🟢 Live API** to talk to your real Express server. Refresh-resilient session works (cookie hydration via `/api/auth/me`).

### 7. (Optional) Add a real OpenAI key

When you're ready for real AI:

```bash
# server/.env
FAKE_AI="false"
OPENAI_API_KEY="sk-…"
OPENAI_MODEL="gpt-4o-mini"
```

Restart the server. Every generation now calls OpenAI.

### 8. (Optional) Add real Stripe

See `DEPLOY.md` → **"Going live with Stripe"**. Until then, FAKE_STRIPE simulates the entire upgrade/cancel flow inside the app.

---

## Tech stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | **React 19 + Vite + TypeScript + Tailwind v4** | Fast dev loop, smallest possible static build, zero runtime cost on Render. |
| Backend | **Node + Express + TypeScript** | One small process per service. Easy to reason about, deploys to any Node host. |
| Database | **PostgreSQL** (Render or any Postgres host) | Battle-tested, free tier on Render. |
| ORM | **Prisma** | Type-safe queries, painless migrations, vendor-portable. |
| Auth | **JWT in httpOnly cookies + bcrypt** | No third-party auth dependency. Swappable for Clerk/Supabase Auth later. |
| AI | **OpenAI** (GPT-4o-mini default) | Best price/quality. Wrapped behind one file — swap providers in 1 file. |
| Validation | **Zod** | Same schemas validate API inputs AND infer TypeScript types. |
| Payments | **Stripe** (Checkout + Customer Portal + Webhooks) | Industry standard. Customer Portal removes ~3 weeks of UI work. |
| Hosting | **Render** (Static Site + Web Service + Postgres) | Single vendor, single dashboard, GitHub auto-deploy. |
| Logging | **Pino** with secret redaction | Fast, JSON, redacts passwords/tokens/keys before they hit logs. |

---

## Deploy

Two paths:

- **Non-developer? → Read [DEPLOY.md](./DEPLOY.md).** Step-by-step from "I just forked this repo on GitHub" to "I have a live URL", written for someone who's never touched Render before.
- **Developer? → Use `render.yaml`:**

```bash
# 1. Push this repo to GitHub
# 2. In Render dashboard: New + → Blueprint → Connect repo
# 3. Render reads render.yaml and provisions:
#    - PostgreSQL database (free tier)
#    - Web Service (Express API at chief-of-staff-api.onrender.com)
#    - Static Site (React frontend at chief-of-staff-web.onrender.com)
# 4. Set secret env vars in Render dashboard:
#    - JWT_SECRET           (openssl rand -hex 32)
#    - OPENAI_API_KEY       (when ready, otherwise leave + FAKE_AI=true)
#    - STRIPE_SECRET_KEY    (when ready, otherwise leave + FAKE_STRIPE=true)
#    - STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*  (when going live with billing)
# 5. First deploy auto-runs: prisma migrate deploy + npm start
```

That's the entire deploy.

---

## Environment variables

### Server (`server/.env` locally; Render dashboard in production)

| Var | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Postgres connection string |
| `JWT_SECRET` | ✅ | — | 32+ random chars (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | | `7d` | Cookie / token lifetime |
| `OPENAI_API_KEY` | when `FAKE_AI=false` | — | OpenAI secret key |
| `OPENAI_MODEL` | | `gpt-4o-mini` | Default model |
| `FAKE_AI` | | `true` | When true, AI calls return canned Markdown (no key needed) |
| `CLIENT_ORIGIN` | ✅ | `http://localhost:5173` | CORS allowlist (your frontend URL) |
| `PORT` | | `4000` | HTTP port (Render injects this) |
| `NODE_ENV` | | `development` | `production` on Render |
| `FAKE_STRIPE` | | `true` | When true, billing simulates without Stripe |
| `STRIPE_SECRET_KEY` | when `FAKE_STRIPE=false` | — | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | when `FAKE_STRIPE=false` | — | From Stripe webhook endpoint settings |
| `STRIPE_PRICE_STARTER` | when going live | — | `price_…` for $19/mo plan |
| `STRIPE_PRICE_PRO` | when going live | — | `price_…` for $49/mo plan |
| `STRIPE_PRICE_AGENCY` | when going live | — | `price_…` for $99/mo plan |
| `BILLING_SUCCESS_URL` | | local | Stripe redirect after success |
| `BILLING_CANCEL_URL` | | local | Stripe redirect after cancel |

### Client (`client/.env`; Render dashboard in production)

| Var | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | ✅ in prod | `http://localhost:4000` | Backend base URL the SPA calls |

> **NEVER prefix a secret with `VITE_`.** Anything starting with `VITE_` is compiled into the browser bundle and visible to every visitor.

---

## How to add a new AI generator

Add a new template in **30 seconds, zero code changes**:

```bash
# 1. Drop a file
touch server/src/prompts/skills/my_new_skill.md

# 2. Use any existing file as a template (e.g. tiktok_script.md)
# 3. That's it. POST /api/generate/my_new_skill is now live.
```

The prompt assembler reads the `/prompts/skills/` folder fresh on each call. The `/api/generate/:skill` route auto-discovers it. To surface it in the UI, add an entry to `client/src/data/templates.ts`.

---

## Roadmap

The full integration roadmap and agent system are designed (see the live spec site, **Int** and **Agent** tabs):

- **Phase 2 (1-3 mo)** — ✅ Stripe, ⬜ Zapier, ⬜ n8n
- **Phase 3 (3-6 mo)** — ⬜ Gmail, ⬜ Google Drive, ⬜ Make, ⬜ Google Calendar
- **Phase 4 (6-12 mo)** — ⬜ Canva, ⬜ Instagram, ⬜ Facebook
- **Phase 5 (Year 2)** — ⬜ TikTok, ⬜ Agent workflows ("Launch my product this week")

---

## License

MIT. Use it, fork it, sell it. A credit link to the original repo is appreciated but not required.

---

**Built with discipline.** Every architecture decision is documented in the live spec site (12 tabs). When something breaks, you'll know exactly which file owns the fix.
