import { env } from "../env.js";

type JsonObject = Record<string, unknown>;

export type GoogleTrendResearchResult = {
  status: "ok";
  keywords: string[];
  tasks: Array<{
    keyword: string;
    taskStatusCode: number | null;
    taskStatusMessage: string | null;
    result: unknown;
  }>;
};

export type GoogleSerpResearchResult = {
  status: "ok";
  searches: Array<{
    keyword: string;
    taskStatusCode: number | null;
    taskStatusMessage: string | null;
    organicResults: Array<{
      title: string | null;
      description: string | null;
      url: string | null;
      domain: string | null;
      rank: number | null;
    }>;
  }>;
};

export type RedditResearchResult =
  | {
      status: "disabled";
      searches: [];
      note: string;
    }
  | {
      status: "ok";
      searches: Array<{
        keyword: string;
        subreddit: string | null;
        posts: Array<{
          title: string;
          subreddit: string | null;
          permalink: string | null;
          score: number | null;
          commentCount: number | null;
          createdUtc: number | null;
        }>;
      }>;
    }
  | {
      status: "failed";
      searches: [];
      error: string;
    };

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object"
    ? (value as JsonObject)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

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

function buildBasicAuth(login: string, password: string) {
  return Buffer.from(`${login}:${password}`).toString("base64");
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

async function readJson(response: Response): Promise<unknown> {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

async function postDataForSeo(
  path: string,
  payload: unknown,
): Promise<JsonObject> {
  const login = env.DATAFORSEO_LOGIN.trim();
  const password = env.DATAFORSEO_PASSWORD.trim();

  if (!login || !password) {
    throw new Error(
      "DataForSEO research credentials are missing. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Render.",
    );
  }

  const response = await fetchWithTimeout(
    `https://api.dataforseo.com${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${buildBasicAuth(login, password)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const parsed = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(
      `DataForSEO request failed with HTTP ${response.status}.`,
    );
  }

  const statusCode = numeric(parsed.status_code);

  if (statusCode !== null && statusCode >= 40000) {
    throw new Error(
      text(parsed.status_message) ??
        "DataForSEO returned a provider error.",
    );
  }

  return parsed;
}

export async function collectGoogleTrendSignals(input: {
  keywords: string[];
  locationCode: number;
  languageCode: string;
  timeRange: string;
}): Promise<GoogleTrendResearchResult> {
  const tasks = input.keywords.map((keyword) => ({
    keywords: [keyword],
    location_code: input.locationCode,
    language_code: input.languageCode,
    type: "web",
    time_range: input.timeRange,
    item_types: ["google_trends_queries_list"],
    tag: `chief_of_staff_trends:${keyword}`,
  }));

  const response = await postDataForSeo(
    "/v3/keywords_data/google_trends/explore/live",
    tasks,
  );

  const returnedTasks = asArray(response.tasks);

  return {
    status: "ok",
    keywords: input.keywords,
    tasks: returnedTasks.map((taskValue, index) => {
      const task = asRecord(taskValue);
      const result = asArray(task.result)[0] ?? null;

      return {
        keyword: input.keywords[index] ?? "unknown",
        taskStatusCode: numeric(task.status_code),
        taskStatusMessage: text(task.status_message),
        result,
      };
    }),
  };
}

export async function collectGoogleSerpSignals(input: {
  keywords: string[];
  locationCode: number;
  languageCode: string;
}): Promise<GoogleSerpResearchResult> {
  const tasks = input.keywords.map((keyword) => ({
    keyword,
    location_code: input.locationCode,
    language_code: input.languageCode,
    device: "mobile",
    depth: 10,
    tag: `chief_of_staff_serp:${keyword}`,
  }));

  const response = await postDataForSeo(
    "/v3/serp/google/organic/live/regular",
    tasks,
  );

  const returnedTasks = asArray(response.tasks);

  return {
    status: "ok",
    searches: returnedTasks.map((taskValue, index) => {
      const task = asRecord(taskValue);
      const result = asRecord(asArray(task.result)[0]);
      const items = asArray(result.items);

      const organicResults = items
        .map(asRecord)
        .filter((item) => text(item.type) === "organic")
        .slice(0, 10)
        .map((item) => ({
          title: text(item.title),
          description:
            text(item.description) ??
            text(item.snippet) ??
            null,
          url: text(item.url),
          domain: text(item.domain),
          rank: numeric(item.rank_absolute),
        }));

      return {
        keyword: input.keywords[index] ?? "unknown",
        taskStatusCode: numeric(task.status_code),
        taskStatusMessage: text(task.status_message),
        organicResults,
      };
    }),
  };
}

async function getRedditAccessToken(): Promise<string> {
  const clientId = env.REDDIT_CLIENT_ID.trim();
  const clientSecret = env.REDDIT_CLIENT_SECRET.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Reddit OAuth credentials are missing.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
  });

  const response = await fetchWithTimeout(
    "https://www.reddit.com/api/v1/access_token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${buildBasicAuth(
          clientId,
          clientSecret,
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": env.REDDIT_USER_AGENT,
      },
      body,
    },
  );

  const parsed = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(
      `Reddit OAuth token request failed with HTTP ${response.status}.`,
    );
  }

  const token = text(parsed.access_token);

  if (!token) {
    throw new Error("Reddit OAuth token was not returned.");
  }

  return token;
}

async function searchReddit(input: {
  token: string;
  keyword: string;
  subreddit: string | null;
}) {
  const basePath = input.subreddit
    ? `/r/${encodeURIComponent(input.subreddit)}/search`
    : "/search";

  const query = new URLSearchParams({
    q: input.keyword,
    sort: "new",
    t: "week",
    limit: "5",
    raw_json: "1",
  });

  if (input.subreddit) {
    query.set("restrict_sr", "on");
  }

  const response = await fetchWithTimeout(
    `https://oauth.reddit.com${basePath}?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "User-Agent": env.REDDIT_USER_AGENT,
      },
    },
  );

  const parsed = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(`Reddit search failed with HTTP ${response.status}.`);
  }

  const children = asArray(asRecord(parsed.data).children);

  return children
    .map((child) => asRecord(asRecord(child).data))
    .slice(0, 5)
    .map((post) => ({
      title: text(post.title) ?? "(untitled)",
      subreddit: text(post.subreddit),
      permalink: text(post.permalink),
      score: numeric(post.score),
      commentCount: numeric(post.num_comments),
      createdUtc: numeric(post.created_utc),
    }));
}

