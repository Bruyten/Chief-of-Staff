// Loads the system prompt + the requested skill prompt, fills {{placeholders}}
// from the request context, and returns ChatMessage[] ready for aiClient.chat().
//
// Prompts live in server/src/prompts/ as Markdown so they can be edited
// without touching TypeScript.

import fs from "node:fs";
import path from "node:path";
import type { ChatMessage } from "./aiClient.js";

const PROMPTS_DIR = path.resolve(process.cwd(), "src/prompts");

let cachedSystem: string | null = null;
function loadSystemPrompt(): string {
  if (cachedSystem) return cachedSystem;
  const p = path.join(PROMPTS_DIR, "system", "chief_of_staff.md");
  cachedSystem = fs.readFileSync(p, "utf-8");
  return cachedSystem;
}

const skillCache = new Map<string, string>();
function loadSkillPrompt(skill: string): string {
  if (skillCache.has(skill)) return skillCache.get(skill)!;
  const p = path.join(PROMPTS_DIR, "skills", `${skill}.md`);
  if (!fs.existsSync(p)) {
    throw new Error(`Unknown skill: ${skill}`);
  }
  const tpl = fs.readFileSync(p, "utf-8");
  skillCache.set(skill, tpl);
  return tpl;
}

/** Replace every {{key}} with ctx[key] (or "(not provided)") */
function fill(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = ctx[key];
    if (v === undefined || v === null || v === "") return "(not provided)";
    return String(v).trim();
  });
}

export function buildPrompt(skill: string, ctx: Record<string, unknown>): ChatMessage[] {
  const system = loadSystemPrompt();
  const skillTemplate = loadSkillPrompt(skill);
  const user = fill(skillTemplate, ctx);
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** List the skills available on disk — used by the /api/templates route. */
export function listSkills(): string[] {
  const dir = path.join(PROMPTS_DIR, "skills");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => f.replace(/\.md$/, ""));
}
