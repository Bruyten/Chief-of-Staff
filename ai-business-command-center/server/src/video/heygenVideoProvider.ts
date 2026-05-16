import { env } from "../env.js";
import type {
  VideoProvider,
  VideoProviderCreateInput,
  VideoProviderCreateResult,
  VideoProviderPollInput,
  VideoProviderPollResult,
} from "./videoProvider.types.js";

const DEFAULT_HEYGEN_BASE_URL = "https://api.heygen.com";
const HEYGEN_PROMPT_MAX_LENGTH = 10_000;

type HeyGenCreateResponse = {
  data?: {
    session_id?: string;
    status?: string;
    created_at?: number;
    video_id?: string | null;
  };
};

type HeyGenSessionResponse = {
  data?: {
    session_id?: string;
    status?: string;
    created_at?: number;
    progress?: number;
    title?: string | null;
    video_id?: string | null;
  };
};

type HeyGenSessionVideo = {
  id?: string;
  status?: string;
  title?: string | null;
  created_at?: number | null;
  completed_at?: number | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  gif_url?: string | null;
  captioned_video_url?: string | null;
  subtitle_url?: string | null;
  duration?: number | null;
  failure_code?: string | null;
  failure_message?: string | null;
  video_page_url?: string | null;
};

type HeyGenSessionVideosResponse = {
  data?: HeyGenSessionVideo[];
  has_more?: boolean;
  next_token?: string | null;
};

type JsonRequestInit = {
  method: "GET" | "POST";
  headers: Record<string, string>;
  body?: string;
};

export class HeyGenVideoProvider implements VideoProvider {
  readonly name = "heygen";

  async createJob(
    input: VideoProviderCreateInput,
  ): Promise<VideoProviderCreateResult> {
    const prompt = normalizePrompt(input.promptBrief);
    const orientation = toHeyGenOrientation(input.aspectRatio);

    const payload = {
      prompt,
      mode: "generate",
      ...(orientation ? { orientation } : {}),
      incognito_mode: true,
    };

    const response = await requestJson<HeyGenCreateResponse>(
      "/v3/video-agents",
      {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(payload),
      },
    );

    const sessionId = response.data?.session_id?.trim();

    if (!sessionId) {
      throw new Error(
        "HeyGen accepted the request but did not return a video session ID.",
      );
    }

    return {
      externalJobId: sessionId,
      providerStatus: response.data?.status ?? "generating",
      raw: {
        sessionId,
        providerStatus: response.data?.status ?? "generating",
        videoId: response.data?.video_id ?? null,
        promptCharactersSent: prompt.length,
        orientation: orientation ?? null,
        requestedDurationSeconds: input.durationSeconds,
      },
    };
  }

  async pollJob(
    input: VideoProviderPollInput,
  ): Promise<VideoProviderPollResult> {
    const sessionId = encodeURIComponent(input.externalJobId);

    const [sessionResponse, videosResponse] = await Promise.all([
      requestJson<HeyGenSessionResponse>(
        `/v3/video-agents/${sessionId}`,
        {
          method: "GET",
          headers: createHeaders(),
        },
      ),
      requestJson<HeyGenSessionVideosResponse>(
        `/v3/video-agents/${sessionId}/videos`,
        {
          method: "GET",
          headers: createHeaders(),
        },
      ),
    ]);

    const session = sessionResponse.data;
    const newestVideo = videosResponse.data?.[0];

    const providerStatus =
      newestVideo?.status ??
      session?.status ??
      "processing";

    const videoUrl =
      newestVideo?.video_url ??
      newestVideo?.captioned_video_url ??
      null;

    const thumbnailUrl =
      newestVideo?.thumbnail_url ??
      null;

    const failureMessage =
      newestVideo?.failure_message ??
      null;

    const normalizedStatus = normalizeHeyGenStatus({
      providerStatus,
      videoUrl,
      failureMessage,
    });

    return {
      providerStatus,
      normalizedStatus,
      videoUrl,
      thumbnailUrl,
      errorMessage:
        normalizedStatus === "failed"
          ? failureMessage || "HeyGen reported that the video generation failed."
          : null,
      raw: {
        sessionId: input.externalJobId,
        sessionStatus: session?.status ?? null,
        sessionProgress: session?.progress ?? null,
        sessionVideoId: session?.video_id ?? null,
        latestVideoId: newestVideo?.id ?? null,
        latestVideoStatus: newestVideo?.status ?? null,
        latestVideoDuration: newestVideo?.duration ?? null,
        failureCode: newestVideo?.failure_code ?? null,
        videoPageUrl: newestVideo?.video_page_url ?? null,
        pollAttempts: input.pollAttempts,
      },
    };
  }
}

function createHeaders(): Record<string, string> {
  const apiKey = env.VIDEO_PROVIDER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "VIDEO_PROVIDER_API_KEY is required when VIDEO_PROVIDER=heygen.",
    );
  }

  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };
}

function getBaseUrl(): string {
  const configured = env.VIDEO_PROVIDER_BASE_URL?.trim();

  return (configured || DEFAULT_HEYGEN_BASE_URL).replace(/\/+$/, "");
}

async function requestJson<T>(
  path: string,
  init: JsonRequestInit,
): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}`, init);
  const text = await response.text();

  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      buildProviderErrorMessage(response.status, payload),
    );
  }

  return (payload ?? {}) as T;
}

function buildProviderErrorMessage(
  status: number,
  payload: unknown,
): string {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;

  const data =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;

  const providerMessage =
    typeof root?.message === "string"
      ? root.message
      : typeof root?.error === "string"
        ? root.error
        : typeof data?.message === "string"
          ? data.message
          : null;

  if (providerMessage) {
    return `HeyGen API request failed (${status}): ${providerMessage}`;
  }

  return `HeyGen API request failed with HTTP status ${status}.`;
}

function normalizePrompt(promptBrief: string): string {
  const trimmed = promptBrief.trim();

  if (!trimmed) {
    throw new Error("The video prompt brief is empty.");
  }

  if (trimmed.length <= HEYGEN_PROMPT_MAX_LENGTH) {
    return trimmed;
  }

  return trimmed.slice(0, HEYGEN_PROMPT_MAX_LENGTH);
}

function toHeyGenOrientation(
  aspectRatio: VideoProviderCreateInput["aspectRatio"],
): "portrait" | "landscape" | undefined {
  if (aspectRatio === "9:16") {
    return "portrait";
  }

  if (aspectRatio === "16:9") {
    return "landscape";
  }

  return undefined;
}

function normalizeHeyGenStatus(args: {
  providerStatus: string;
  videoUrl: string | null;
  failureMessage: string | null;
}): VideoProviderPollResult["normalizedStatus"] {
  if (args.videoUrl) {
    return "completed";
  }

  const status = args.providerStatus.trim().toLowerCase();

  if (
    status === "failed" ||
    status === "failure" ||
    status === "error" ||
    status === "rejected" ||
    status === "canceled" ||
    status === "cancelled"
  ) {
    return "failed";
  }

  if (args.failureMessage) {
    return "failed";
  }

  return "processing";
}