export async function collectRedditSignals(input: {
  keywords: string[];
  subreddits: string[];
}): Promise<RedditResearchResult> {
  if (!env.RESEARCH_REDDIT_ENABLED) {
    return {
      status: "disabled",
      searches: [],
      note:
        "Reddit research is currently disabled by environment configuration.",
    };
  }

  try {
    const token = await getRedditAccessToken();

    const limitedKeywords = input.keywords.slice(0, 3);
    const limitedSubreddits = input.subreddits.slice(0, 3);

    const searchPlan =
      limitedSubreddits.length > 0
        ? limitedKeywords.flatMap((keyword) =>
            limitedSubreddits.map((subreddit) => ({
              keyword,
              subreddit,
            })),
          )
        : limitedKeywords.map((keyword) => ({
            keyword,
            subreddit: null,
          }));

    const searches = [];

    for (const item of searchPlan) {
      const posts = await searchReddit({
        token,
        keyword: item.keyword,
        subreddit: item.subreddit,
      });

      searches.push({
        keyword: item.keyword,
        subreddit: item.subreddit,
        posts,
      });
    }

    return {
      status: "ok",
      searches,
    };
  } catch (error) {
    return {
      status: "failed",
      searches: [],
      error:
        error instanceof Error
          ? error.message
          : "Reddit research failed.",
    };
  }
}
