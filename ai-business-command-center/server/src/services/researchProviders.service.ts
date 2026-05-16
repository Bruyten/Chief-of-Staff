import { env } from "../env.js";

type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  raw_content?: string | null;
};

type TavilySearchResponse = {
  query?: string;
  answer?: string | null;
  results?: TavilySearchResult[];
  response_time?: number;
};

export type WebTrendResearchResult = {
  status: "ok";
  searches: Array<{
    keyword: string;
    query: string;
    answer: string | null;
    results: Array<{
      title: string | null;
      url: string | null;
      content: string | null;
      score: number | null;
    }>;
  }>;
};

export type RedditDiscussionResearchResult = {
  status: "ok" | "skipped";
  searches: Array<{
    keyword: string;
    subreddit: string | null;
    query: string;
    answer: string | null;
    results: Array<{
      title: string | null;
      url: string | null;
      content: string | null;
      score: number | null;
    }>;
  }>;
  note?: string;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function numeric(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function getTavilyApiKey() {
  const apiKey = env.TAVILY_API_KEY.trim();

  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is missing. Add the Tavily API key in Render before running research workflows.",
    );
  }

  return apiKey;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    env.RESEARCH_PROVIDER_TIMEOUT_MS,
  );

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function tavilySearch(input: {
  query: string;
  includeDomains?: string[];
  maxResults?: number;
}): Promise<TavilySearchResponse> {
  const response = await fetchWithTimeout(
    "https://api.tavily.com/search",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getTavilyApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: input.query,
        search_depth: "basic",
        topic: "general",
        max_results: input.maxResults ?? 5,
        include_answer: "basic",
        include_raw_content: false,
        ...(input.includeDomains?.length
          ? {
              include_domains: input.includeDomains,
            }
          : {}),
      }),
    },
  );

  const body = await response.text();

  let parsed: unknown = null;

  if (body) {
    try {
      parsed = JSON.parse(body) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message =
      parsed &&
      typeof parsed === "object" &&
      "detail" in parsed &&
      typeof parsed.detail === "string"
        ? parsed.detail
        : `Tavily search request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  return (parsed ?? {}) as TavilySearchResponse;
}

function normalizeResults(results: TavilySearchResult[] | undefined) {
  return (results ?? []).slice(0, 5).map((result) => ({
    title: text(result.title),
    url: text(result.url),
    content: text(result.content),
    score: numeric(result.score),
  }));
}

function makeGeneralTrendQuery(keyword: string, timeRange: string) {
  const timePhrase =
    timeRange === "past_day"
      ? "today"
      : timeRange === "past_30_days"
        ? "this month"
        : timeRange === "past_90_days"
          ? "recently"
          : "this week";

  return `${keyword} trend, audience questions, pain points, and market interest ${timePhrase}`;
}

function makeRedditQuery(
  keyword: string,
  subreddit: string | null,
  timeRange: string,
) {
  const timePhrase =
    timeRange === "past_day"
      ? "today"
      : timeRange === "past_30_days"
        ? "this month"
        : timeRange === "past_90_days"
          ? "recently"
          : "this week";

  if (subreddit) {
    return `site:reddit.com/r/${subreddit} ${keyword} discussion, questions, complaints, buying interest ${timePhrase}`;
  }

  return `site:reddit.com ${keyword} discussion, questions, complaints, buying interest ${timePhrase}`;
}

export async function collectWebTrendSignals(input: {
  keywords: string[];
  timeRange: string;
}): Promise<WebTrendResearchResult> {
  const searches = [];

  for (const keyword of input.keywords.slice(0, 5)) {
    const query = makeGeneralTrendQuery(keyword, input.timeRange);

    const result = await tavilySearch({
      query,
      maxResults: 5,
    });

    searches.push({
      keyword,
      query,
      answer: text(result.answer),
      results: normalizeResults(result.results),
    });
  }

  return {
    status: "ok",
    searches,
  };
}

export async function collectRedditDiscussionSignals(input: {
  keywords: string[];
  subreddits: string[];
  timeRange: string;
}): Promise<RedditDiscussionResearchResult> {
  const keywords = input.keywords.slice(0, 3);
  const subreddits = input.subreddits.slice(0, 3);

  if (keywords.length === 0) {
    return {
      status: "skipped",
      searches: [],
      note: "Reddit discovery was skipped because no research keywords were provided.",
    };
  }

  const searchPlan =
    subreddits.length > 0
      ? keywords.flatMap((keyword) =>
          subreddits.map((subreddit) => ({
            keyword,
            subreddit,
          })),
        )
      : keywords.map((keyword) => ({
          keyword,
          subreddit: null,
        }));

  const searches = [];

  for (const item of searchPlan.slice(0, 6)) {
    const query = makeRedditQuery(
      item.keyword,
      item.subreddit,
      input.timeRange,
    );

    const result = await tavilySearch({
      query,
      includeDomains: ["reddit.com"],
      maxResults: 5,
    });

    searches.push({
      keyword: item.keyword,
      subreddit: item.subreddit,
      query,
      answer: text(result.answer),
      results: normalizeResults(result.results),
    });
  }

  return {
    status: "ok",
    searches,
  };
}
