import {
  ApiException,
  type VideoJob,
} from "./apiClient";

const BASE_URL =
  (import.meta as { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL || "http://localhost:4000";

export type VideoJobCreatePayload = {
  title: string;
  sourceType: VideoJob["sourceType"];
  projectId?: string | null;
  sourceOutputId?: string | null;
  sourceWorkflowRunId?: string | null;
  useCase: VideoJob["useCase"];
  aspectRatio: VideoJob["aspectRatio"];
  durationSeconds: VideoJob["durationSeconds"];
  toneStyle: string;
  cta?: string;
  referenceImageInstructions?: string;
};

export async function createVideoJobWithImages(
  payload: VideoJobCreatePayload,
  images: File[],
): Promise<{
  job: VideoJob;
  videoCreditsRemaining: number;
}> {
  const csrfToken = await fetchCsrfToken();

  const body = new FormData();

  body.append("title", payload.title);
  body.append("sourceType", payload.sourceType);
  body.append("useCase", payload.useCase);
  body.append("aspectRatio", payload.aspectRatio);
  body.append("durationSeconds", String(payload.durationSeconds));
  body.append("toneStyle", payload.toneStyle);

  if (payload.projectId) {
    body.append("projectId", payload.projectId);
  }

  if (payload.sourceOutputId) {
    body.append("sourceOutputId", payload.sourceOutputId);
  }

  if (payload.sourceWorkflowRunId) {
    body.append(
      "sourceWorkflowRunId",
      payload.sourceWorkflowRunId,
    );
  }

  if (payload.cta) {
    body.append("cta", payload.cta);
  }

  if (payload.referenceImageInstructions) {
    body.append(
      "referenceImageInstructions",
      payload.referenceImageInstructions,
    );
  }

  images.forEach((image) => {
    body.append("referenceImages", image);
  });

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}/api/video-studio/jobs`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRF-Token": csrfToken,
      },
      body,
    });
  } catch {
    throw new ApiException({
      status: 0,
      code: "NETWORK",
      message: "Can't reach the server. Check your connection.",
    });
  }

  const parsed = await parseResponse(response);

  if (!response.ok) {
    const errBody = (
      parsed as {
        error?: {
          code?: string;
          message?: string;
          fields?: Record<string, string[]>;
        };
      } | null
    )?.error;

    throw new ApiException({
      status: response.status,
      code: errBody?.code ?? "ERROR",
      message:
        errBody?.message ??
        `Video upload request failed (${response.status})`,
      fields: errBody?.fields,
    });
  }

  return parsed as {
    job: VideoJob;
    videoCreditsRemaining: number;
  };
}

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/csrf`, {
    method: "GET",
    credentials: "include",
  });

  const parsed = await parseResponse(response);

  if (!response.ok) {
    throw new ApiException({
      status: response.status,
      code: "CSRF_TOKEN_FETCH_FAILED",
      message:
        "Could not initialize request security. Refresh and try again.",
    });
  }

  const token = (
    parsed as {
      token?: string;
    } | null
  )?.token;

  if (!token) {
    throw new ApiException({
      status: 500,
      code: "CSRF_TOKEN_MISSING",
      message:
        "Request security token was not returned by the server.",
    });
  }

  return token;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
