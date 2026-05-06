# Monorepo Restructure — One-time Migration

> **You probably don't need this file.** If you cloned/forked this repo from GitHub, the structure is already correct (`/client + /server`). This file exists only for the original development environment, where everything was built from a flat root layout.

## Background

During development, the frontend was built at the **repo root** (the only path the build system supported). The shipped GitHub-ready repo uses a clean **monorepo layout**:

```
chief-of-staff/
├── client/          ← all frontend code
├── server/          ← all backend code (already correct)
├── render.yaml
├── package.json     ← workspace root
└── README.md
```

If you're reading this in a clone where the frontend is at the root (`./src/`, `./index.html`, `./vite.config.ts`) instead of `./client/`, run **one** of the migrations below to fix it.

---

## Option A — Use the bundled script (recommended)

We ship one-shot migration scripts for both Unix and Windows. They handle everything: move files, replace root `package.json`, print next steps.

```bash
# macOS / Linux / WSL
chmod +x scripts/restructure.sh
./scripts/restructure.sh

# Windows PowerShell
./scripts/restructure.ps1
```

Safe to re-run — exits cleanly if already restructured. See `scripts/README.md`.

## Option B — Manual file moves

1. Create `client/` directory at the repo root.
2. Move these into `client/`:
   - `index.html`
   - `vite.config.ts`
   - `tsconfig.json`
   - `src/` (entire folder)
   - `public/` (if it exists)
3. Copy `package.json` → `client/package.json` (the existing one — it has Vite, React, Tailwind deps).
4. Replace the **root** `package.json` with the workspace version (next section).
5. Verify both still build:
   ```bash
   cd client && npm install && npm run build
   cd ../server && npm install && npm run build
   ```

## Option C — The workspace root `package.json`

Save this as the new **root** `package.json` (replaces the old one):

```json
{
  "name": "chief-of-staff",
  "private": true,
  "version": "1.0.0",
  "description": "AI Marketing Assistant — full-stack SaaS",
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "install:all": "npm install --workspaces --include-workspace-root",
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "dev": "npm-run-all -p dev:client dev:server",
    "build:client": "npm run build --workspace=client",
    "build:server": "npm run build --workspace=server",
    "build": "npm run build:server && npm run build:client",
    "prisma:generate": "npm run prisma:generate --workspace=server",
    "prisma:migrate": "npm run prisma:migrate --workspace=server",
    "prisma:deploy": "npm run prisma:deploy --workspace=server",
    "db:seed": "npm run db:seed --workspace=server"
  },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  },
  "engines": {
    "node": ">=20"
  }
}
```

---

## After migrating

```bash
# From the repo root:
npm install                # installs both workspaces
npm run dev                # starts both client + server in parallel
```

You're done. The `render.yaml`, `README.md`, and `DEPLOY.md` already assume this layout — no further changes needed.

---

## Verifying the layout is correct

```bash
$ ls
client/  server/  render.yaml  package.json  README.md  DEPLOY.md  MIGRATE.md  .gitignore

$ ls client/
src/  index.html  vite.config.ts  tsconfig.json  package.json

$ ls server/
src/  prisma/  package.json  tsconfig.json  .env.example  README.md
```

If your tree matches this, you're good. Push to GitHub and follow `DEPLOY.md`.
