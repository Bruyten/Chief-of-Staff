import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  mockOutputs,
  mockProducts,
  mockProjects,
  mockUser,
  type MockOutput,
  type MockProduct,
  type MockProject,
  type MockUser,
  type OutputType,
} from "./mock/data";
import {
  ApiException,
  auth,
  friendlyError,
  generate as generateApi,
  outputs as outputsApi,
  projects as projectsApi,
  type Output,
  type Project,
  type User,
} from "./lib/apiClient";

export type AppPage =
  | "login"
  | "dashboard"
  | "new-task"
  | "projects"
  | "project-detail"
  | "product-library"
  | "saved-outputs"
  | "templates"
  | "settings"
  | "pricing"
  | "brand-voices"
  | "chief-chat"
  | "workflows"
  | "workflow-run"
  | "automations"
  | "video-studio";

export type Mode = "mock" | "live";

type Toast = {
  id: string;
  text: string;
  tone?: "success" | "info" | "danger";
};

type Draft = {
  templateId: OutputType | null;
  content: string | null;
  title: string | null;
  projectId: string | null;
};

type CreateProjectInput = {
  name: string;
  niche: string;
  emoji?: string;
  campaignGoal?: string;
  targetAudience?: string;
  offer?: string;
  campaignStatus?: "planning" | "active" | "paused" | "completed";
  launchDate?: string;
  brandVoiceProfileId?: string | null;
};

type UpdateProjectInput = Partial<CreateProjectInput> & {
  brandVoice?: string;
};

type AppContextShape = {
  page: AppPage;
  navigate: (page: AppPage, params?: Record<string, unknown>) => void;
  params: Record<string, unknown>;
  mode: Mode;
  setMode: (m: Mode) => void;
  isAuthed: boolean;
  user: MockUser;
  loginWith: (email: string, password: string) => Promise<void>;
  signupWith: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  upgradePlanLocal: (
    plan: "starter" | "pro" | "agency",
    textCredits: number,
    videoCredits?: number,
  ) => void;
  setCreditsLocal: (textCredits: number, videoCredits?: number) => void;
  projects: MockProject[];
  products: MockProduct[];
  outputs: MockOutput[];
  loadingData: boolean;
  refetchAll: () => Promise<void>;
  saveOutput: (
    output: Omit<MockOutput, "id" | "userId" | "createdAt">,
  ) => Promise<MockOutput>;
  updateOutput: (
    id: string,
    patch: { title?: string; content?: string },
  ) => Promise<void>;
  deleteOutput: (id: string) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<MockProject>;
  updateProject: (
    id: string,
    data: UpdateProjectInput,
  ) => Promise<MockProject>;
  deleteProject: (id: string) => Promise<void>;
  runGeneration: (
    skill: OutputType,
    projectId: string,
    context: Record<string, unknown>,
  ) => Promise<string>;
  draft: Draft;
  setDraft: (d: Draft) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
};

const Ctx = createContext<AppContextShape | null>(null);

const MODE_KEY = "cos_mode";

function loadMode(): Mode {
  try {
    const value = localStorage.getItem(MODE_KEY);
    return value === "mock" ? "mock" : "live";
  } catch {
    return "live";
  }
}

function toMockProject(project: Project): MockProject {
  return {
    id: project.id,
    name: project.name,
    niche: project.niche ?? "—",
    brandVoice: project.brandVoice ?? undefined,
    emoji: project.emoji ?? "✨",
    productCount: project.productCount ?? project.products?.length ?? 0,
    outputCount: project.outputCount ?? project.outputs?.length ?? 0,
    workflowRunCount:
      project.workflowRunCount ?? project.workflowRuns?.length ?? 0,
    chatCount: project.chatCount ?? project.chatConversations?.length ?? 0,
    automationCount: project.automationCount ?? 0,
    campaignGoal: project.campaignGoal ?? undefined,
    targetAudience: project.targetAudience ?? undefined,
    offer: project.offer ?? undefined,
    campaignStatus: project.campaignStatus ?? "planning",
    launchDate: project.launchDate ?? null,
    brandVoiceProfileId: project.brandVoiceProfileId ?? null,
    brandVoiceProfile: project.brandVoiceProfile
      ? {
          id: project.brandVoiceProfile.id,
          brandName: project.brandVoiceProfile.brandName,
        }
      : null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt ?? project.createdAt,
  };
}

function toMockOutput(output: Output): MockOutput {
  return {
    id: output.id,
    userId: "—",
    projectId: output.projectId ?? "",
    projectName: output.projectName ?? "—",
    projectEmoji: output.projectEmoji ?? null,
    type: output.type as OutputType,
    title: output.title,
    content: output.content,
    createdAt: output.createdAt,
  };
}

