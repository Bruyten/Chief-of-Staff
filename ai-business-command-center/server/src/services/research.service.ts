import { errors } from "../lib/errors.js";
import {
  collectRedditDiscussionSignals,
  collectWebTrendSignals,
} from "./researchProviders.service.js";

const ALLOWED_TIME_RANGES = new Set([
  "past_day",
  "past_7_days",
  "past_30_days",
  "past_90_days",
]);

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseDelimitedList(value: unknown, limit: number) {
  return asString(value)
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeKeyword(keyword: string) {
  return keyword
    .replace(/[<>|\\"]+/g, " ")
    .replace(/[+\-=~!:*()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function sanitizeSubreddit(value: string) {
  return value
    .replace(/^r\//i, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .trim()
    .slice(0, 60);
}

function toTimeRange(value: unknown) {
  const clean = asString(value);

  if (!ALLOWED_TIME_RANGES.has(clean)) {
    return "past_7_days";
  }

  return clean;
}

function clipJson(value: unknown, maxLength: number) {
  const serialized = JSON.stringify(value, null, 2);

  if (serialized.length <= maxLength) {
    return serialized;
  }

  return `${serialized.slice(
    0,
    maxLength,
  )}\n\n[Research payload truncated for prompt safety.]`;
}

export async function enrichDailyTrendResearchContext(
  context: Record<string, unknown>,
) {
  const rawKeywords = parseDelimitedList(
    context.researchKeywords,
    5,
  );

  const fallbackKeyword = asString(context.productName);

  const keywords = (
    rawKeywords.length > 0 ? rawKeywords : [fallbackKeyword]
  )
    .map(sanitizeKeyword)
    .filter(Boolean)
    .slice(0, 5);

  if (keywords.length === 0) {
    throw errors.badRequest(
      "Daily trend research requires at least one research keyword or product name.",
    );
  }

  const subreddits = parseDelimitedList(
    context.redditSubreddits,
    5,
  )
    .map(sanitizeSubreddit)
    .filter(Boolean)
    .slice(0, 3);

  const timeRange = toTimeRange(context.researchTimeRange);

  const [webTrendSignals, redditDiscussionSignals] = await Promise.all([
    collectWebTrendSignals({
      keywords,
      timeRange,
    }),
    collectRedditDiscussionSignals({
      keywords,
      subreddits,
      timeRange,
    }),
  ]);

  const researchBundle = {
    generatedAt: new Date().toISOString(),
    provider: "tavily",
    costControlNotes: {
      searchDepth: "basic",
      keywordLimit: 5,
      redditSearchLimit: 6,
      reason:
        "This MVP intentionally limits search volume to protect margins while still producing useful daily research briefs.",
    },
    keywords,
    subreddits,
    timeRange,
    webTrendSignals,
    redditDiscussionSignals,
  };

  return {
    ...context,
    researchKeywords: keywords.join(", "),
    redditSubreddits: subreddits.join(", "),
    researchTimeRange: timeRange,
    researchSourceDigest: clipJson(researchBundle, 32_000),
  };
}
