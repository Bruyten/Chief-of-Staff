import OpenAI from "openai";
import { env } from "../env.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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
        "OPENAI_API_KEY is empty. Either set it in the environment or set FAKE_AI=true.",
      );
    }

    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  return client;
}

const FAKE_FALLBACK = [
  "## Sample AI Output",
  "",
  "This is placeholder content generated while FAKE_AI mode is enabled.",
  "",
  "### Suggested Direction",
  "- Clarify the offer.",
  "- Focus the message on the intended audience.",
  "- Give the user one clear next step.",
  "",
  "### CTA",
  "Take the next action that moves this campaign forward.",
].join("\n");

export async function chat(
  messages: ChatMessage[],
): Promise<AiResponse> {
  const start = Date.now();

  if (env.FAKE_AI || !env.OPENAI_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      content: FAKE_FALLBACK,
      tokensIn: 0,
      tokensOut: 0,
      model: "fake-ai",
      latencyMs: Date.now() - start,
      fake: true,
    };
  }

  const response = await getClient().chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.8,
    max_tokens: 1200,
    messages,
  });

  return {
    content: response.choices[0]?.message?.content?.trim() || "",
    tokensIn: response.usage?.prompt_tokens ?? 0,
    tokensOut: response.usage?.completion_tokens ?? 0,
    model: response.model,
    latencyMs: Date.now() - start,
    fake: false,
  };
}
