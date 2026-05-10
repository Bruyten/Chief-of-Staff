// Lightweight client-side state for the app.
// Supports TWO modes:
//   - "mock"  — uses hardcoded seed data (works with no backend running)
//   - "live"  — talks to the real Express backend through apiClient
//
// The toggle lives in localStorage so it survives reloads.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  mockUser, mockProjects, mockProducts, mockOutputs,
  type MockUser, type MockProject, type MockProduct, type MockOutput, type OutputType,
} from "./mock/data";
import {
  auth,
  projects as projectsApi,
  products as productsApi,
  outputs as outputsApi,
  generate as generateApi,
  account as accountApi,
  billing as billingApi,
  friendlyError,
} from"./lib/apiClient";

export type AppPage =
  | "login" | "dashboard" | "new-task" | "projects"
  | "project-detail" | "saved-outputs" | "templates" | "settings" | "pricing";

export type Mode = "mock" | "live";

type Toast = { id: string; text: string; tone?: "success" | "info" | "danger" };

type AppContextShape = {
  // routing
  page: AppPage;
  navigate: (page: AppPage, params?: Record<string, string>) => void;
  params: Record<string, string>;

  // mode
  mode: Mode;
  setMode: (m: Mode) => void;

  // session
  isAuthed: boolean;
  user: MockUser;            // shape works for both — live data is mapped to it
  loginWith: (email: string, password: string) => Promise<void>;
  signupWith: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  upgradePlanLocal: (plan: "starter" | "pro" | "agency", credits: number) => void;

  // data
  projects: MockProject[];
  products: MockProduct[];
  outputs: MockOutput[];
  loadingData: boolean;
  refetchAll: () => Promise<void>;

  // mutations
  saveOutput: (output: Omit<MockOutput, "id" | "createdAt" | "userId">) => Promise<MockOutput>;
  updateOutput: (id: string, patch: { title?: string; content?: string }) => Promise<void>;
  deleteOutput: (id: string) => Promise<void>;
  createProject: (data: { name: string; niche: string; emoji?: string }) => Promise<MockProject>;

  // AI
  runGeneration: (skill: OutputType, projectId: string, context: Record<string, string>) => Promise<string>;

  // draft (for New Task → Output flow)
  draft: { templateId: OutputType | null; content: string | null; title: string | null; projectId: string | null };
  setDraft: (d: AppContextShape["draft"]) => void;

  // toast
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
};

const Ctx = createContext<AppContextShape | null>(null);

const MODE_KEY = "cos_mode";
function loadMode(): Mode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === "mock" ? "mock" : "live";
  } catch { return "live"; }
}

