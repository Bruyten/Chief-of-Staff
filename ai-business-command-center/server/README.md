# Chief of Staff — API

Express + TypeScript + Prisma + OpenAI backend for the AI marketing assistant.

## Local dev

```bash
cd server
cp .env.example .env             # then edit DATABASE_URL + JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate            # creates tables in your local Postgres
npm run db:seed                   # creates demo@chiefofstaff.app / demo1234
npm run dev                       # starts http://localhost:4000
```

The server boots in **FAKE_AI mode** by default — it returns canned Markdown
without calling OpenAI, so you can build the entire app for $0. Flip
`FAKE_AI=false` and add `OPENAI_API_KEY` when you're ready.

## Smoke test

```bash
curl http://localhost:4000/health
# { "ok": true, "service": "chief-of-staff-api", … }

# Sign up
curl -c cookies.txt -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"strongpass1","name":"New"}'

# Generate (cookie carries the JWT)
curl -b cookies.txt -X POST http://localhost:4000/api/generate/tiktok_script \
  -H "Content-Type: application/json" \
  -d '{"context":{"product_name":"Glow Serum","target_audience":"women 25-35"}}'
```

## Adding a new generator

1. Drop `server/src/prompts/skills/<name>.md` (use existing files as a guide).
2. That's it. The `/api/generate/<name>` route is automatically available.

## File map

```
server/
├─ prisma/
│  ├─ schema.prisma              5 models
│  └─ seed.ts                    Demo user
├─ src/
│  ├─ index.ts                   Boots HTTP server
│  ├─ app.ts                     Builds the Express app
│  ├─ env.ts                     Zod-validated env loader
│  ├─ lib/
│  │  ├─ prisma.ts               Singleton PrismaClient
│  │  ├─ aiClient.ts             OpenAI wrapper + FAKE_AI mode
│  │  ├─ promptAssembler.ts      Loads + fills prompt templates
│  │  ├─ jwt.ts                  Sign / verify JWT cookies
│  │  ├─ logger.ts               Pino with secret redaction
│  │  └─ errors.ts               HttpError + helpers
│  ├─ middleware/
│  │  ├─ requireAuth.ts          Verifies the cookie
│  │  ├─ rateLimit.ts            Per-IP buckets
│  │  └─ errorHandler.ts         Catches everything
│  ├─ services/
│  │  ├─ credits.service.ts      Atomic decrement
│  │  └─ generate.service.ts     The core orchestrator
│  ├─ routes/
│  │  ├─ auth.routes.ts          signup / login / logout / me
│  │  ├─ projects.routes.ts      CRUD
│  │  ├─ products.routes.ts      CRUD nested under project
│  │  ├─ generate.routes.ts      POST /api/generate/:skill
│  │  ├─ outputs.routes.ts       Library CRUD
│  │  └─ account.routes.ts       Usage + profile
│  └─ prompts/                   Markdown — version your prompts here
│     ├─ system/chief_of_staff.md
│     └─ skills/                 1 file per generator (15 total)
├─ .env.example
├─ tsconfig.json
└─ package.json
```
