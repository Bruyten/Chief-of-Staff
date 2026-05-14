// Single fetch wrapper for the entire frontend.
// All app pages talk to the backend through this file only.

const BASE_URL =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  "http://localhost:4000";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[] | undefined>;
};

export class ApiException extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[] | undefined>;

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

function readCookie(name: string) {
  const prefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return value ? decodeURIComponent(value.slice(prefix.length)) : "";
}

async function ensureCsrfCookie() {
  const existing = readCookie("cos_csrf");
  if (existing) return existing;

  await fetch(`${BASE_URL}/api/auth/csrf`, {
    method: "GET",
    credentials: "include",
  });

  return readCookie("cos_csrf");
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = opts;
  const mutating = method !== "GET";
  const csrfToken = mutating ? await ensureCsrfCookie() : "";

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(mutating && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiException({
      status: 0,
      code: "NETWORK",
      message: "Can't reach the server. Check your connection.",
    });
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const errBody = (payload as { error?: Partial<ApiError> } | null)?.error;
    throw new ApiException({
      status: res.status,
      code: errBody?.code ?? "ERROR",
      message: errBody?.message ?? `Request failed (${res.status})`,
      fields: errBody?.fields,
    });
  }

  return payload as T;
}

export type User = {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "starter" | "pro" | "agency";
  credits: number;
  creditsMax: number;
  videoCredits: number;
  videoCreditsMax: number;
};

export type BrandVoiceProfile = {
  id: string;
  userId: string;
  brandName: string;
  businessType: string | null;
  targetAudience: string | null;
  primaryOffer: string | null;
  toneOfVoice: string | null;
  valueProposition: string | null;
  preferredCtas: string | null;
  bannedPhrases: string | null;
  differentiators: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  niche: string | null;
  brandVoice: string | null;
  emoji: string | null;
  campaignGoal: string | null;
  targetAudience: string | null;
  offer: string | null;
  campaignStatus: "planning" | "active" | "paused" | "completed" | null;
  launchDate: string | null;
  brandVoiceProfileId: string | null;
  brandVoiceProfile?: { id: string; brandName: string } | BrandVoiceProfile | null;
  productCount: number;
  outputCount: number;
  workflowRunCount?: number;
  chatCount?: number;
  automationCount?: number;
  createdAt: string;
  updatedAt?: string;
  products?: Product[];
  outputs?: Output[];
  workflowRuns?: WorkflowRun[];
  chatConversations?: ChatConversation[];
};

export type Product = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  audience: string | null;
  painPoint: string | null;
  benefits: string | null;
  price: string | null;
  offerType: string | null;
  cta: string | null;
  createdAt: string;
  updatedAt: string;
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
  meta: {
    model: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    fake: boolean;
  };
  creditsRemaining: number;
};

export type ChatConversation = {
  id: string;
  userId: string;
  projectId: string | null;
  brandVoiceProfileId: string | null;
  title: string | null;
  archivedAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; emoji: string | null } | null;
  brandVoiceProfile?: { id: string; brandName: string } | null;
  messages?: ChatMessage[];
  _count?: { messages: number };
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  tokensUsed: number;
  model: string | null;
  createdAt: string;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  requiredInputs: string[];
  steps: Array<{
    key: string;
    label: string;
    skill: string;
    outputTitle: string;
  }>;
};

export type WorkflowRunStep = {
  id: string;
  workflowRunId: string;
  outputId: string | null;
  stepKey: string;
  stepLabel: string;
  skill: string;
  status: string;
  input: Record<string, unknown>;
  content: string | null;
  tokensUsed: number;
  errorMsg: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  output?: Output | null;
};

export type WorkflowRun = {
  id: string;
  userId: string;
  projectId: string | null;
  brandVoiceProfileId: string | null;
  templateId: string;
  title: string;
  status: string;
  input: Record<string, unknown>;
  summary: string | null;
  creditsSpent: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; emoji: string | null } | null;
  brandVoiceProfile?: { id: string; brandName: string } | null;
  steps: WorkflowRunStep[];
};

export type Automation = {
  id: string;
  userId: string;
  projectId: string | null;
  brandVoiceProfileId: string | null;
  name: string;
  type: "weekly_content_plan" | "monthly_campaign_ideas" | "weekly_task_recommendation";
  cadence: "weekly" | "monthly";
  enabled: boolean;
  timezone: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  minute: number;
  config: Record<string, unknown>;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; emoji: string | null } | null;
  brandVoiceProfile?: { id: string; brandName: string } | null;
  runs?: AutomationRun[];
};

