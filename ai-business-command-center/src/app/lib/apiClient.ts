// Single fetch wrapper for the entire frontend.
// All app pages talk to the backend through this file ONLY — so when we
// later move from localhost to Render, we change one constant.

// In dev, point at the local Express server. In production, Vite injects
// VITE_API_URL at build time. If neither is set, fall back to same-origin
// (which is what render.yaml's static-site rewrites assume).
const BASE_URL =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  "http://cheif-of-staff-api-2687.onrender.com";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[]>;
};

export class ApiException extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[]>;
  constructor(err: ApiError) {
    super(err.message);
    this.status = err.status;
    this.code = err.code;
    this.fields = err.fields;
    this.name = "ApiException";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

/** Core fetch — handles JSON, cookies, and error shape normalization. */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = opts;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",                      // send the JWT cookie
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    // Network failure / CORS / server down
    throw new ApiException({
      status: 0,
      code: "NETWORK",
      message: "Can't reach the server. Check your connection.",
    });
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { /* leave null */ }
  }

  if (!res.ok) {
    const errBody = (payload as { error?: Partial<ApiError> })?.error;
    throw new ApiException({
      status: res.status,
      code: errBody?.code ?? "ERROR",
      message: errBody?.message ?? `Request failed (${res.status})`,
      fields: errBody?.fields,
    });
  }

  return payload as T;
}

// ---------- Typed endpoints ----------

export type User = {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "starter" | "pro" | "agency";
  credits: number;
  creditsMax: number;
};

export type Project = {
  id: string;
  name: string;
  niche: string | null;
  brandVoice: string | null;
  emoji: string | null;
  productCount: number;
  outputCount: number;
  createdAt: string;
};

export type Output = {
  id: string;
  type: string;
  title: string;
  content: string;
  projectId: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  createdAt: string;
};

export type GenerateResult = {
  taskId: string;
  skill: string;
  content: string;
  meta: { model: string; tokensIn: number; tokensOut: number; latencyMs: number; fake: boolean };
  creditsRemaining: number;
};

export const auth = {
  signup: (data: { email: string; password: string; name?: string }) =>
    api<{ user: User }>("/api/auth/signup", { method: "POST", body: data }),
  login: (data: { email: string; password: string }) =>
    api<{ user: User }>("/api/auth/login", { method: "POST", body: data }),
  logout: () => api<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => api<{ user: User }>("/api/auth/me"),
};

export const projects = {
  list: () => api<{ projects: Project[] }>("/api/projects"),
  create: (data: { name: string; niche?: string; brandVoice?: string; emoji?: string }) =>
    api<{ project: Project }>("/api/projects", { method: "POST", body: data }),
  delete: (id: string) => api<{ ok: true }>(`/api/projects/${id}`, { method: "DELETE" }),
};

export const outputs = {
  list: (params?: { projectId?: string; type?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.projectId) q.set("projectId", params.projectId);
    if (params?.type) q.set("type", params.type);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return api<{ outputs: Output[] }>(`/api/outputs${qs ? `?${qs}` : ""}`);
  },
  create: (data: { projectId?: string; type: string; title: string; content: string; inputSnapshot?: Record<string, unknown> }) =>
    api<{ output: Output }>("/api/outputs", { method: "POST", body: data }),
  update: (id: string, data: { title?: string; content?: string }) =>
    api<{ output: Output }>(`/api/outputs/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => api<{ ok: true }>(`/api/outputs/${id}`, { method: "DELETE" }),
};

export const generate = {
  run: (skill: string, data: { projectId?: string; context: Record<string, unknown> }) =>
    api<GenerateResult>(`/api/generate/${skill}`, { method: "POST", body: data }),
};

export const account = {
  updateProfile: (data: { name: string }) =>
    api<{ user: User }>("/api/account/profile", { method: "PATCH", body: data }),
};

// ----- Billing -----
export type BillingPlan = {
  id: "free" | "starter" | "pro" | "agency";
  name: string;
  priceUsd: number;
  credits: number;
  features: string[];
};

export type BillingMe = {
  plan: BillingPlan["id"];
  credits: number;
  creditsMax: number;
  hasStripeCustomer: boolean;
  subscription: { status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: string } | null;
  fakeStripe: boolean;
};

export const billing = {
  plans: () => api<{ plans: BillingPlan[]; fakeStripe: boolean }>("/api/billing/plans"),
  me: () => api<BillingMe>("/api/billing/me"),
  checkout: (plan: "starter" | "pro" | "agency") =>
    api<{ url: string }>("/api/billing/checkout", { method: "POST", body: { plan } }),
  portal: () => api<{ url: string }>("/api/billing/portal", { method: "POST" }),
  // Fake-mode shortcuts
  simulateSuccess: (plan: "starter" | "pro" | "agency") =>
    api<{ ok: true }>("/api/billing/simulate-success", { method: "POST", body: { plan } }),
  simulateCancel: () =>
    api<{ ok: true }>("/api/billing/simulate-cancel", { method: "POST" }),
};

/** Friendly message for any ApiException, ready to drop in a toast. */
export function friendlyError(e: unknown): string {
  if (e instanceof ApiException) {
    switch (e.code) {
      case "NETWORK":         return "Can't reach the server. Is it running?";
      case "VALIDATION":      return "Please check the highlighted fields.";
      case "UNAUTHORIZED":    return "Your session expired. Please sign in again.";
      case "OUT_OF_CREDITS":  return "You're out of credits this month.";
      case "RATE_LIMITED":    return "Slow down — too many requests.";
      case "FORBIDDEN":       return "You don't have access to that.";
      case "NOT_FOUND":       return "We couldn't find that.";
      case "CONFLICT":        return e.message;
      default:                return e.message || "Something went wrong.";
    }
  }
  return "Unexpected error.";
}
