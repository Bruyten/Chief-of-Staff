# Scripts

## `restructure.sh` / `restructure.ps1`

One-shot script that moves the legacy flat layout into the proper `/client + /server` monorepo. **You only ever run this once** — when you first clone/download the repo.

### Why is this needed?

The repo was developed in a constrained build environment that required `index.html`, `vite.config.ts`, and `package.json` at the root. The shipped GitHub-ready layout is the standard monorepo:

```
chief-of-staff/
├── client/      ← all frontend
├── server/      ← all backend
└── package.json ← workspace root
```

These scripts perform that one-time move automatically.

### Usage

**macOS / Linux / WSL:**
```bash
chmod +x scripts/restructure.sh
./scripts/restructure.sh
```

**Windows PowerShell:**
```powershell
./scripts/restructure.ps1
```

The script:
1. Moves `./src/` → `./client/src/`
2. Removes legacy root config files (proper versions already exist in `./client/`)
3. Writes a workspace-aware `./package.json` that orchestrates both `client` and `server`
4. Prints next steps

After running, follow the printed steps to install + start the app.

### Safe to re-run

If `client/src/` already exists, the script exits cleanly without touching anything.
