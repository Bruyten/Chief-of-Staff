// One thin wrapper around the AI provider. Swap providers in this file only.
//
// FAKE_AI mode lets you build the entire backend WITHOUT an API key. The
// "model" returns a canned Markdown payload after a short delay so the
// frontend can demo the full flow for $0.

import OpenAI from "openai";
import { env } from "../env.js";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiResponse = {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  latencyMs: number;
  fake: boolean;
};

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    if (!env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is empty. Either set it in .env or set FAKE_AI=true to use canned outputs."
      );
    }
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export async function chat(messages: ChatMessage[]): Promise<AiResponse> {
  const start = Date.now();

  // ----- FAKE_AI mode -----
  if (env.FAKE_AI || !env.OPENAI_API_KEY) {
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    return {
      content: FAKE_FALLBACK,
      tokensIn: 0,
      tokensOut: 0,
      model: "fake-ai",
      latencyMs: Date.now() - start,
      fake: true,
    };
  }

  // ----- REAL OpenAI -----
  const resp = await getClient().chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.8,
    max_tokens: 900,
    messages,
  });

  const content = resp.choices[0]?.message?.content ?? "";
  return {
    content,
    tokensIn: resp.usage?.prompt_tokens ?? 0,
    tokensOut: resp.usage?.completion_tokens ?? 0,
    model: resp.model,
    latencyMs: Date.now() - start,
    fake: false,
  };
}

// Generic placeholder used when no skill-specific fake exists.
// (The route layer overrides this with the matching template's example
// output for a much more realistic demo.)
const FAKE_FALLBACK = `**Hook (0–2s):** I tried 11 skincare brands. Only one stopped my breakouts.

**Script:**
1. For 8 months I had cystic acne every period week.
2. Then I swapped my $60 serum for this $24 one.
3. Three drops at night. That's it.
4. Two weeks in, my skin actually looked like skin again.
5. The link is in my bio if you want what I used.

**CTA:** Tap the link in my bio to grab the bundle.

**Hashtags:** #skincaretok #cysticacne #honestreview #skincareroutine #foundit`;