export type AutomationRun = {
  id: string;
  automationId: string;
  userId: string;
  projectId: string | null;
  brandVoiceProfileId: string | null;
  workflowRunId: string | null;
  outputId: string | null;
  type: string;
  trigger: string;
  status: string;
  creditsRequired: number;
  creditsSpent: number;
  result: Record<string, unknown> | null;
  errorMsg: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VideoJob = {
  id: string;
  userId: string;
  projectId: string | null;
  sourceOutputId: string | null;
  sourceWorkflowRunId: string | null;
  title: string;
  sourceType: "scratch" | "project" | "output" | "workflow_run";
  useCase: "promo_ad" | "product_highlight" | "offer_announcement" | "social_reel";
  aspectRatio: "9:16" | "1:1" | "16:9";
  durationSeconds: 6 | 8 | 12;
  toneStyle: string;
  cta: string | null;
  promptBrief: string;
  provider: string;
  externalJobId: string | null;
  providerStatus: string | null;
  status: string;
  errorMsg: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  pollAttempts: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; emoji: string | null } | null;
  sourceOutput?: { id: string; title: string; type: string } | null;
  sourceWorkflowRun?: { id: string; title: string; status: string } | null;
};

export type DashboardCommandCenter = {
  stats: {
    brandVoiceCount: number;
    projectCount: number;
    outputCount: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    actionLabel: string;
    actionPage:
      | "brand-voices"
      | "workflows"
      | "new-task"
      | "chief-chat"
      | "projects"
      | "saved-outputs";
    actionParams?: Record<string, string>;
  }>;
  activeAutomations: Array<{
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    nextRunAt: string | null;
    lastRunAt: string | null;
    lastStatus: string | null;
    lastError: string | null;
    project: { id: string; name: string; emoji: string | null } | null;
    latestRun: {
      id: string;
      status: string;
      completedAt: string | null;
      errorMsg: string | null;
    } | null;
  }>;
  recentOutputs: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    projectId: string | null;
    createdAt: string;
    updatedAt: string;
    project: { id: string; name: string; emoji: string | null } | null;
  }>;
  recentWorkflowRuns: Array<{
    id: string;
    title: string;
    templateId: string;
    status: string;
    creditsSpent: number;
    startedAt: string;
    completedAt: string | null;
    updatedAt: string;
    project: { id: string; name: string; emoji: string | null } | null;
  }>;
  recentlyActiveProject: {
    id: string;
    name: string;
    emoji: string | null;
    campaignStatus: string | null;
    campaignGoal: string | null;
    targetAudience: string | null;
    offer: string | null;
    launchDate: string | null;
    updatedAt: string;
    _count: {
      outputs: number;
      workflowRuns: number;
      chatConversations: number;
      automations: number;
    };
  } | null;
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
  get: (id: string) => api<{ project: Project }>(`/api/projects/${id}`),
  create: (data: {
    name: string;
    niche?: string;
    brandVoice?: string;
    emoji?: string;
    campaignGoal?: string;
    targetAudience?: string;
    offer?: string;
    campaignStatus?: "planning" | "active" | "paused" | "completed";
    launchDate?: string;
    brandVoiceProfileId?: string | null;
  }) => api<{ project: Project }>("/api/projects", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      niche: string;
      brandVoice: string;
      emoji: string;
      campaignGoal: string;
      targetAudience: string;
      offer: string;
      campaignStatus: "planning" | "active" | "paused" | "completed";
      launchDate: string;
      brandVoiceProfileId: string | null;
    }>
  ) => api<{ project: Project }>(`/api/projects/${id}`, { method: "PATCH", body: data }),
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
  create: (data: {
    projectId?: string;
    productId?: string;
    type: string;
    title: string;
    content: string;
    inputSnapshot?: Record<string, unknown>;
  }) => api<{ output: Output }>("/api/outputs", { method: "POST", body: data }),
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

export type BillingPlan = {
  id: "free" | "starter" | "pro" | "agency";
  name: string;
  priceUsd: number;
  textCredits: number;
  videoCredits: number;
  features: string[];
};

export type BillingMe = {
  plan: BillingPlan["id"];
  textCredits: number;
  textCreditsMax: number;
  videoCredits: number;
  videoCreditsMax: number;
  hasStripeCustomer: boolean;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  } | null;
  fakeStripe: boolean;
};

export const billing = {
  plans: () => api<{ plans: BillingPlan[]; fakeStripe: boolean }>("/api/billing/plans"),
  me: () => api<BillingMe>("/api/billing/me"),
  checkout: (plan: "starter" | "pro" | "agency") =>
    api<{ url: string }>("/api/billing/checkout", { method: "POST", body: { plan } }),
  portal: () => api<{ url: string }>("/api/billing/portal", { method: "POST" }),
  simulateSuccess: (plan: "starter" | "pro" | "agency") =>
    api<{ ok: true }>("/api/billing/simulate-success", { method: "POST", body: { plan } }),
  simulateCancel: () => api<{ ok: true }>("/api/billing/simulate-cancel", { method: "POST" }),
};

