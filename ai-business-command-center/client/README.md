# Chief of Staff — Frontend

React 19 + Vite + Tailwind v4 + TypeScript SPA.

## Local dev

```bash
cp .env.example .env       # set VITE_API_URL (default localhost:4000 is fine)
npm install
npm run dev                # http://localhost:5173
```

## Build for production

```bash
npm run build              # outputs ./dist
npm run preview            # serves the production build locally to verify
```

## File structure

```
src/
├── App.tsx                Root — 13-tab switcher (12 docs + 1 live app)
├── main.tsx, index.css
├── data/                  Spec data files for the docs site (12 files)
├── components/            Docs view components (12 files)
├── app/                   The actual working SaaS app
│   ├── AppContext.tsx     Global state — supports mock + live API modes
│   ├── AppRouter.tsx      Page switcher
│   ├── lib/apiClient.ts   Single typed fetch wrapper for the entire app
│   ├── mock/data.ts       Seed data for mock mode
│   ├── layout/            AppShell (sidebar + topbar)
│   ├── ui/                Primitives, Markdown renderer, Toaster
│   └── pages/             9 pages: Login, Dashboard, NewTask, Projects,
│                          ProjectDetail, SavedOutputs, Templates, Pricing, Settings
└── utils/cn.ts
```

## Two modes

The login screen has a toggle:

- 🧪 **Mock mode** (default) — works with no backend. Uses local seed data.
- 🟢 **Live API mode** — talks to the Express backend at `VITE_API_URL`.

This means a designer can demo the entire UX without ever booting the server.

## Adding a new page

1. Create `src/app/pages/MyPage.tsx`
2. Add route to `src/app/AppRouter.tsx` and `src/app/AppContext.tsx`'s `AppPage` type
3. Add nav entry in `src/app/layout/AppShell.tsx`

## Connecting to a deployed API

In production, set `VITE_API_URL` to your Render API URL (e.g. `https://chief-of-staff-api.onrender.com`). Render's static-site service handles this automatically via the env-var auto-wiring in `render.yaml`.

> Anything prefixed `VITE_` is compiled into the browser bundle. NEVER put secrets in `client/.env`.
