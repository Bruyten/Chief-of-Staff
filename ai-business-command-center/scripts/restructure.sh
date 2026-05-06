#!/usr/bin/env bash
# =========================================================================
#  Chief of Staff — One-shot monorepo restructure
#  Moves the legacy flat layout into the proper /client + /server monorepo.
#  Safe to run multiple times — exits cleanly if already restructured.
# =========================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# Bail if /client/src already exists
if [ -d "client/src" ]; then
  echo "✅ Already restructured — /client/src exists. Nothing to do."
  exit 0
fi

# Sanity check — must have legacy layout
if [ ! -f "src/App.tsx" ] || [ ! -f "vite.config.ts" ]; then
  echo "❌ Can't find legacy layout (./src/App.tsx + ./vite.config.ts)."
  echo "   Are you in the right repo?"
  exit 1
fi

echo "🚚 Moving frontend files into /client/ ..."

# Make sure /client/ exists (config files were already created)
mkdir -p client

# Move source folders
[ -d "src" ]     && mv src     client/src
[ -d "public" ]  && mv public  client/public

# Remove legacy root files that are duplicated under /client
# (they already have proper versions in client/ from the initial setup)
[ -f "index.html" ]      && rm index.html
[ -f "vite.config.ts" ]  && rm vite.config.ts
[ -f "tsconfig.json" ]   && rm tsconfig.json

# Replace root package.json with the workspace version
cat > package.json <<'EOF'
{
  "name": "chief-of-staff",
  "private": true,
  "version": "1.0.0",
  "description": "AI Marketing Assistant — full-stack SaaS",
  "workspaces": ["client", "server"],
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
EOF

echo ""
echo "✅ Restructure complete."
echo ""
echo "Tree now looks like:"
ls -la
echo ""
echo "Next steps:"
echo "  1. rm -rf node_modules package-lock.json   # clear old lockfile"
echo "  2. npm install                              # installs both workspaces"
echo "  3. cd server && cp .env.example .env        # configure backend"
echo "  4. npm run prisma:migrate && npm run db:seed"
echo "  5. cd .. && npm run dev                     # both services in parallel"