// ---------- Adapters: live API → MockProject/MockOutput shapes ----------
function toMockProject(p: Project): MockProject {
  return {
    id: p.id,
    name: p.name,
    niche: p.niche ?? "—",
    brandVoice: p.brandVoice ?? undefined,
    productCount: p.productCount,
    outputCount: p.outputCount,
    createdAt: p.createdAt,
    emoji: p.emoji ?? "✨",
  };
}
function toMockOutput(o: Output): MockOutput {
  return {
    id: o.id,
    userId: "—",
    projectId: o.projectId ?? "",
    projectName: o.projectName ?? "—",
    type: o.type as OutputType,
    title: o.title,
    content: o.content,
    createdAt: o.createdAt,
  };
}
function toMockUser(u: User): MockUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.email.split("@")[0]!,
    plan: u.plan,
    credits: u.credits,
    creditsMax: u.creditsMax,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<AppPage>("login");
  const [params, setParams] = useState<Record<string, string>>({});
  const [mode, setModeState] = useState<Mode>(loadMode());
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState<MockUser>(mockUser);
  const [projects, setProjects] = useState<MockProject[]>(mockProjects);
  const [products] = useState<MockProduct[]>(mockProducts);
  const [outputs, setOutputs] = useState<MockOutput[]>(mockOutputs);
  const [loadingData, setLoadingData] = useState(false);
  const [draft, setDraft] = useState<AppContextShape["draft"]>({
    templateId: null, content: null, title: null, projectId: null,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback<AppContextShape["toast"]>((text, tone = "success") => {
    const id = `t_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);

  const navigate = useCallback<AppContextShape["navigate"]>((p, ps) => {
    setPage(p);
    setParams(ps ?? {});
    setTimeout(() => {
      document.getElementById("app-main-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }, []);

  const setMode = useCallback((m: Mode) => {
    try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ }
    setModeState(m);
    // Reset session — switching modes signs you out
    setIsAuthed(false);
    setPage("login");
    if (m === "mock") {
      setUser(mockUser);
      setProjects(mockProjects);
      setOutputs(mockOutputs);
    }
  }, []);

  // ---------- Live data loaders ----------
  const refetchAll = useCallback(async () => {
    if (mode !== "live" || !isAuthed) return;
    setLoadingData(true);
    try {
      const [pj, op] = await Promise.all([projectsApi.list(), outputsApi.list()]);
      setProjects(pj.projects.map(toMockProject));
      setOutputs(op.outputs.map(toMockOutput));
    } catch (e) {
      toast(friendlyError(e), "danger");
    } finally {
      setLoadingData(false);
    }
  }, [mode, isAuthed, toast]);

  // Auto-load when entering live mode + signed in
  const didInitialFetch = useRef(false);
  useEffect(() => {
    if (mode === "live" && isAuthed && !didInitialFetch.current) {
      didInitialFetch.current = true;
      refetchAll();
    }
    if (!isAuthed) didInitialFetch.current = false;
  }, [mode, isAuthed, refetchAll]);

  // On boot: in live mode, try to hydrate the session from /api/auth/me
  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;
    (async () => {
      try {
        const { user: u } = await auth.me();
        if (!cancelled) {
          setUser(toMockUser(u));
          setIsAuthed(true);
          setPage("dashboard");
        }
      } catch {
        /* not signed in — stay on login */
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  // ---------- Auth actions (mode-aware) ----------
  const loginWith = useCallback(async (email: string, password: string) => {
    if (mode === "mock") {
      setIsAuthed(true);
      setPage("dashboard");
      return;
    }
    const { user: u } = await auth.login({ email, password });
    setUser(toMockUser(u));
    setIsAuthed(true);
    setPage("dashboard");
  }, [mode]);

  const signupWith = useCallback(async (email: string, password: string, name: string) => {
    if (mode === "mock") {
      setIsAuthed(true);
      setPage("dashboard");
      return;
    }
    const { user: u } = await auth.signup({ email, password, name });
    setUser(toMockUser(u));
    setIsAuthed(true);
    setPage("dashboard");
  }, [mode]);

  const logout = useCallback(async () => {
    if (mode === "live") {
      try { await auth.logout(); } catch { /* ignore */ }
    }
    setIsAuthed(false);
    setPage("login");
  }, [mode]);

  const refreshUser = useCallback(async () => {
    if (mode !== "live") return;
    try {
      const { user: u } = await auth.me();
      setUser(toMockUser(u));
    } catch { /* ignore */ }
  }, [mode]);

  const upgradePlanLocal = useCallback((plan: "starter" | "pro" | "agency", credits: number) => {
    setUser((u) => ({ ...u, plan, credits, creditsMax: credits }));
  }, []);

  // ---------- Data mutations (mode-aware) ----------
  const saveOutput = useCallback<AppContextShape["saveOutput"]>(async (data) => {
    if (mode === "mock") {
      const o: MockOutput = { ...data, id: `o_${Date.now()}`, userId: user.id, createdAt: new Date().toISOString() };
      setOutputs((prev) => [o, ...prev]);
      return o;
    }
    const { output } = await outputsApi.create({
      projectId: data.projectId || undefined,
      type: data.type,
      title: data.title,
      content: data.content,
    });
    const mapped = toMockOutput(output);
    mapped.projectName = data.projectName;
    setOutputs((prev) => [mapped, ...prev]);
    return mapped;
  }, [mode, user.id]);

  const deleteOutput = useCallback<AppContextShape["deleteOutput"]>(async (id) => {
    if (mode === "live") {
      await outputsApi.delete(id);
    }
    setOutputs((prev) => prev.filter((o) => o.id !== id));
  }, [mode]);

  const updateOutput = useCallback<AppContextShape["updateOutput"]>(async (id, patch) => {
    if (mode === "live") {
      await outputsApi.update(id, patch);
    }
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, [mode]);

  const createProject = useCallback<AppContextShape["createProject"]>(async (data) => {
    if (mode === "mock") {
      const p: MockProject = {
        id: `p_${Date.now()}`,
        name: data.name,
        niche: data.niche,
        emoji: data.emoji ?? "✨",
        productCount: 0,
        outputCount: 0,
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [p, ...prev]);
      return p;
    }
    const { project } = await projectsApi.create({
      name: data.name,
      niche: data.niche,
      emoji: data.emoji,
    });
    const mapped = toMockProject({ ...project, productCount: 0, outputCount: 0 });
    setProjects((prev) => [mapped, ...prev]);
    return mapped;
  }, [mode]);

  // ---------- AI generation ----------
  const runGeneration = useCallback<AppContextShape["runGeneration"]>(async (skill, projectId, context) => {
    if (mode === "mock") {
      // Mock mode keeps the old behavior (canned example output via NewTaskPage).
      throw new Error("USE_MOCK_FALLBACK");
    }
    try {
      const result = await generateApi.run(skill, { projectId: projectId || undefined, context });
      // Keep credits in sync with what the server returned
      setUser((u) => ({ ...u, credits: result.creditsRemaining }));
      return result.content;
    } catch (e) {
      if (e instanceof ApiException && e.code === "OUT_OF_CREDITS") {
        toast("Out of credits this month — upgrade to keep going.", "danger");
      } else {
        toast(friendlyError(e), "danger");
      }
      throw e;
    }
  }, [mode, toast]);

  const value = useMemo<AppContextShape>(
    () => ({
      page, navigate, params,
      mode, setMode,
      isAuthed, user,
      loginWith, signupWith, logout, refreshUser, upgradePlanLocal,
      projects, products, outputs,
      loadingData, refetchAll,
      saveOutput, updateOutput, deleteOutput, createProject,
      runGeneration,
      draft, setDraft,
      toasts, toast,
    }),
    [
      page, navigate, params, mode, setMode, isAuthed, user,
      loginWith, signupWith, logout, refreshUser, upgradePlanLocal,
      projects, products, outputs, loadingData, refetchAll,
      saveOutput, updateOutput, deleteOutput, createProject, runGeneration,
      draft, toasts, toast,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