function toMockUser(user: User): MockUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email.split("@")[0] ?? "User",
    plan: user.plan,
    credits: user.credits,
    creditsMax: user.creditsMax,
    videoCredits: user.videoCredits,
    videoCreditsMax: user.videoCreditsMax,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<AppPage>("login");
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [mode, setModeState] = useState<Mode>(loadMode());
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState<MockUser>(mockUser);
  const [projects, setProjects] = useState<MockProject[]>(mockProjects);
  const [products] = useState<MockProduct[]>(mockProducts);
  const [outputs, setOutputs] = useState<MockOutput[]>(mockOutputs);
  const [loadingData, setLoadingData] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    templateId: null,
    content: null,
    title: null,
    projectId: null,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (text: string, tone: Toast["tone"] = "success") => {
      const id = `t_${Date.now()}_${Math.random()}`;

      setToasts((prev) => [...prev, { id, text, tone }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((entry) => entry.id !== id));
      }, 2800);
    },
    [],
  );

  const navigate = useCallback(
    (nextPage: AppPage, nextParams?: Record<string, unknown>) => {
      setPage(nextPage);
      setParams(nextParams ?? {});

      window.setTimeout(() => {
        document.getElementById("app-main-scroll")?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 0);
    },
    [],
  );

  const setMode = useCallback((nextMode: Mode) => {
    try {
      localStorage.setItem(MODE_KEY, nextMode);
    } catch {
      // Ignore storage failures.
    }

    setModeState(nextMode);
    setIsAuthed(false);
    setPage("login");

    if (nextMode === "mock") {
      setUser(mockUser);
      setProjects(mockProjects);
      setOutputs(mockOutputs);
    }
  }, []);

  const refetchAll = useCallback(async () => {
    if (mode !== "live" || !isAuthed) {
      return;
    }

    setLoadingData(true);

    try {
      const [projectResponse, outputResponse] = await Promise.all([
        projectsApi.list(),
        outputsApi.list(),
      ]);

      setProjects(projectResponse.projects.map(toMockProject));
      setOutputs(outputResponse.outputs.map(toMockOutput));
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoadingData(false);
    }
  }, [isAuthed, mode, toast]);

  const didInitialFetch = useRef(false);

  useEffect(() => {
    if (mode === "live" && isAuthed && !didInitialFetch.current) {
      didInitialFetch.current = true;
      void refetchAll();
    }

    if (!isAuthed) {
      didInitialFetch.current = false;
    }
  }, [isAuthed, mode, refetchAll]);

  useEffect(() => {
    if (mode !== "live") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { user: liveUser } = await auth.me();

        if (!cancelled) {
          setUser(toMockUser(liveUser));
          setIsAuthed(true);
          setPage("dashboard");
        }
      } catch {
        // Not signed in.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const loginWith = useCallback(
    async (email: string, password: string) => {
      if (mode === "mock") {
        setIsAuthed(true);
        setPage("dashboard");
        return;
      }

      const { user: liveUser } = await auth.login({ email, password });

      setUser(toMockUser(liveUser));
      setIsAuthed(true);
      setPage("dashboard");
    },
    [mode],
  );

  const signupWith = useCallback(
    async (email: string, password: string, name: string) => {
      if (mode === "mock") {
        setIsAuthed(true);
        setPage("dashboard");
        return;
      }

      const { user: liveUser } = await auth.signup({
        email,
        password,
        name,
      });

      setUser(toMockUser(liveUser));
      setIsAuthed(true);
      setPage("dashboard");
    },
    [mode],
  );

  const logout = useCallback(async () => {
    if (mode === "live") {
      try {
        await auth.logout();
      } catch {
        // Ignore logout request failures and clear local UI state anyway.
      }
    }

    setIsAuthed(false);
    setPage("login");
  }, [mode]);

  const refreshUser = useCallback(async () => {
    if (mode !== "live") {
      return;
    }

    try {
      const { user: liveUser } = await auth.me();
      setUser(toMockUser(liveUser));
    } catch {
      // Ignore refresh failures.
    }
  }, [mode]);

  const upgradePlanLocal = useCallback(
    (
      plan: "starter" | "pro" | "agency",
      textCredits: number,
      videoCredits =
        plan === "agency" ? 10 : plan === "pro" ? 3 : 0,
    ) => {
      setUser((current) => ({
        ...current,
        plan,
        credits: textCredits,
        creditsMax: textCredits,
        videoCredits,
        videoCreditsMax: videoCredits,
      }));
    },
    [],
  );

  const setCreditsLocal = useCallback(
    (textCredits: number, videoCredits?: number) => {
      setUser((current) => ({
        ...current,
        credits: textCredits,
        ...(videoCredits !== undefined ? { videoCredits } : {}),
      }));
    },
    [],
  );

  const saveOutput = useCallback(
    async (
      data: Omit<MockOutput, "id" | "userId" | "createdAt">,
    ): Promise<MockOutput> => {
      if (mode === "mock") {
        const output: MockOutput = {
          ...data,
          id: `o_${Date.now()}`,
          userId: user.id,
          createdAt: new Date().toISOString(),
        };

        setOutputs((prev) => [output, ...prev]);
        return output;
      }

      const { output } = await outputsApi.create({
        projectId: data.projectId || undefined,
        productId: data.productId,
        type: data.type,
        title: data.title,
        content: data.content,
        inputSnapshot: {},
      });

      const mapped = toMockOutput(output);
      mapped.projectName = data.projectName;
      mapped.projectEmoji = data.projectEmoji;

      setOutputs((prev) => [mapped, ...prev]);

      return mapped;
    },
    [mode, user.id],
  );

  const deleteOutput = useCallback(
    async (id: string) => {
      if (mode === "live") {
        await outputsApi.delete(id);
      }

      setOutputs((prev) => prev.filter((output) => output.id !== id));
    },
    [mode],
  );

  const updateOutput = useCallback(
    async (
      id: string,
      patch: { title?: string; content?: string },
    ) => {
      if (mode === "live") {
        await outputsApi.update(id, patch);
      }

      setOutputs((prev) =>
        prev.map((output) =>
          output.id === id ? { ...output, ...patch } : output,
        ),
      );
    },
    [mode],
  );

  const createProject = useCallback(
    async (data: CreateProjectInput): Promise<MockProject> => {
      if (mode === "mock") {
        const project: MockProject = {
          id: `p_${Date.now()}`,
          name: data.name,
          niche: data.niche,
          emoji: data.emoji ?? "✨",
          productCount: 0,
          outputCount: 0,
          workflowRunCount: 0,
          chatCount: 0,
          automationCount: 0,
          campaignGoal: data.campaignGoal,
          targetAudience: data.targetAudience,
          offer: data.offer,
          campaignStatus: data.campaignStatus ?? "planning",
          launchDate: data.launchDate ?? null,
          brandVoiceProfileId: data.brandVoiceProfileId ?? null,
          brandVoiceProfile: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setProjects((prev) => [project, ...prev]);
        return project;
      }

      const { project } = await projectsApi.create(data);
      const mapped = toMockProject(project);

      setProjects((prev) => [mapped, ...prev]);

      return mapped;
    },
    [mode],
  );

  const updateProject = useCallback(
    async (
      id: string,
      data: UpdateProjectInput,
    ): Promise<MockProject> => {
      if (mode === "mock") {
        let updated: MockProject | null = null;

        setProjects((prev) =>
          prev.map((project) => {
            if (project.id !== id) {
              return project;
            }

            updated = {
              ...project,
              ...data,
              updatedAt: new Date().toISOString(),
            };

            return updated;
          }),
        );

        if (!updated) {
          throw new Error("Project not found");
        }

        return updated;
      }

      const { project } = await projectsApi.update(id, data);
      const mapped = toMockProject(project);

      setProjects((prev) =>
        prev.map((entry) => (entry.id === id ? mapped : entry)),
      );

      return mapped;
    },
    [mode],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (mode === "live") {
        await projectsApi.delete(id);
      }

      setProjects((prev) => prev.filter((project) => project.id !== id));
      setOutputs((prev) => prev.filter((output) => output.projectId !== id));
    },
    [mode],
  );

  const runGeneration = useCallback(
    async (
      skill: OutputType,
      projectId: string,
      context: Record<string, unknown>,
    ) => {
      if (mode === "mock") {
        throw new Error("USE_MOCK_FALLBACK");
      }

      try {
        const result = await generateApi.run(skill, {
          projectId: projectId || undefined,
          context,
        });

        setUser((current) => ({
          ...current,
          credits: result.creditsRemaining,
        }));

        return result.content;
      } catch (error) {
        if (
          error instanceof ApiException &&
          error.code === "PAYMENT_REQUIRED"
        ) {
          toast(error.message || "Out of text credits this month.", "danger");
        } else {
          toast(friendlyError(error), "danger");
        }

        throw error;
      }
    },
    [mode, toast],
  );

  const value = useMemo<AppContextShape>(
    () => ({
      page,
      navigate,
      params,
      mode,
      setMode,
      isAuthed,
      user,
      loginWith,
      signupWith,
      logout,
      refreshUser,
      upgradePlanLocal,
      setCreditsLocal,
      projects,
      products,
      outputs,
      loadingData,
      refetchAll,
      saveOutput,
      updateOutput,
      deleteOutput,
      createProject,
      updateProject,
      deleteProject,
      runGeneration,
      draft,
      setDraft,
      toasts,
      toast,
    }),
    [
      page,
      navigate,
      params,
      mode,
      setMode,
      isAuthed,
      user,
      loginWith,
      signupWith,
      logout,
      refreshUser,
      upgradePlanLocal,
      setCreditsLocal,
      projects,
      products,
      outputs,
      loadingData,
      refetchAll,
      saveOutput,
      updateOutput,
      deleteOutput,
      createProject,
      updateProject,
      deleteProject,
      runGeneration,
      draft,
      toasts,
      toast,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error("useApp must be inside AppProvider");
  }

  return ctx;
}
