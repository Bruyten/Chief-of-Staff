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
const skillCache = new Map<string, string>();

export type BuildPromptOptions = {
  supplementalSystemContext?: string;
};

function loadSystemPrompt(): string {
  if (cachedSystem) {
    return cachedSystem;
  }

  const promptPath = path.join(
    PROMPTS_DIR,
    "system",
    "chief_of_staff.md",
  );

  cachedSystem = fs.readFileSync(promptPath, "utf-8");
  return cachedSystem;
}

function loadSkillPrompt(skill: string): string {
  const cached = skillCache.get(skill);

  if (cached) {
    return cached;
  }

  const promptPath = path.join(PROMPTS_DIR, "skills", `${skill}.md`);

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Unknown skill: ${skill}`);
  }

  const template = fs.readFileSync(promptPath, "utf-8");
  skillCache.set(skill, template);

  return template;
}

/**
 * Replace every {{key}} with ctx[key] or "(not provided)".
 */
function fill(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = ctx[key];

    if (value === undefined || value === null || value === "") {
      return "(not provided)";
    }

    return String(value).trim();
  });
}

export function buildPrompt(
  skill: string,
  ctx: Record<string, unknown>,
  options: BuildPromptOptions = {},
): ChatMessage[] {
  const system = loadSystemPrompt();
  const skillTemplate = loadSkillPrompt(skill);
  const user = fill(skillTemplate, ctx);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: system,
    },
  ];

  const supplementalSystemContext =
    options.supplementalSystemContext?.trim();

  if (supplementalSystemContext) {
    messages.push({
      role: "system",
      content: supplementalSystemContext,
    });
  }

  messages.push({
    role: "user",
    content: user,
  });

  return messages;
}

/**
 * List the skills available on disk — used by the templates API.
 */
export function listSkills(): string[] {
  const dir = path.join(PROMPTS_DIR, "skills");

  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => file.replace(/\.md$/, ""));
}
