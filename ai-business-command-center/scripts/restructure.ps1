# Chief of Staff — One-shot monorepo restructure (Windows PowerShell)
# Moves legacy flat layout into /client + /server monorepo.

$ErrorActionPreference = "Stop"

Set-Location -Path (Join-Path $PSScriptRoot "..")

if (Test-Path "client/src") {
  Write-Host "✅ Already restructured — /client/src exists. Nothing to do." -ForegroundColor Green
  exit 0
}

if (-not (Test-Path "src/App.tsx") -or -not (Test-Path "vite.config.ts")) {
  Write-Host "❌ Can't find legacy layout (./src/App.tsx + ./vite.config.ts)." -ForegroundColor Red
  Write-Host "   Are you in the right repo?"
  exit 1
}

Write-Host "🚚 Moving frontend files into /client/ ..." -ForegroundColor Cyan

if (-not (Test-Path "client")) { New-Item -ItemType Directory -Path "client" | Out-Null }

if (Test-Path "src")     { Move-Item -Path "src"    -Destination "client/src" }
if (Test-Path "public")  { Move-Item -Path "public" -Destination "client/public" }

if (Test-Path "index.html")     { Remove-Item "index.html" }
if (Test-Path "vite.config.ts") { Remove-Item "vite.config.ts" }
if (Test-Path "tsconfig.json")  { Remove-Item "tsconfig.json" }

@'
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
'@ | Out-File -FilePath "package.json" -Encoding utf8

Write-Host ""
Write-Host "✅ Restructure complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Remove-Item -Recurse -Force node_modules, package-lock.json"
Write-Host "  2. npm install"
Write-Host "  3. cd server; Copy-Item .env.example .env"
Write-Host "  4. npm run prisma:migrate; npm run db:seed"
Write-Host "  5. Set-Location ..; npm run dev"