export const brandVoices = {
  list: () => api<{ profiles: BrandVoiceProfile[] }>("/api/brand-voices"),
  get: (id: string) => api<{ profile: BrandVoiceProfile }>(`/api/brand-voices/${id}`),
  create: (data: Partial<BrandVoiceProfile> & { brandName: string }) =>
    api<{ profile: BrandVoiceProfile }>("/api/brand-voices", { method: "POST", body: data }),
  update: (id: string, data: Partial<BrandVoiceProfile>) =>
    api<{ profile: BrandVoiceProfile }>(`/api/brand-voices/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => api<{ ok: true }>(`/api/brand-voices/${id}`, { method: "DELETE" }),
};

export const chiefChat = {
  list: () => api<{ conversations: ChatConversation[] }>("/api/chat/conversations"),
  get: (id: string) => api<{ conversation: ChatConversation }>(`/api/chat/conversations/${id}`),
  create: (data: {
    title?: string;
    projectId?: string | null;
    brandVoiceProfileId?: string | null;
  }) => api<{ conversation: ChatConversation }>("/api/chat/conversations", { method: "POST", body: data }),
  update: (id: string, data: { title?: string; archived?: boolean }) =>
    api<{ conversation: ChatConversation }>(`/api/chat/conversations/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => api<{ ok: true }>(`/api/chat/conversations/${id}`, { method: "DELETE" }),
  sendMessage: (id: string, content: string) =>
    api<{
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
      creditsRemaining: number;
    }>(`/api/chat/conversations/${id}/messages`, {
      method: "POST",
      body: { content },
    }),
};

export const workflows = {
  templates: () => api<{ templates: WorkflowTemplate[] }>("/api/workflows/templates"),
  runs: () => api<{ runs: WorkflowRun[] }>("/api/workflows/runs"),
  getRun: (id: string) => api<{ run: WorkflowRun }>(`/api/workflows/runs/${id}`),
  createRun: (data: {
    templateId: string;
    title?: string;
    projectId?: string | null;
    brandVoiceProfileId?: string | null;
    context: Record<string, unknown>;
  }) => api<{ run: WorkflowRun }>("/api/workflows/runs", { method: "POST", body: data }),
};

export const automations = {
  list: () => api<{ automations: Automation[] }>("/api/automations"),
  get: (id: string) => api<{ automation: Automation }>(`/api/automations/${id}`),
  create: (data: {
    name: string;
    type: Automation["type"];
    projectId?: string | null;
    brandVoiceProfileId?: string | null;
    timezone: string;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    hour: number;
    minute: number;
    config: Record<string, unknown>;
  }) => api<{ automation: Automation }>("/api/automations", { method: "POST", body: data }),
  update: (id: string, data: Partial<Automation>) =>
    api<{ automation: Automation }>(`/api/automations/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => api<{ ok: true }>(`/api/automations/${id}`, { method: "DELETE" }),
  enable: (id: string) =>
    api<{ automation: Automation }>(`/api/automations/${id}/enable`, { method: "POST" }),
  disable: (id: string) =>
    api<{ automation: Automation }>(`/api/automations/${id}/disable`, { method: "POST" }),
  runNow: (id: string) =>
    api<{ run: AutomationRun }>(`/api/automations/${id}/run-now`, { method: "POST" }),
  runs: (id: string) => api<{ runs: AutomationRun[] }>(`/api/automations/${id}/runs`),
};

export const dashboard = {
  commandCenter: () => api<DashboardCommandCenter>("/api/dashboard/command-center"),
};

export const videoStudio = {
  jobs: () => api<{ jobs: VideoJob[] }>("/api/video-studio/jobs"),
  get: (id: string) => api<{ job: VideoJob }>(`/api/video-studio/jobs/${id}`),
  create: (data: {
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
  }) =>
    api<{ job: VideoJob; videoCreditsRemaining: number }>("/api/video-studio/jobs", {
      method: "POST",
      body: data,
    }),
  refresh: (id: string) =>
    api<{ job: VideoJob }>(`/api/video-studio/jobs/${id}/refresh`, { method: "POST" }),
};

export function friendlyError(e: unknown): string {
  if (e instanceof ApiException) {
    switch (e.code) {
      case "NETWORK":
        return "Can't reach the server. Is it running?";
      case "VALIDATION":
        return "Please check the highlighted fields.";
      case "UNAUTHORIZED":
        return "Your session expired. Please sign in again.";
      case "FORBIDDEN":
        return "You do not have permission to do that.";
      case "NOT_FOUND":
        return "That item could not be found.";
      case "PAYMENT_REQUIRED":
        return e.message;
      case "RATE_LIMITED":
        return e.message;
      default:
        return e.message || "Something went wrong.";
    }
  }

  return e instanceof Error ? e.message : "Something went wrong.";
}
