import { errors } from "../lib/errors.js";
import {
  collectGoogleSerpSignals,
  collectGoogleTrendSignals,
  collectRedditSignals,
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

function sanitizeTrendKeyword(keyword: string) {
  return keyword
    .replace(/[<>|\\"]+/g, " ")
    .replace(/[+\-=~!:*()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function toLocationCode(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 2840;
  }

  return parsed;
}

function toLanguageCode(value: unknown) {
  const clean = asString(value);

  if (!/^[a-z]{2}$/i.test(clean)) {
    return "en";
  }

  return clean.toLowerCase();
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
    .map(sanitizeTrendKeyword)
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
  ).map((value) =>
    value.replace(/^r\//i, "").trim().slice(0, 60),
  );

  const locationCode = toLocationCode(
    context.researchLocationCode,
  );

  const languageCode = toLanguageCode(
    context.researchLanguageCode,
  );

  const timeRange = toTimeRange(context.researchTimeRange);

  const [googleTrends, googleSerp, reddit] = await Promise.all([
    collectGoogleTrendSignals({
      keywords,
      locationCode,
      languageCode,
      timeRange,
    }),
    collectGoogleSerpSignals({
      keywords,
      locationCode,
      languageCode,
    }),
    collectRedditSignals({
      keywords,
      subreddits,
    }),
  ]);

  const researchBundle = {
    generatedAt: new Date().toISOString(),
    keywords,
    subreddits,
    providerNotes: {
      google:
        "Google Trends and Google SERP signals collected through the configured research provider.",
      reddit:
        reddit.status === "disabled"
          ? "Reddit research is currently disabled."
          : reddit.status === "failed"
            ? "Reddit research was attempted but failed."
            : "Reddit OAuth research completed.",
    },
    googleTrends,
    googleSerp,
    reddit,
  };

  return {
    ...context,
    researchKeywords: keywords.join(", "),
    redditSubreddits: subreddits.join(", "),
    researchLocationCode: String(locationCode),
    researchLanguageCode: languageCode,
    researchTimeRange: timeRange,
    researchSourceDigest: clipJson(researchBundle, 32_000),
  };
}
